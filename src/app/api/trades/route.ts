import { listTrades } from "@/lib/data";
import { ok } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const mint = new URL(req.url).searchParams.get("mint") ?? undefined;
  return ok({ trades: await listTrades(mint, 40) });
}
