import { submitLaunch } from "@/lib/launch";
import { fail, ok } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try { const { id, tx } = await req.json(); return ok(await submitLaunch(String(id), String(tx))); } catch (e) { return fail(e); }
}
