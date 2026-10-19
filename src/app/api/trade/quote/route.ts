import { buildTrade } from "@/lib/trade";
import { isSolAddress } from "@/lib/sol";
import { fail, ok } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!isSolAddress(b.mint) || !isSolAddress(b.wallet)) throw new Error("Bad mint or wallet");
    if (!(b.amount > 0)) throw new Error("Enter an amount");
    return ok(await buildTrade({ mint: b.mint, wallet: b.wallet, side: b.side === "sell" ? "sell" : "buy", amount: Number(b.amount), slippagePct: Number(b.slippage ?? 5) }));
  } catch (e) { return fail(e); }
}
