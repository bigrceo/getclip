import { listCoins } from "@/lib/data";
import { ok } from "@/lib/http";
import type { Sort } from "@/lib/types";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const u = new URL(req.url);
  const sort = (["hot", "new", "mcap", "graduating"].includes(u.searchParams.get("sort") ?? "") ? u.searchParams.get("sort") : "hot") as Sort;
  return ok({ coins: await listCoins(sort, Math.min(200, Number(u.searchParams.get("limit") ?? 120)), u.searchParams.get("q") ?? "") });
}
