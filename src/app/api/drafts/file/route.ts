import { getFile } from "@/lib/storage";
import { validRef } from "@/lib/refs";
export const runtime = "nodejs";
/** Serves a draft file (video for the crop picker, still/loop previews). */
export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!validRef(ref)) return new Response("Bad ref", { status: 400 });
  if (ref.startsWith("http")) return Response.redirect(ref, 302);
  const buf = await getFile(ref);
  if (!buf) return new Response("Not found", { status: 404 });
  const type = ref.endsWith(".jpg") ? "image/jpeg" : "video/mp4";
  return new Response(new Uint8Array(buf), { headers: { "content-type": type, "cache-control": "private, max-age=3600" } });
}
