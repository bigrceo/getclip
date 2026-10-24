/**
 * Runs every clip in batch/clips.json through the app's own pipeline (resolveClip → downloadVideo → renderClip)
 * and writes batch/media/<TICKER>/{still.jpg,loop.mp4}. No chain access.
 *   npx tsx --conditions react-server scripts/prepare-batch.mts [TICKER ...]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { downloadVideo, resolveClip } from "../src/lib/clip";
import { probe, renderClip } from "../src/lib/media";
import os from "node:os";

const FILE = path.join(process.cwd(), "batch/clips.json");
const only = process.argv.slice(2).map((s) => s.toUpperCase());
const clips: any[] = JSON.parse(await readFile(FILE, "utf8"));
for (const c of clips) {
  if (only.length && !only.includes(c.ticker)) continue;
  try {
    // Source videos are cached outside the repo (BATCH_CACHE, default OS tmp) so crops can be re-tuned without refetching.
    const cache = path.join(process.env.BATCH_CACHE ?? path.join(os.tmpdir(), "clipfun-batch"), `${c.ticker}.mp4`);
    let r: any = { platform: "cache", author: c.author };
    let video: Buffer;
    if (existsSync(cache)) video = await readFile(cache);
    else {
      r = await resolveClip(c.source);
      if (!r.videoUrl) throw new Error(r.note ?? "no video");
      video = await downloadVideo(r.videoUrl);
      await mkdir(path.dirname(cache), { recursive: true });
      await writeFile(cache, video);
    }
    // Default crop: centered square, 4 s starting at 30% of the clip. Override per clip with "crop" in clips.json.
    const tmp = path.join(os.tmpdir(), `clipfun-probe-${c.ticker}`);
    await writeFile(tmp, video);
    const info = await probe(tmp);
    const side = Math.min(info.width, info.height);
    const crop = { x: (1 - side / info.width) / 2, y: (1 - side / info.height) / 2, size: 1, start: +(info.duration * 0.3).toFixed(1), length: 4, ...c.crop };
    c.crop = crop;
    const out = await renderClip(video, crop);
    const dir = `batch/media/${c.ticker}`;
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/still.jpg`, out.still);
    await writeFile(`${dir}/loop.mp4`, out.loop);
    Object.assign(c, { still: `${dir}/still.jpg`, loop: `${dir}/loop.mp4`, author: c.author ?? r.author, video: { w: out.info.width, h: out.info.height, duration: out.info.duration } });
    console.log("ok  ", c.ticker, r.platform, `${out.info.width}x${out.info.height}`, out.info.duration.toFixed(1) + "s");
  } catch (e: any) { console.log("FAIL", c.ticker, e.message); }
}
await writeFile(FILE, JSON.stringify(clips, null, 2) + "\n");
