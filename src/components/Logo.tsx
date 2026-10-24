import { BRAND } from "@/lib/brand";

/** gif.fun-style wordmark: chunky Bungee letters, one party colour per letter, hard pixel shadow. */
const PARTY = ["var(--color-pink)", "var(--color-sun)", "var(--color-sky)", "var(--color-mint)"];

export function Logo({ size = 28 }: { size?: number }) {
  const [word, tld] = BRAND.name.split(".");
  return (
    <span className="inline-flex items-baseline font-sign leading-none" style={{ fontSize: size * 0.9 }}>
      {word.toUpperCase().split("").map((ch, i) => (
        <span key={i} style={{ color: PARTY[i % PARTY.length], textShadow: "2px 2px 0 rgba(0,0,0,.45)" }}>{ch}</span>
      ))}
      {tld && <span className="text-ink" style={{ fontSize: "0.6em", marginLeft: "0.08em" }}>.{tld}</span>}
    </span>
  );
}
