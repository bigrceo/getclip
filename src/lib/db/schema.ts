import { pgTable, text, doublePrecision, integer, timestamp, boolean, bigint, index } from "drizzle-orm/pg-core";

export const coins = pgTable("coins", {
  mint: text("mint").primaryKey(),
  name: text("name").notNull(),
  ticker: text("ticker").notNull(),
  description: text("description"),
  sourceUrl: text("source_url"),
  still: text("still").notNull(),
  loop: text("loop"),
  metadataUri: text("metadata_uri"),
  creator: text("creator").notNull(),
  feeMode: text("fee_mode").notNull().default("creator"),
  tx: text("tx"),
  ip: text("ip"),
  mcapUsd: doublePrecision("mcap_usd").notNull().default(0),
  change24h: doublePrecision("change_24h").notNull().default(0),
  volumeSol: doublePrecision("volume_sol").notNull().default(0),
  holders: integer("holders").notNull().default(0),
  bondingPct: doublePrecision("bonding_pct").notNull().default(0),
  migrated: boolean("migrated").notNull().default(false),
  feesSol: doublePrecision("fees_sol").notNull().default(0),
  reports: integer("reports").notNull().default(0),
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastTradeAt: timestamp("last_trade_at", { withTimezone: true }),
  /** Where the clip happens in Leonida, u/v of the map image (null = auto plot). */
  mapU: doublePrecision("map_u"),
  mapV: doublePrecision("map_v"),
}, (t) => [index("coins_creator_idx").on(t.creator)]);

export const trades = pgTable("trades", {
  sig: text("sig").primaryKey(),
  mint: text("mint").notNull(),
  wallet: text("wallet").notNull(),
  side: text("side").notNull(),
  sol: doublePrecision("sol").notNull(),
  tokens: doublePrecision("tokens").notNull(),
  priceSol: doublePrecision("price_sol").notNull(),
  mcapUsd: doublePrecision("mcap_usd").notNull().default(0),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("trades_mint_idx").on(t.mint, t.at)]);

export const holders = pgTable("holders", {
  mint: text("mint").notNull(),
  wallet: text("wallet").notNull(),
  amount: doublePrecision("amount").notNull(),
}, (t) => [index("holders_mint_idx").on(t.mint)]);

/** Pre-ground vanity mints ending in "clip". Secret is base58; keep this table private. */
export const mintPool = pgTable("mint_pool", {
  pubkey: text("pubkey").primaryKey(),
  secret: text("secret").notNull(),
  reservedAt: timestamp("reserved_at", { withTimezone: true }),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

/** A launch prepared and partially signed by the server, waiting for the user's wallet signature. */
export const pending = pgTable("pending_launches", {
  id: text("id").primaryKey(),
  mint: text("mint").notNull(),
  message: text("message").notNull(),
  payload: text("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  mint: text("mint").notNull(),
  reason: text("reason").notNull(),
  ip: text("ip"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});
