import { BRAND } from "@/lib/brand";

/** Brand lockup: sunset tile with a play triangle, CLIP in Anton, the state line under it. */
export function Logo({ size = 28, sub = true }: { size?: number; sub?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span aria-hidden className="grid place-items-center rounded-[10px]" style={{ width: size * 1.4, height: size * 1.4, background: "var(--sunset)", boxShadow: "0 0 10px rgba(255,61,139,.6)" }}>
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 20 20"><path d="M5 3.2v13.6c0 .9 1 1.5 1.8 1L17 11c.8-.5.8-1.6 0-2.1L6.8 2.2C6 1.7 5 2.3 5 3.2z" fill="#1a0b26" /></svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="whitespace-nowrap font-sign uppercase tracking-wide" style={{ fontSize: size * 0.8 }}>{BRAND.brand}<span className="text-pink"> · Leonida</span></span>
        {sub && <span className="mt-0.5 hidden text-[11px] sm:block font-semibold uppercase tracking-[.08em] text-sun">${BRAND.short} · every GTA VI clip is a coin</span>}
      </span>
    </span>
  );
}
