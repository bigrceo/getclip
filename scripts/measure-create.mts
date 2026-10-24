/** Simulates (never sends) one create_v2 on the given RPC and prints the exact lamports it costs the payer. */
import { ComputeBudgetProgram, Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { PUMP_SDK } from "@pump-fun/pump-sdk";
import bs58 from "bs58";
import { readFileSync } from "node:fs";
const rpc = process.env.SOLANA_RPC_URL ?? "https://solana-rpc.publicnode.com";
const conn = new Connection(rpc, "confirmed");
const payer = Keypair.fromSecretKey(bs58.decode(JSON.parse(readFileSync(process.env.PAYER ?? ".secrets/mainnet-platform.json", "utf8")).secret));
const uri = "https://abcdefghijklmnopqrstu.public.blob.vercel-storage.com/meta/00000000-0000-0000-0000-000000000000/meta.json";
async function sim(label: string, cuLimit: number | null, microLamports: number, u = uri, name = "Pug Omakase Birthday Club") {
  const mint = Keypair.generate();
  const ixs: any[] = [];
  if (cuLimit) ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: cuLimit }));
  if (microLamports) ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports }));
  const create = await PUMP_SDK.createV2Instruction({ mint: mint.publicKey, name, symbol: "OMAKASE", uri: u, creator: payer.publicKey, user: payer.publicKey, mayhemMode: false, holderReward: false });
  ixs.push(create);
  const { blockhash } = await conn.getLatestBlockhash();
  const tx = new Transaction({ feePayer: payer.publicKey, recentBlockhash: blockhash }).add(...ixs);
  tx.sign(payer, mint);
  const writable = create.keys.filter((k) => k.isWritable).map((k) => k.pubkey);
  const pre = await conn.getMultipleAccountsInfo([payer.publicKey, ...writable]);
  const r = await conn.simulateTransaction(tx, undefined, [payer.publicKey, ...writable]);
  if (r.value.err) { console.log(label, "ERR", r.value.err, r.value.logs?.slice(-6)); return; }
  const post = r.value.accounts!;
  const fee = (await conn.getFeeForMessage(tx.compileMessage())).value ?? 0;
  const payerDelta = (pre[0]?.lamports ?? 0) - (post[0]?.lamports ?? 0);
  console.log(`\n${label}: CU used ${r.value.unitsConsumed}, uri ${u.length} chars, payer pays ${payerDelta} lamports (fee ${fee} + rent ${payerDelta - fee}) = ${(payerDelta / 1e9).toFixed(6)} SOL`);
  writable.forEach((k, i) => { const a = pre[i + 1]?.lamports ?? 0, b = post[i + 1]?.lamports ?? 0; if (a !== b) console.log("  ", k.toBase58(), b - a, post[i + 1]?.space ?? "", k.equals(mint.publicKey) ? "(mint)" : ""); });
  return payerDelta;
}
console.log("payer", payer.publicKey.toBase58(), (await conn.getBalance(payer.publicKey)) / 1e9, "SOL");
const blobLong = "https://abcdefghijklmnop.public.blob.vercel-storage.com/meta/00000000-0000-0000-0000-000000000000/meta.json";
const blobShort = "https://abcdefghijklmnop.public.blob.vercel-storage.com/m/0a1b2c3d.json";
await sim("BEFORE: app today (250k CU @ 200000 µlamports, blob meta/<uuid>/meta.json)", 250_000, 200_000, blobLong);
await sim("AFTER: 120k CU @ 1000 µlamports, short blob key m/<8hex>.json", 120_000, 1_000, blobShort, "Pug Omakase");
await sim("floor: no budget ix, short key", null, 0, blobShort, "Pug Omakase");
