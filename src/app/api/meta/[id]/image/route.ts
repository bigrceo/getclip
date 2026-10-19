import { getFile, localKey } from "@/lib/storage";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("not found", { status: 404 });
  const b = await getFile(localKey(`meta/${id}/image.jpg`));
  return b ? new Response(new Uint8Array(b), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } }) : new Response("not found", { status: 404 });
}
