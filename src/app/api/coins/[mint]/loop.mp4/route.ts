import { coinMedia } from "@/lib/coinMedia";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ mint: string }> }) { return coinMedia((await params).mint, "loop"); }
