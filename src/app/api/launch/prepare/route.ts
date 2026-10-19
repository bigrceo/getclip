import { prepareLaunch } from "@/lib/launch";
import { fail, ipOf, ok } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try { return ok(await prepareLaunch(await req.json(), ipOf(req))); } catch (e) { console.error(e); return fail(e); }
}
