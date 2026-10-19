# clip.fun

Any viral clip becomes a pump.fun coin. Free, no wallet. (Brand is a placeholder: `src/lib/brand.ts`.)

Clone of gif.fun's structure for video clips: paste a TikTok / Reels / Shorts / X link (or drop a video), crop a square loop, name it, and the coin is created on pump.fun in one platform-sponsored transaction with a vanity mint ending in `clip`.

## Run

```
npm i
cp .env.example .env.local   # empty DATABASE_URL = demo data
npm run dev                  # http://localhost:4082
```

## Production setup

1. Neon Postgres → `DATABASE_URL`, then `npm run db:push` (Drizzle).
2. Helius → `SOLANA_RPC_URL`, `SOLANA_WS_URL`, `NEXT_PUBLIC_SOLANA_RPC_URL`.
3. Platform wallet → `PLATFORM_SECRET_KEY` (base58), funded with ~0.006 SOL per launch.
4. Vanity mints: `npm run grind -- --count 500` (worker threads), or `solana-keygen grind --ends-with clip:100 --ignore-case` then `npm run grind -- --import <dir>`.
5. Media: `BLOB_READ_WRITE_TOKEN` (Vercel Blob). Metadata to IPFS: pump.fun's endpoint, or `PINATA_JWT`.
6. Optional `COBALT_API_URL` (self-hosted cobalt) to fetch Reels / Shorts videos; without it those need a file drop.
7. `LAUNCH_DRY_RUN=0` to actually send launches (default is dry run: tx built + simulated, never sent).
8. Indexer on Railway: `npm run indexer` (same env).

## Layout

- `src/lib/launch.ts`: one tx = `create_v2` (platform pays, creator = fee recipient, optional holders mode) + optional first buy signed by the user's wallet. The server checks the signed message is byte-identical before sending.
- `src/lib/trade.ts`: buy/sell from the user's wallet, bonding curve then PumpSwap.
- `src/lib/clip.ts`: link resolver (fxtwitter for X, TikTok oEmbed + tikwm, YouTube oEmbed, cobalt fallback).
- `src/lib/media.ts`: ffmpeg-static square crop → still.jpg + silent loop.mp4.
- `scripts/grind.ts`, `scripts/indexer.ts`.

Routes: `/`, `/launch`, `/how`, `/coin/[mint]`, `/creator/[address]`, `/<any clip url>` → launch prefilled.
