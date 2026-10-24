// Record a batch coin whose launch landed on chain but was reported as failed.
// usage: npx tsx --conditions react-server scripts/recover-launch.ts <envfile> <TICKER> <mint> <sig> <metadataUri> <feeRecipient>
import { readFileSync, writeFileSync } from "node:fs";

async function main() {
  const [envFile, ticker, mint, sig, uri, recipient] = process.argv.slice(2);
  for (const file of [".env.local", envFile]) for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && (file === envFile || m[1] === "BLOB_READ_WRITE_TOKEN")) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: `drafts/batch-${ticker.toLowerCase()}/` });
  const url = (f: string) => blobs.find((b) => b.pathname.endsWith(f))?.url;
  const clips = JSON.parse(readFileSync("batch/clips.json", "utf8"));
  const c = clips.find((x: any) => x.ticker === ticker);
  const { recordCoin } = await import("../src/lib/launch");
  await recordCoin({ mint, name: c.name, ticker, description: c.description, sourceUrl: c.source, stillRef: url("still.jpg"), loopRef: url("loop.mp4"), uri, recipient, feeMode: "creator" }, sig);
  Object.assign(c, { mint, sig, launchedAt: new Date().toISOString() });
  writeFileSync("batch/clips.json", JSON.stringify(clips, null, 2) + "\n");
  console.log("recorded", ticker, mint, url("still.jpg"));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
