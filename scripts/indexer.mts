/**
 * Indexer worker (run on Railway: `npm run indexer`). For every coin we launched:
 *  - new trades: signatures on its bonding curve (or PumpSwap pool), parsed from balance changes
 *  - market: bonding curve on chain + DEX Screener after graduation
 *  - holders: largest token accounts
 * Optional websocket (SOLANA_WS_URL) on pump.fun program logs to refresh a coin as soon as it trades.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { OnlinePumpSdk, PUMP_PROGRAM_ID, bondingCurvePda, canonicalPumpPoolPda, creatorVaultPda } from "@pump-fun/pump-sdk";
import { sqlClient } from "../src/lib/db/index";

const sql = sqlClient(process.env.DATABASE_URL!);
const conn = new Connection(process.env.SOLANA_RPC_URL!, { commitment: "confirmed", wsEndpoint: process.env.SOLANA_WS_URL });
const sdk = new OnlinePumpSdk(conn);
const CREATOR_FEE = Number(process.env.CREATOR_FEE_PCT ?? 0.3) / 100; // fallback estimate when the vault delta is not readable (PumpSwap)
let solUsd = 150;

async function refreshSolUsd() {
  try {
    const j: any = await fetch("https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112").then((r) => r.json());
    const p = j.pairs?.find((x: any) => /^USD[CT]$/.test(x.quoteToken?.symbol ?? "")); if (p) solUsd = Number(p.priceUsd);
  } catch {}
}

async function syncCoin(mint: string, migrated: boolean) {
  const m = new PublicKey(mint);
  const venue = migrated ? canonicalPumpPoolPda(m) : bondingCurvePda(m);
  const [last] = await sql`select sig from trades where mint = ${mint} order by at desc limit 1`;
  const sigs = await conn.getSignaturesForAddress(venue, { limit: 100, until: last?.sig });
  // Creator fees are read from chain: the SOL credited to the pump.fun creator vault of this coin's creator in each trade.
  const curve0 = migrated ? null : await sdk.fetchBondingCurve(m).catch(() => null);
  const vault = curve0 ? creatorVaultPda(curve0.creator).toBase58() : null;
  for (const s of sigs.reverse()) {
    if (s.err) continue;
    const tx = await conn.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0 }).catch(() => null);
    if (!tx?.meta) continue;
    const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey.toBase58());
    const tok = (b: any[] | null | undefined, owner: string) => Number(b?.find((x) => x.mint === mint && x.owner === owner)?.uiTokenAmount.uiAmount ?? 0);
    // The trader is the signer whose token balance moved (in a launch tx the platform pays, the buyer signs too).
    const signer = tx.transaction.message.accountKeys.filter((k) => k.signer).map((k) => k.pubkey.toBase58())
      .find((w) => tok(tx.meta!.postTokenBalances, w) !== tok(tx.meta!.preTokenBalances, w));
    if (!signer) continue;
    const tokDelta = tok(tx.meta.postTokenBalances, signer) - tok(tx.meta.preTokenBalances, signer);
    const delta = (i: number) => i >= 0 ? (tx.meta!.postBalances[i] - tx.meta!.preBalances[i]) / 1e9 : 0;
    // SOL size = what entered/left the bonding curve (excludes fees, rent and priority fee); wallet delta on PumpSwap.
    const curveIdx = migrated ? -1 : keys.indexOf(venue.toBase58());
    const side = tokDelta > 0 ? "buy" : "sell";
    const sol = Math.abs(curveIdx >= 0 ? delta(curveIdx) : delta(keys.indexOf(signer))), tokens = Math.abs(tokDelta), price = sol / tokens;
    const fee = vault && keys.includes(vault) ? Math.max(0, delta(keys.indexOf(vault))) : sol * CREATOR_FEE;
    const ins = await sql`insert into trades (sig, mint, wallet, side, sol, tokens, price_sol, mcap_usd, at)
      values (${s.signature}, ${mint}, ${signer}, ${side}, ${sol}, ${tokens}, ${price}, ${price * 1e9 * solUsd}, to_timestamp(${s.blockTime ?? Date.now() / 1000}))
      on conflict do nothing returning sig`;
    if (ins.length) await sql`update coins set volume_sol = volume_sol + ${sol}, fees_sol = fees_sol + ${fee}, last_trade_at = to_timestamp(${s.blockTime ?? Date.now() / 1000}) where mint = ${mint}`;
  }
  // Market
  const curve = await sdk.fetchBondingCurve(m).catch(() => null);
  let mcap = 0, bonding = 0, done = migrated;
  if (curve) {
    done = curve.complete;
    const g = await sdk.fetchGlobal();
    bonding = done ? 100 : Math.max(0, Math.min(100, (1 - Number(curve.realTokenReserves) / Number(g.initialRealTokenReserves)) * 100));
    const vSol = Number(curve.virtualQuoteReserves) / 1e9, vTok = Number(curve.virtualTokenReserves) / 1e6;
    mcap = vTok ? (vSol / vTok) * (Number(curve.tokenTotalSupply) / 1e6) * solUsd : 0;
  }
  let change = 0;
  try {
    const d: any = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`).then((r) => r.json());
    const p = d.pairs?.[0]; if (p) { change = Number(p.priceChange?.h24 ?? 0); if (done) mcap = Number(p.marketCap ?? p.fdv ?? mcap); }
  } catch {}
  // Holders
  const largest = await conn.getTokenLargestAccounts(m).catch(() => null);
  if (largest) {
    const infos = await conn.getMultipleParsedAccounts(largest.value.map((a) => a.address)).catch(() => null);
    await sql`delete from holders where mint = ${mint}`;
    for (const [i, a] of largest.value.entries()) {
      const owner = (infos?.value[i]?.data as any)?.parsed?.info?.owner ?? a.address.toBase58();
      await sql`insert into holders (mint, wallet, amount) values (${mint}, ${owner}, ${Number(a.uiAmount ?? 0)})`;
    }
  }
  const [{ n }] = await sql`select count(distinct wallet)::int as n from trades where mint = ${mint} and side = 'buy'`;
  await sql`update coins set mcap_usd = ${mcap}, bonding_pct = ${bonding}, migrated = ${done}, change_24h = ${change}, holders = ${n} where mint = ${mint}`;
}

const dirty = new Set<string>();
async function loop() {
  await refreshSolUsd();
  const coins = await sql`select mint, migrated from coins where hidden = false order by coalesce(last_trade_at, created_at) desc limit 300`;
  const ours = new Map(coins.map((c: any) => [c.mint, c.migrated]));
  if (process.env.SOLANA_WS_URL && !(globalThis as any).__sub) {
    (globalThis as any).__sub = conn.onLogs(PUMP_PROGRAM_ID, (l) => { for (const m of ours.keys()) if (l.logs.some((x) => x.includes(m))) dirty.add(m); });
  }
  for (const c of coins as any[]) {
    try { await syncCoin(c.mint, c.migrated); } catch (e) { console.error(c.mint, (e as Error).message); }
  }
}

console.log("indexer up");
for (;;) {
  const t = Date.now();
  await loop().catch((e) => console.error(e));
  while (dirty.size) { const m = dirty.values().next().value!; dirty.delete(m); await syncCoin(m, false).catch(() => {}); }
  await new Promise((r) => setTimeout(r, Math.max(5000, 20_000 - (Date.now() - t))));
}
