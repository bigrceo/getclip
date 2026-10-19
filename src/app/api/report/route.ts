import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { isSolAddress } from "@/lib/sol";
import { fail, ipOf, ok } from "@/lib/http";
export async function POST(req: Request) {
  try {
    const { mint, reason } = await req.json();
    if (!isSolAddress(mint)) throw new Error("Bad mint");
    const r = String(reason ?? "").slice(0, 500) || "unspecified";
    const d = db();
    if (d) {
      await d.insert(schema.reports).values({ mint, reason: r, ip: ipOf(req) ?? null });
      await d.update(schema.coins).set({ reports: sql`${schema.coins.reports} + 1` }).where(eq(schema.coins.mint, mint));
    } else console.log("[report]", mint, r);
    return ok({ ok: true });
  } catch (e) { return fail(e); }
}
