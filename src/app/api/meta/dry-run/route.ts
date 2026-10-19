import { ok } from "@/lib/http";
export async function GET() { return ok({ name: "dry run", symbol: "DRY", description: "LAUNCH_DRY_RUN=1", image: "" }); }
