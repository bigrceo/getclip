import { BRAND } from "@/lib/brand";

/** Death-screen wordmark: Pricedown, vice pink, hard shadow. */
export function Logo({ size = 28 }: { size?: number }) {
  const [word, tld] = BRAND.name.split(".");
  return (
    <span className="inline-flex items-baseline font-sign leading-none" style={{ fontSize: size * 1.05 }}>
      <span className="text-pink" style={{ textShadow: "2px 2px 0 rgba(0,0,0,.6)", letterSpacing: ".02em" }}>{word.toUpperCase()}</span>
      {tld && <span className="text-ink" style={{ fontSize: "0.55em", marginLeft: "0.1em" }}>.{tld}</span>}
    </span>
  );
}
