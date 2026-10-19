/**
 * Devnet end-to-end check through the app's real API routes (dev server on :4082 with a devnet .env.local).
 *   npx tsx scripts/devnet-e2e.mts <stillRef> <loopRef>
 * Needs .secrets/buyer.json ({ pubkey, secret }) funded with devnet SOL. Refuses to run unless the server RPC is devnet.
 */
import { Connection, Keypair, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { readFileSync } from "node:fs";

const API = process.env.API ?? "http://localhost:4082";
const RPC = "https://api.devnet.solana.com";
const conn = new Connection(RPC, "confirmed");
const buyer = Keypair.fromSecretKey(bs58.decode(JSON.parse(readFileSync(".secrets/buyer.json", "utf8")).secret));
const [stillRef, loopRef] = process.argv.slice(2);
const x = (s: string) => `https://explorer.solana.com/tx/${s}?cluster=devnet`;

async function post(path: string, body: any) {
  const r = await fetch(API + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(`${path}: ${j.error ?? r.status}`);
  return j;
}
const base = { stillRef, loopRef, sourceUrl: "https://x.com/elonmusk/status/1585341984679469056", recipient: buyer.publicKey.toBase58() };

// 1. Launch without a first buy: platform pays and sends.
const a = await post("/api/launch/prepare", { ...base, name: "Sink Devnet", ticker: "SINKD" });
console.log("launch (no buy)", a.mint, x(a.sig));

// 2. Launch with first buy signed by the buyer wallet.
const b = await post("/api/launch/prepare", { ...base, name: "Sink Buy Devnet", ticker: "SINKB", buyer: buyer.publicKey.toBase58(), firstBuySol: 0.05 });
const tx = Transaction.from(Buffer.from(b.tx, "base64"));
tx.partialSign(buyer);
// 2a. Tampered tx must be rejected (flip the last byte of the message: last instruction's data).
const raw = tx.serialize({ requireAllSignatures: false, verifySignatures: false }); raw[raw.length - 1] ^= 1;
await post("/api/launch/submit", { id: b.id, tx: raw.toString("base64") })
  .then(() => { throw new Error("tampered tx was accepted!"); }, (e) => console.log("tampered tx rejected:", e.message));
// 2b. Unsigned by the buyer must be rejected.
await post("/api/launch/submit", { id: b.id, tx: b.tx })
  .then(() => { throw new Error("unsigned tx was accepted!"); }, (e) => console.log("unsigned tx rejected:", e.message));
const s = await post("/api/launch/submit", { id: b.id, tx: tx.serialize().toString("base64") });
console.log("launch (first buy)", s.mint, x(s.sig));

// 3. Buy then sell on the coin page routes.
async function trade(side: "buy" | "sell", amount: number) {
  const q = await post("/api/trade/quote", { mint: s.mint, wallet: buyer.publicKey.toBase58(), side, amount, slippage: 10 });
  const t = Transaction.from(Buffer.from(q.tx, "base64"));
  t.sign(buyer);
  const sig = await conn.sendRawTransaction(t.serialize());
  await conn.confirmTransaction({ signature: sig, blockhash: t.recentBlockhash!, lastValidBlockHeight: q.lastValidBlockHeight }, "confirmed");
  const f = await fetch(`${API}/api/trade/fill?sig=${sig}`).then((r) => r.json());
  console.log(side, amount, q.venue, "expected", q.expected, "→", f.status, f.err ?? "", x(sig));
}
await trade("buy", 0.03);
const bal = await conn.getParsedTokenAccountsByOwner(buyer.publicKey, { mint: new (await import("@solana/web3.js")).PublicKey(s.mint) });
const held = Number(bal.value[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0);
await trade("sell", Math.floor(held / 2));
console.log("coins:", a.mint, s.mint);
