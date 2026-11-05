import bs58 from "bs58";
import type { Coin, Holder, Trade } from "./types";

// Demo data only: no third-party media; stills/loops are generated gradients (see /api/coins/[mint]/loop.mp4).
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function rng(seed: number) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }
function realKey(r: () => number) { return bs58.encode(Uint8Array.from({ length: 32 }, () => Math.floor(r() * 256))); }
function fakeKey(r: () => number, suffix = "") {
  let s = ""; for (let i = 0; i < 44 - suffix.length; i++) s += B58[Math.floor(r() * 58)];
  return s + suffix;
}
const NAMES: [string, string][] = [
  ["Official CLIP", "CLIP"], ["Vice City Sunrise", "SUNRISE"], ["Gator In The Pool", "GATOR"], ["Lucia Mugshot", "LUCIA"],
  ["Jason Jumps The Bridge", "BRIDGE"], ["Five Stars In 10s", "5STARS"], ["Thrillbilly Mudfest", "MUDFEST"], ["Airboat Flip", "AIRBOAT"],
  ["Keys To Leonida", "KEYS"], ["Busted At The Club", "BUSTED"], ["Florida Man Arc", "FLMAN"], ["Dacity Crash", "DACITY"],
  ["Cop Chase Ragdoll", "RAGDOLL"], ["Hurricane Ride", "CANE"], ["Street Fight Cam", "FIGHTCAM"], ["First Wasted Screen", "DEATH"],
];
const r = rng(42);
export const MOCK_COINS: Coin[] = NAMES.map(([name, ticker], i) => {
  const mint = fakeKey(r, i % 2 ? "GTA6" : "gta6");
  const bonding = i === 0 ? 100 : Math.round(r() * 98);
  return {
    mint, name, ticker, description: `${name}, launched on wasted.fun (demo).`, sourceUrl: null,
    still: `/api/coins/${mint}/still`, loop: `/api/coins/${mint}/loop.mp4`, creator: realKey(r),
    feeMode: i % 4 === 3 ? "holders" : "creator", tx: null,
    mcapUsd: Math.round(i === 0 ? 84_200 : 3_000 + r() * 60_000), change24h: Math.round((r() * 300 - 60) * 10) / 10,
    volumeSol: Math.round(r() * 900) / 10, holders: Math.round(10 + r() * 400), bondingPct: bonding,
    migrated: bonding >= 100, feesSol: Math.round(r() * 300) / 100,
    createdAt: new Date(Date.now() - Math.round(r() * 3 * 86_400_000)).toISOString(), official: i === 0,
  };
});
const WALLETS = Array.from({ length: 20 }, () => realKey(r));
export function mockTrades(mint?: string, n = 30): Trade[] {
  const pool = mint ? MOCK_COINS.filter((c) => c.mint === mint) : MOCK_COINS;
  const rr = rng(mint ? mint.charCodeAt(3) * 97 : 7);
  return Array.from({ length: n }, (_, i) => {
    const c = pool[Math.floor(rr() * pool.length)] ?? MOCK_COINS[0];
    const side = rr() > 0.4 ? "buy" : "sell";
    const sol = Math.round(rr() * 300) / 100 + 0.01;
    return {
      sig: fakeKey(rr) + i, mint: c.mint, ticker: c.ticker, wallet: WALLETS[Math.floor(rr() * WALLETS.length)], side,
      sol, tokens: sol * 3.1e7, priceSol: 3.2e-8, mcapUsd: c.mcapUsd * (0.9 + rr() * 0.2),
      at: new Date(Date.now() - i * (20_000 + rr() * 90_000)).toISOString(),
    } as Trade;
  });
}
export function mockHolders(coin: Coin): Holder[] {
  const rr = rng(coin.mint.charCodeAt(5) * 31);
  const list: Holder[] = [{ wallet: "bonding curve", amount: 0, pct: 62 - rr() * 30, curve: true }, { wallet: coin.creator, amount: 0, pct: 2 + rr() * 3, dev: true }];
  for (let i = 0; i < 14; i++) list.push({ wallet: WALLETS[i], amount: 0, pct: rr() * 4 });
  return list.sort((a, b) => b.pct - a.pct).map((h) => ({ ...h, amount: h.pct * 1e7 }));
}
