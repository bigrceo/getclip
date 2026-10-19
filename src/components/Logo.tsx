import { BRAND } from "@/lib/brand";
/** Play-button mark + wordmark. */
export function Logo({ size = 28 }: { size?: number }) {
  const [word, tld] = BRAND.name.split(".");
  return (
    <span className="inline-flex items-center gap-2 font-sign leading-none" style={{ fontSize: size * 0.8 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden><rect width="64" height="64" rx="16" fill="var(--color-coral)" /><path d="M24 18v28l22-14z" fill="var(--color-night)" /></svg>
      <span>{word.toUpperCase()}<span className="text-coral">{tld ? "." + tld : ""}</span></span>
    </span>
  );
}
