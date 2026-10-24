/**
 * Launches every clip in batch/clips.json through the normal launch path (prepareLaunch: create_v2 paid by the platform wallet),
 * one after the other. Dry run by default: every tx is built, signed and simulated against the RPC, nothing is sent,
 * nothing is uploaded, no pool mint is reserved.
 *
 *   npx tsx --conditions react-server scripts/launch-batch.ts --env .env.mainnet            # dry run
 *   BATCH_FEE_RECIPIENT=<addr> npx tsx --conditions react-server scripts/launch-batch.ts --env .env.mainnet --go
 *
 * Flags: --env <file> (default .env.local), --go (really send), --only T1,T2, --limit N.
 * Env: BATCH_FEE_RECIPIENT (creator-fee recipient; defaults to the platform wallet), BATCH_RESERVE_SOL (default 0.005),
 *      BLOB_READ_WRITE_TOKEN (required with --go so the site can show the media; read from .env.local if absent).
 * Launched mints are written back to batch/clips.json (field "mint", "sig") so a rerun skips them.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

function loadEnv(file: string, override: boolean) {
  if (!existsSync(file)) throw new Error(`env file not found: ${file}`);
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const v = m[2].replace(/^"(.*)"$/, "$1");
    if (override || process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (n: string) => args.includes(n);
  const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const go = flag("--go");
  const envFile = opt("--env") ?? ".env.local";
  const preset = { ...process.env };
  loadEnv(envFile, true);
  for (const k of ["BATCH_FEE_RECIPIENT", "BATCH_RESERVE_SOL", "LAUNCH_CU_PRICE"]) if (preset[k] !== undefined) process.env[k] = preset[k];
  if (!process.env.BLOB_READ_WRITE_TOKEN && existsSync(".env.local")) {
    const m = /^BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m.exec(readFileSync(".env.local", "utf8"));
    if (m) process.env.BLOB_READ_WRITE_TOKEN = m[1];
  }
  if (go) {
    process.env.LAUNCH_DRY_RUN = "0";
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("--go needs BLOB_READ_WRITE_TOKEN (public media for the site + metadata).");
    if (!process.env.DATABASE_URL) throw new Error("--go needs DATABASE_URL (mint pool + coins table).");
  } else {
    // Dry run touches nothing: no uploads, no DB (random mint instead of a pool mint), tx only simulated.
    process.env.LAUNCH_DRY_RUN = "1";
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.DATABASE_URL;
  }

  const { Keypair, PublicKey, Transaction, ComputeBudgetProgram } = await import("@solana/web3.js");
  const { PUMP_SDK } = await import("@pump-fun/pump-sdk");
  const { prepareLaunch, validate } = await import("../src/lib/launch");
  const { connection, platformKeypair, isSolAddress } = await import("../src/lib/sol");
  const { putFile } = await import("../src/lib/storage");

  const conn = connection();
  const platform = platformKeypair();
  const recipient = process.env.BATCH_FEE_RECIPIENT || platform.publicKey.toBase58();
  if (!isSolAddress(recipient)) throw new Error("BATCH_FEE_RECIPIENT is not a valid Solana address");
  const reserve = Math.round(Number(process.env.BATCH_RESERVE_SOL ?? 0.005) * 1e9);
  const cluster = /devnet/.test(process.env.SOLANA_RPC_URL ?? "") ? "devnet" : "mainnet";

  const FILE = path.join(process.cwd(), "batch/clips.json");
  const clips: any[] = JSON.parse(readFileSync(FILE, "utf8"));
  const only = opt("--only")?.toUpperCase().split(",");
  const limit = Number(opt("--limit") ?? Infinity);
  let balance = await conn.getBalance(platform.publicKey);
  console.log(`${go ? "LIVE" : "DRY RUN"} on ${cluster} (${process.env.SOLANA_RPC_URL})`);
  console.log(`platform ${platform.publicKey.toBase58()}  balance ${balance / 1e9} SOL  reserve ${reserve / 1e9} SOL  fee recipient ${recipient}\n`);

  // Exact cost of one sponsored create: simulate the same create_v2 + budget ixs the app sends and read the payer's post balance.
  // Rent depends on name + symbol + URI length (Token-2022 metadata lives in the mint), so measure per coin with a URI of production length.
  const URI_LEN = Number(process.env.BATCH_URI_LEN ?? 72); // Vercel Blob m/<8hex>.json ≈ 71, pump.fun ipfs.io/ipfs/Qm… = 67
  async function costOf(name: string, symbol: string): Promise<{ lamports: number; cu: number; err?: string }> {
    const mint = Keypair.generate();
    const uri = "https://" + "x".repeat(URI_LEN - 8);
    const create = await PUMP_SDK.createV2Instruction({ mint: mint.publicKey, name, symbol, uri, creator: new PublicKey(recipient), user: platform.publicKey, mayhemMode: false, holderReward: false });
    const { blockhash } = await conn.getLatestBlockhash();
    const tx = new Transaction({ feePayer: platform.publicKey, recentBlockhash: blockhash }).add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 140_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: Number(process.env.LAUNCH_CU_PRICE ?? 1000) }), create);
    tx.sign(platform, mint);
    const r = await conn.simulateTransaction(tx, undefined, [platform.publicKey]);
    if (r.value.err) return { lamports: 0, cu: 0, err: JSON.stringify(r.value.err) + " " + (r.value.logs ?? []).slice(-3).join(" | ") };
    return { lamports: balance - r.value.accounts![0]!.lamports, cu: r.value.unitsConsumed ?? 0 };
  }

  let done = 0, spent = 0, fails = 0, projected = balance;
  const rows: string[] = [];
  for (const c of clips) {
    if (only && !only.includes(c.ticker)) continue;
    if (done + fails >= limit) break;
    if (c.mint && go) { console.log(`skip ${c.ticker}: already launched ${c.mint}`); continue; }
    try {
      validate({ name: c.name, ticker: c.ticker, recipient, stillRef: "local:drafts/x/still.jpg" } as any);
      if (!existsSync(c.still) || !existsSync(c.loop)) throw new Error("media missing: run scripts/prepare-batch.mts");
      const cost = await costOf(c.name, c.ticker);
      if (cost.err) throw new Error("simulation failed: " + cost.err);
      if (projected - cost.lamports < reserve) { console.log(`stop: ${c.ticker} would cost ${cost.lamports} and break the ${reserve / 1e9} SOL reserve`); break; }
      // Same refs the /launch page produces (drafts/<id>/still.jpg|loop.mp4), so the site renders them like any coin.
      const key = `drafts/batch-${c.ticker.toLowerCase()}`;
      const stillRef = await putFile(`${key}/still.jpg`, readFileSync(c.still), "image/jpeg");
      const loopRef = await putFile(`${key}/loop.mp4`, readFileSync(c.loop), "video/mp4");
      let simErr = "";
      const warn = console.warn; console.warn = (...a: any[]) => { simErr = a.map(String).join(" "); };
      const before = go ? await conn.getBalance(platform.publicKey) : 0;
      const r = await prepareLaunch({ name: c.name, ticker: c.ticker, description: c.description, sourceUrl: c.source, stillRef, loopRef, recipient, feeMode: "creator" })
        .finally(() => { console.warn = warn; });
      if (simErr) throw new Error(simErr);
      let paid = cost.lamports;
      if (go) {
        balance = await conn.getBalance(platform.publicKey);
        paid = before - balance;
        Object.assign(c, { mint: r.mint, sig: r.sig, launchedAt: new Date().toISOString() });
        writeFileSync(FILE, JSON.stringify(clips, null, 2) + "\n");
      }
      projected -= paid; spent += paid; done++;
      const line = `${go ? "LAUNCHED" : "ok (sim)"} $${c.ticker.padEnd(9)} ${c.name.padEnd(24)} ${paid} lamports, ${cost.cu} CU  ${go ? `${r.mint}  https://solscan.io/tx/${r.sig}` : `mint would be …${r.mint.slice(-4)}`}`;
      console.log(line); rows.push(line);
    } catch (e: any) { fails++; console.log(`FAIL $${c.ticker}: ${e.message}`); if (go) break; }
  }
  console.log(`\n${done} coins ${go ? "launched" : "simulated OK"}, ${fails} failed. ${go ? "Spent" : "Would spend"} ${spent} lamports = ${(spent / 1e9).toFixed(6)} SOL; ${(projected / 1e9).toFixed(6)} SOL left.`);
  process.exit(fails && !go ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
