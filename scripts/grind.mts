/**
 * Fills mint_pool with vanity keypairs whose address ends in "clip" (case-insensitive).
 *   npm run grind -- --count 200 [--threads 8] [--suffix clip]
 * Writes to Postgres (DATABASE_URL) or, without it, appends to ./mints.json.
 * Expected: "clip" case-insensitive = 4 matching variants (base58 has no lowercase l / uppercase I) → 58^4/4 ≈ 2.8M tries per hit.
 * ~16k keys/s per core (M-series) → ~35 s/mint on 5 threads, ~5 h for 500.
 * Alternative: `solana-keygen grind --ends-with clip:1 --ignore-case` then import with --import <dir>.
 */
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { availableParallelism } from "node:os";
import { appendFileSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { createPrivateKey, createPublicKey, randomBytes } from "node:crypto";
import { sealMintSecret, hasMintKey } from "../src/lib/mintcrypt";
import { sqlClient } from "../src/lib/db/index";

const arg = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };

if (!isMainThread) {
  const suffix = (workerData.suffix as string).toLowerCase();
  // Native ed25519 (node:crypto) is ~2x faster than web3.js Keypair.generate().
  const PKCS8 = Buffer.from("302e020100300506032b657004220420", "hex");
  for (;;) {
    const seed = randomBytes(32);
    const pub = createPublicKey(createPrivateKey({ key: Buffer.concat([PKCS8, seed]), format: "der", type: "pkcs8" }))
      .export({ format: "der", type: "spki" }).subarray(12);
    const pk = bs58.encode(pub);
    if (pk.toLowerCase().endsWith(suffix)) parentPort!.postMessage({ pubkey: pk, secret: bs58.encode(Buffer.concat([seed, pub])) });
  }
} else {
  const count = Number(arg("count", "100")), threads = Number(arg("threads", String(Math.max(1, availableParallelism() - 1))));
  const suffix = arg("suffix", "clip"), importDir = arg("import", "");
  const sql = process.env.DATABASE_URL ? sqlClient(process.env.DATABASE_URL) : null;
  if (sql && !hasMintKey()) console.warn("MINT_POOL_KEY not set: mint secrets will be stored in plaintext");
  const save = async (m: { pubkey: string; secret: string }) => {
    if (sql) await sql`insert into mint_pool (pubkey, secret) values (${m.pubkey}, ${sealMintSecret(m.secret)}) on conflict do nothing`;
    else appendFileSync("mints.json", JSON.stringify(m) + "\n");
  };
  if (importDir) {
    let n = 0;
    for (const f of readdirSync(importDir).filter((f) => f.endsWith(".json"))) {
      const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path.join(importDir, f), "utf8"))));
      if (!kp.publicKey.toBase58().toLowerCase().endsWith(suffix.toLowerCase())) continue;
      await save({ pubkey: kp.publicKey.toBase58(), secret: bs58.encode(kp.secretKey) }); n++;
    }
    console.log(`imported ${n} mints`); process.exit(0);
  }
  console.log(`grinding ${count} mints ending in "${suffix}" on ${threads} threads → ${sql ? "Postgres" : "mints.json"}`);
  let found = 0; const t0 = Date.now();
  const workers = Array.from({ length: threads }, () => new Worker(new URL(import.meta.url), { workerData: { suffix }, execArgv: ["--import", "tsx"] }));
  for (const w of workers) w.on("message", async (m) => {
    if (found >= count) return;
    found++; await save(m);
    console.log(`${found}/${count} ${m.pubkey} (${((Date.now() - t0) / found / 1000).toFixed(1)}s/mint)`);
    if (found >= count) { await Promise.all(workers.map((x) => x.terminate())); process.exit(0); }
  });
}
