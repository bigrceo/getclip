import { getFile, localKey } from "@/lib/storage";
export const runtime = "nodejs";
/** Self-hosted token metadata (devnet fallback when pump.fun IPFS is down). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^([0-9a-f-]{36}|[0-9a-f]{8})$/.test(id)) return new Response("not found", { status: 404 });
  const b = await getFile(localKey(id.length === 8 ? `m/${id}.json` : `meta/${id}/meta.json`));
  return b ? new Response(new Uint8Array(b), { headers: { "content-type": "application/json", "cache-control": "public, max-age=31536000, immutable" } }) : new Response("not found", { status: 404 });
}
