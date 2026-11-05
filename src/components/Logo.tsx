import { BRAND } from "@/lib/brand";

/** Leonida-style brand lockup: WASTED wordmark in Pricedown over a sunset tile, with the state line under it. */
export function Logo({ size = 28, sub = true }: { size?: number; sub?: boolean }) {
  const [word] = BRAND.name.split(".");
  return (
    <span className="inline-flex items-center gap-2.5">
      <span aria-hidden className="grid place-items-center rounded-[10px] text-[#1a0b26]" style={{ width: size * 1.4, height: size * 1.4, background: "var(--sunset)", boxShadow: "0 0 10px rgba(255,61,139,.6)" }}>
        <span className="wordmark leading-none" style={{ fontSize: size * 1.1 }}>W</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="whitespace-nowrap font-sign uppercase tracking-wide" style={{ fontSize: size * 0.8 }}>{word}<span className="text-pink"> GTA VI</span></span>
        {sub && <span className="mt-0.5 hidden text-[11px] sm:block font-semibold uppercase tracking-[.08em] text-sun">${BRAND.short} · clips of {BRAND.state}</span>}
      </span>
    </span>
  );
}
