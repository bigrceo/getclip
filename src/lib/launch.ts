import "server-only";
import { ComputeBudgetProgram, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import bs58 from "bs58";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { NATIVE_MINT } from "@solana/spl-token";
import { OnlinePumpSdk, PUMP_SDK, getBuyTokenAmountFromSolAmount } from "@pump-fun/pump-sdk";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { BRAND, SITE_URL } from "./brand";
import { db, schema } from "./db";
import { connection, dryRun, isSolAddress, platformKeypair } from "./sol";
import { getFile } from "./storage";
import { uploadMetadata } from "./ipfs";
import { openMintSecret } from "./mintcrypt";

export type LaunchInput = {
  name: string; ticker: string; description?: string; sourceUrl?: string;
  stillRef: string; loopRef?: string;
  recipient: string;            // creator-fee recipient
  feeMode?: "creator" | "holders";
  buyer?: string;               // connected wallet, only when it makes the first buy
  firstBuySol?: number;
  twitter?: string; website?: string;
};

const PER_DAY = Number(process.env.LAUNCHES_PER_IP_PER_DAY ?? 5);
const MAX_BUY = Number(process.env.MAX_FIRST_BUY_SOL ?? 5);
/** Priority fee for sponsored creates, in micro-lamports per CU (1000 × 140k CU = 140 lamports). */
const CU_PRICE = Number(process.env.LAUNCH_CU_PRICE ?? 1000);

export function validate(i: LaunchInput) {
  const name = i.name?.trim();
  const ticker = i.ticker?.replace(/^\$/, "").trim().toUpperCase();
  if (!name || name.length > 32) throw new Error("Name must be 1 to 32 characters.");
  if (!/^[A-Z0-9]{1,10}$/.test(ticker)) throw new Error("Ticker must be 1 to 10 letters or numbers.");
  if (!isSolAddress(i.recipient)) throw new Error("Paste a valid Solana address for the creator fees, or connect a wallet.");
  if (i.buyer && !isSolAddress(i.buyer)) throw new Error("Invalid wallet.");
  const buy = Number(i.firstBuySol ?? 0);
  if (buy < 0 || buy > MAX_BUY) throw new Error(`First buy must be between 0 and ${MAX_BUY} SOL.`);
  if (buy > 0 && !i.buyer) throw new Error("Connect a wallet to make the first buy.");
  const okRef = (r?: string) => !r || r.startsWith("local:drafts/") || /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/drafts\//.test(r);
  if (!i.stillRef || !okRef(i.stillRef) || !okRef(i.loopRef)) throw new Error("Pick the square of your clip first.");
  return { ...i, name, ticker, firstBuySol: buy };
}

/** Takes one pre-ground "…clip" mint from the pool (skip-locked so two launches never share one). */
async function reserveMint(): Promise<Keypair> {
  const d = db();
  if (!d) {
    if (dryRun()) return Keypair.generate();
    throw new Error("No mint pool: set DATABASE_URL and run npm run grind.");
  }
  const rows = await d.execute(sql`update mint_pool set reserved_at = now() where pubkey = (
      select pubkey from mint_pool where used_at is null and (reserved_at is null or reserved_at < now() - interval '15 minutes')
      order by pubkey limit 1 for update skip locked) returning pubkey, secret`);
  const r = (rows as any).rows?.[0] ?? (rows as any)[0];
  if (!r) throw new Error("Out of vanity mints. Run the grinder.");
  const kp = Keypair.fromSecretKey(bs58.decode(openMintSecret(r.secret)));
  if (!kp.publicKey.toBase58().toLowerCase().endsWith(BRAND.vanitySuffix)) throw new Error("Bad mint in pool");
  return kp;
}

async function rateLimit(ip?: string) {
  const d = db();
  if (!d || !ip) return;
  const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(schema.coins)
    .where(and(eq(schema.coins.ip, ip), gt(schema.coins.createdAt, sql`now() - interval '1 day'`)));
  if (n >= PER_DAY) throw new Error(`You've launched ${PER_DAY} coins today. Come back tomorrow.`);
}

/**
 * Builds the ONE launch transaction: create_v2 (platform pays rent + fee, creator = fee recipient)
 * plus, optionally, the connected wallet's first buy. Platform and mint sign here; the wallet signs only if it buys.
 */
export async function prepareLaunch(raw: LaunchInput, ip?: string) {
  const i = validate(raw);
  await rateLimit(ip);
  const platform = platformKeypair();
  const mint = await reserveMint();

  const still = await getFile(i.stillRef);
  if (!still) throw new Error("Your clip's frame expired. Pick the square again.");
  const uri = dryRun() ? `${SITE_URL}/api/meta/dry-run` : await uploadMetadata({
    name: i.name, symbol: i.ticker, image: still, twitter: i.twitter, website: i.website || i.sourceUrl,
    description: i.description?.trim() || `${i.name}, a clip coin launched on ${BRAND.name}.`,
  });

  const online = new OnlinePumpSdk(connection());
  const global = await online.fetchGlobal();
  const creator = new PublicKey(i.recipient);
  const holderReward = i.feeMode === "holders";
  const ixs = [
    // create_v2 alone uses ~100-110k CU (measured on mainnet, scripts/measure-create.mts). A tight limit keeps the priority fee tiny.
    ComputeBudgetProgram.setComputeUnitLimit({ units: i.firstBuySol ? 450_000 : 140_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: i.firstBuySol ? 200_000 : CU_PRICE }),
    await PUMP_SDK.createV2Instruction({ mint: mint.publicKey, name: i.name, symbol: i.ticker, uri, creator, user: platform.publicKey, mayhemMode: false, holderReward }),
  ];
  if (i.firstBuySol && i.buyer) {
    const solAmount = new BN(Math.round(i.firstBuySol * 1e9));
    const feeConfig = await online.fetchFeeConfig();
    const amount = getBuyTokenAmountFromSolAmount({ global, feeConfig, mintSupply: null, bondingCurve: null, amount: solAmount, quoteMint: NATIVE_MINT });
    // Reuse the SDK's create+buy builder for the buyer's ATA + buy; drop its create (ours is paid by the platform).
    const both = await PUMP_SDK.createV2AndBuyInstructions({ global, mint: mint.publicKey, name: i.name, symbol: i.ticker, uri, creator,
      user: new PublicKey(i.buyer), amount, solAmount, mayhemMode: false, holderReward });
    ixs.push(...both.slice(1));
  }
  const conn = connection();
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: platform.publicKey, blockhash, lastValidBlockHeight }).add(...ixs);
  tx.partialSign(platform, mint);

  const record = { ...i, mint: mint.publicKey.toBase58(), uri, ip };
  if (!i.buyer || !i.firstBuySol) {
    // No wallet signature needed: send now.
    const sig = await send(tx);
    await recordCoin(record, sig);
    return { mint: record.mint, sig, dryRun: dryRun() };
  }
  const id = randomUUID();
  const message = tx.serializeMessage().toString("base64");
  const d = db();
  if (d) await d.insert(schema.pending).values({ id, mint: record.mint, message, payload: JSON.stringify(record) });
  else memPending.set(id, { message, payload: record });
  return { id, mint: record.mint, tx: tx.serialize({ requireAllSignatures: false }).toString("base64"), lastValidBlockHeight };
}

