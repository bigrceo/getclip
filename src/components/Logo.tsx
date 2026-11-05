import { BRAND } from "@/lib/brand";

/** Brand lockup: the CLIP tile and the name. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/brand/pfp-512.png" alt="" width={size * 1.45} height={size * 1.45} className="rounded-[10px]" style={{ filter: "drop-shadow(0 0 10px rgba(255,61,139,.6))" }} />
      <span className="font-sign uppercase tracking-wide leading-none" style={{ fontSize: size * 0.9 }}>{BRAND.brand}</span>
    </span>
  );
}
