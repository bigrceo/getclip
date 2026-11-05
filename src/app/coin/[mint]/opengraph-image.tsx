import { ImageResponse } from "next/og";
import { getCoin } from "@/lib/data";
import { coinMedia } from "@/lib/coinMedia";
import { pct, usd } from "@/lib/format";
import { BRAND } from "@/lib/brand";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Coin on wasted.fun";

async function gfont(family: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}`, { headers: { "user-agent": "curl/8" } }).then((r) => r.text());
    const src = css.match(/src: url\((.+?)\)/)?.[1];
    return src ? await fetch(src).then((r) => r.arrayBuffer()) : null;
  } catch { return null; }
}

async function still(mint: string): Promise<string | null> {
  try {
    const r = await coinMedia(mint, "still");
    if (r.status >= 300 && r.status < 400) return r.headers.get("location");
    if (!r.ok) return null;
    return `data:image/jpeg;base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
  } catch { return null; }
}

export default async function Image({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const c = await getCoin(mint);
  const [inter, img] = await Promise.all([gfont("Inter:wght@600"), c ? still(mint) : null]);
  const font = await readFile(path.join(process.cwd(), "src/app/fonts/Pricedown.otf")).then((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer).catch(() => null);
  const sign = font ? "Pricedown" : "sans-serif";
  const up = (c?.change24h ?? 0) >= 0;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#0d0716", color: "#fff", fontFamily: inter ? "Inter" : "sans-serif", padding: 56, gap: 56, alignItems: "center" }}>
      <div style={{ width: 500, height: 500, display: "flex", border: "6px solid #fff", boxShadow: "16px 16px 0 #ff2d7a", background: "#170b25" }}>
        {img && <img src={img} width={488} height={488} style={{ objectFit: "cover" }} alt="" />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 18 }}>
        <div style={{ fontFamily: sign, fontSize: 92, lineHeight: 1, color: "#ff2d7a", display: "flex" }}>{c ? `$${c.ticker}` : BRAND.name}</div>
        <div style={{ fontSize: 36, color: "#c2a6df", display: "flex" }}>{c?.name ?? "Coin not found"}</div>
        {c && <div style={{ display: "flex", gap: 28, marginTop: 24, alignItems: "baseline" }}>
          <div style={{ fontFamily: sign, fontSize: 64, display: "flex" }}>{usd(c.mcapUsd)}</div>
          <div style={{ fontFamily: sign, fontSize: 40, color: up ? "#5cff9d" : "#ff2d7a", display: "flex" }}>{pct(c.change24h)}</div>
        </div>}
        {c && <div style={{ fontSize: 24, color: "#c2a6df", display: "flex", letterSpacing: 2 }}>MARKET CAP · 24H</div>}
        <div style={{ fontFamily: sign, fontSize: 40, marginTop: "auto", display: "flex" }}><span style={{ color: "#ff2d7a" }}>WASTED</span><span>.fun</span></div>
      </div>
    </div>,
    { ...size, fonts: [...(inter ? [{ name: "Inter", data: inter, weight: 600 as const, style: "normal" as const }] : []), ...(font ? [{ name: "Pricedown", data: font, weight: 400 as const, style: "normal" as const }] : [])] },
  );
}
