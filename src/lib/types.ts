export type Coin = {
  mint: string; name: string; ticker: string; description?: string | null; sourceUrl?: string | null;
  still: string; loop?: string | null; creator: string; feeMode: string; tx?: string | null;
  mcapUsd: number; change24h: number; volumeSol: number; holders: number; bondingPct: number;
  migrated: boolean; feesSol: number; createdAt: string; official?: boolean;
};
export type Trade = { sig: string; mint: string; ticker: string; wallet: string; side: "buy" | "sell"; sol: number; tokens: number; priceSol: number; mcapUsd: number; at: string };
export type Holder = { wallet: string; amount: number; pct: number; dev?: boolean; curve?: boolean };
export type Sort = "hot" | "new" | "mcap" | "graduating";
