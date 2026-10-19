import { randomUUID } from "node:crypto";
import { putFile } from "@/lib/storage";
import { fail, ok } from "@/lib/http";
export const runtime = "nodejs";
/** Uploaded video → draft. */
export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const f = fd.get("file");
    if (!(f instanceof File)) throw new Error("Drop a video file.");
    if (f.size > 60_000_000) throw new Error("That video is too big (60 MB max).");
    if (!/^video\//.test(f.type) && !/\.(mp4|mov|webm|m4v)$/i.test(f.name)) throw new Error("That isn't a video.");
    const id = randomUUID();
    const ref = await putFile(`drafts/${id}/video`, Buffer.from(await f.arrayBuffer()), f.type || "video/mp4");
    return ok({ platform: "upload", draft: { id, ref } });
  } catch (e) { return fail(e); }
}
