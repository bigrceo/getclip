import { connection } from "@/lib/sol";
import { fail, ok } from "@/lib/http";
export const runtime = "nodejs";
/** Confirms a trade the wallet sent; the indexer records it from chain logs. */
export async function GET(req: Request) {
  try {
    const sig = new URL(req.url).searchParams.get("sig");
    if (!sig) throw new Error("sig required");
    const s = await connection().getSignatureStatus(sig, { searchTransactionHistory: true });
    return ok({ status: s.value?.confirmationStatus ?? "pending", err: s.value?.err ?? null });
  } catch (e) { return fail(e); }
}
