import { getFile, putFile } from "@/lib/storage";
import { renderClip } from "@/lib/media";
import { validRef } from "@/lib/refs";
import { fail, ok } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 60;
/** Crop the square + time window → still.jpg + loop.mp4. */
export async function POST(req: Request) {
  try {
    const { ref, crop } = await req.json();
    if (!validRef(ref)) throw new Error("Bad draft");
    const video = await getFile(ref);
    if (!video) throw new Error("Draft expired. Paste the link again.");
    const out = await renderClip(video, { x: +crop.x || 0, y: +crop.y || 0, size: +crop.size || 1, start: +crop.start || 0, length: +crop.length || 4 });
    const base = ref.replace(/^local:/, "").replace(/\/video$/, "").replace(/^https:\/\/[^/]+\//, "");
    const stillRef = await putFile(`${base}/still.jpg`, out.still, "image/jpeg");
    const loopRef = await putFile(`${base}/loop.mp4`, out.loop, "video/mp4");
    return ok({ stillRef, loopRef, info: out.info });
  } catch (e) { return fail(e); }
}