const memPending = new Map<string, { message: string; payload: any }>();

/** The wallet sends back the signed tx; we send it only if its message is byte-for-byte the one we prepared. */
export async function submitLaunch(id: string, signedB64: string) {
  const d = db();
  let p: { message: string; payload: any } | undefined;
  if (d) {
    const [r] = await d.select().from(schema.pending).where(eq(schema.pending.id, id)).limit(1);
    if (r) p = { message: r.message, payload: JSON.parse(r.payload) };
  } else p = memPending.get(id);
  if (!p) throw new Error("This launch expired. Start again.");
  const tx = Transaction.from(Buffer.from(signedB64, "base64"));
  const a = tx.serializeMessage(), b = Buffer.from(p.message, "base64");
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("The transaction was changed. Start again.");
  if (!tx.verifySignatures()) throw new Error("Missing a signature.");
  const sig = await send(tx);
  await recordCoin(p.payload, sig);
  if (d) await d.delete(schema.pending).where(eq(schema.pending.id, id)); else memPending.delete(id);
  return { mint: p.payload.mint as string, sig, dryRun: dryRun() };
}

async function send(tx: Transaction): Promise<string> {
  if (dryRun()) {
    const sim = await connection().simulateTransaction(tx).catch((e) => ({ value: { err: String(e), logs: [] } }));
    if (sim.value.err) console.warn("[dry-run] simulation:", sim.value.err, sim.value.logs?.slice(-5));
    return "dry-run";
  }
  const conn = connection();
  const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 5 }).catch((e: Error) => {
    if (/no record of a prior credit|insufficient (funds|lamports)/i.test(e.message)) {
      console.error("[launch] platform or buyer wallet is out of SOL:", e.message);
      throw new Error("Not enough SOL to send this launch. Try again in a moment.");
    }
    throw e;
  });
  const res = await conn.confirmTransaction({ signature: sig, blockhash: tx.recentBlockhash!, lastValidBlockHeight: tx.lastValidBlockHeight! }, "confirmed");
  if (res.value.err) throw new Error("The launch failed on chain.");
  return sig;
}

async function recordCoin(r: any, sig: string) {
  const d = db();
  if (!d || sig === "dry-run") return;
  await d.insert(schema.coins).values({
    mint: r.mint, name: r.name, ticker: r.ticker, description: r.description ?? null, sourceUrl: r.sourceUrl ?? null,
    still: r.stillRef, loop: r.loopRef ?? null, metadataUri: r.uri, creator: r.recipient, feeMode: r.feeMode ?? "creator", tx: sig, ip: r.ip ?? null,
  }).onConflictDoNothing();
  await d.update(schema.mintPool).set({ usedAt: new Date() }).where(and(eq(schema.mintPool.pubkey, r.mint), isNull(schema.mintPool.usedAt)));
}
