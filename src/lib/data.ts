import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { MOCK_COINS, mockHolders, mockTrades } from "./mock";
import type { Coin, Holder, Sort, Trade } from "./types";

const toCoin = (r: typeof schema.coins.$inferSelect): Coin => ({
  ...r, createdAt: r.createdAt.toISOString(),
  still: `/api/coins/${r.mint}/still`, loop: r.loop ? `/api/coins/${r.mint}/loop.mp4` : null,
});

function sortMock(list: Coin[], sort: Sort) {
  const l = [...list];
  if (sort === "new") return l.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  if (sort === "mcap") return l.sort((a, b) => b.mcapUsd - a.mcapUsd);
  if (sort === "graduating") return l.filter((c) => !c.migrated).sort((a, b) => b.bondingPct - a.bondingPct);
  return l.sort((a, b) => Number(b.official) - Number(a.official) || b.volumeSol - a.volumeSol);
}

export async function listCoins(sort: Sort = "hot", limit = 120, q = ""): Promise<Coin[]> {
  const d = db();
  if (!d) {
    const s = q.toLowerCase();
    return sortMock(MOCK_COINS.filter((c) => !s || c.name.toLowerCase().includes(s) || c.ticker.toLowerCase().includes(s)), sort).slice(0, limit);
  }
  const c = schema.coins;
  const where = and(eq(c.hidden, false), q ? sql`(${c.name} ilike ${"%" + q + "%"} or ${c.ticker} ilike ${"%" + q + "%"})` : undefined,
    sort === "graduating" ? eq(c.migrated, false) : undefined);
  const order = sort === "new" ? desc(c.createdAt) : sort === "mcap" ? desc(c.mcapUsd) : sort === "graduating" ? desc(c.bondingPct)
    : desc(sql`${c.volumeSol} / power(extract(epoch from (now() - coalesce(${c.lastTradeAt}, ${c.createdAt}))) / 3600 + 2, 1.5)`);
  const rows = await d.select().from(c).where(where).orderBy(order).limit(limit);
  return rows.map(toCoin);
}

export async function getCoin(mint: string): Promise<Coin | null> {
  const d = db();
  if (!d) return MOCK_COINS.find((c) => c.mint === mint) ?? null;
  const [r] = await d.select().from(schema.coins).where(eq(schema.coins.mint, mint)).limit(1);
  return r ? toCoin(r) : null;
}

export async function getRawCoin(mint: string) {
  const d = db();
  if (!d) return null;
  const [r] = await d.select().from(schema.coins).where(eq(schema.coins.mint, mint)).limit(1);
  return r ?? null;
}

export async function listTrades(mint?: string, limit = 40): Promise<Trade[]> {
  const d = db();
  if (!d) return mockTrades(mint, limit);
  const t = schema.trades, c = schema.coins;
  const rows = await d.select({ t, ticker: c.ticker }).from(t).innerJoin(c, eq(c.mint, t.mint))
    .where(mint ? eq(t.mint, mint) : undefined).orderBy(desc(t.at)).limit(limit);
  return rows.map(({ t, ticker }) => ({ ...t, ticker, side: t.side as Trade["side"], at: t.at.toISOString() }));
}

export async function listHolders(coin: Coin): Promise<Holder[]> {
  const d = db();
  if (!d) return mockHolders(coin);
  const rows = await d.select().from(schema.holders).where(eq(schema.holders.mint, coin.mint)).orderBy(desc(schema.holders.amount)).limit(50);
  const supply = 1e9;
  return rows.map((h) => ({ wallet: h.wallet, amount: h.amount, pct: (h.amount / supply) * 100, dev: h.wallet === coin.creator }));
}

export async function creatorCoins(address: string): Promise<Coin[]> {
  const d = db();
  if (!d) return MOCK_COINS.filter((c) => c.creator === address);
  const rows = await d.select().from(schema.coins).where(eq(schema.coins.creator, address)).orderBy(desc(schema.coins.createdAt));
  return rows.map(toCoin);
}
