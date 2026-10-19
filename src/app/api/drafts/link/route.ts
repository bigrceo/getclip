import { randomUUID } from "node:crypto";
import { downloadVideo, resolveClip } from "@/lib/clip";
import { probe } from "@/lib/media";
import { putFile } from "@/lib/storage";
import { fail, ok } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 60;
/** Link → video draft. Returns needsUpload when the platform's video can't be fetched. */
export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const r = await resolveClip(String(url ?? ""));
    if (!r.videoUrl) return ok({ ...r, draft: null });
    const buf = await downloadVideo(r.videoUrl);
    const id = randomUUID();
    const ref = await putFile(`drafts/${id}/video`, buf, "video/mp4");
    return ok({ ...r, draft: { id, ref } });
  } catch (e) { return fail(e); }
}
