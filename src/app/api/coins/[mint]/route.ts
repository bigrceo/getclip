import { getCoin, listHolders, listTrades } from "@/lib/data";
import { fail, ok } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const coin = await getCoin(mint);
  if (!coin) return fail("Not found", 404);
  const [trades, holders] = await Promise.all([listTrades(mint, 60), listHolders(coin)]);
  return ok({ coin, trades, holders });
}
