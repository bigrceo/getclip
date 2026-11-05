import { BRAND } from "@/lib/brand";

/** Brand lockup: the CLIP tile (white neon C, pink play triangle, Vice sunset) and the state line. */
export function Logo({ size = 28, sub = true }: { size?: number; sub?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/brand/pfp-512.png" alt="" width={size * 1.45} height={size * 1.45} className="rounded-[10px]" style={{ filter: "drop-shadow(0 0 10px rgba(255,61,139,.6))" }} />
      <span className="flex flex-col leading-none">
        <span className="whitespace-nowrap font-sign uppercase tracking-wide" style={{ fontSize: size * 0.8 }}>{BRAND.brand}<span className="text-pink"> · Leonida</span></span>
        {sub && <span className="mt-0.5 hidden text-[11px] sm:block font-semibold uppercase tracking-[.08em] text-sun">${BRAND.short} · every GTA VI clip is a coin</span>}
      </span>
    </span>
  );
}
