"use client";
/** Navbar on the Kerb pattern: fixed and floating, transparent over the map at the top of the page, frosted glass once
 *  the page scrolls, a mega menu that unfolds from the bar, and a two-line burger on phones. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BRAND, OFFICIAL_MINT } from "@/lib/brand";
import { Logo } from "./Logo";
import { GitHubIcon, RockstarIcon, XIcon } from "./icons";
import { short, useWallet } from "./wallet";
import { PLOTS } from "./plots";

const plotsIn = (d: string) => PLOTS.filter((p) => p.district === d).length;

export const GTA_VI_URL = "https://www.rockstargames.com/VI";

const ICON = {
  plus: <path d="M12 5v14M5 12h14" />,
  map: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15ZM6.5 17A2.5 2.5 0 0 0 4 19.5 2.5 2.5 0 0 0 6.5 22H20v-5" />,
  user: <path d="M17 20a5 5 0 1 0-10 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
};
type Row = [keyof typeof ICON, string, string, string];
type Card = [string, string, string, string];

const MENUS: Record<"clips", { label: string; rows: Row[]; cards: Card[] }> = {
  clips: {
    label: "Clips",
    rows: [
      ["plus", "Launch a clip", "Paste a TikTok, X or YouTube link. The clip becomes a pump.fun coin.", "/launch"],
      ["map", "The map", "Every clip coin takes a plot somewhere in Leonida.", "/map"],
      ["user", "Meet the Locals", "Lucia, Jason and Hollis, from Ocean Drive to the swamp.", "/locals"],
      ["book", "How it works", "Three steps, free, no wallet needed.", "/how"],
    ],
    cards: [
      ["Ocean Drive", `Fly to Vice Beach on the map. ${plotsIn("Vice Beach")} plots, Lucia's turf.`, "/map?at=ocean-drive", "/locals/ocean-drive.jpg"],
      ["The Keys", `Fly to the Keys on the map. ${plotsIn("Key Lento")} plots, Jason's dock.`, "/map?at=the-keys", "/locals/keys-marina.jpg"],
    ],
  },
};
const Ico = ({ k }: { k: keyof typeof ICON }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{ICON[k]}</svg>
);
const Chev = () => (
  <svg className="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 4.5 3 3 3-3" /></svg>
);

export function Header() {
  const path = usePathname();
  const w = useWallet();
  const [menu, setMenu] = useState<keyof typeof MENUS | null>(null);
  const [mobile, setMobile] = useState(false);
  const [glass, setGlass] = useState(false);
  const [slim, setSlim] = useState(false);
  const shut = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // glass as soon as the page leaves the top; slim (short bar, C-only logo) going down, full again going up
    let last = scrollY, raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = scrollY; setGlass(y > 12);
        if (y < 80) setSlim(false); else if (y > last + 4) setSlim(true); else if (y < last - 6) setSlim(false);
        last = y;
      });
    };
    on();
    addEventListener("scroll", on, { passive: true });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    addEventListener("keydown", esc);
    return () => (removeEventListener("scroll", on), removeEventListener("keydown", esc));
  }, []);
  useEffect(() => (setMenu(null), setMobile(false)), [path]);

  const open = (k: keyof typeof MENUS | null) => (clearTimeout(shut.current), setMenu(k));
  const hover = () => matchMedia("(hover: hover)").matches;

  return (
    <nav id="nav" className={[glass && "frost", slim && !mobile && "slim", menu && "open", mobile && "mopen"].filter(Boolean).join(" ")}
      onMouseLeave={() => (shut.current = setTimeout(() => setMenu(null), 180))}>
      <div className="nwrap">
        <div className="bar">
          <Link href="/" aria-label={BRAND.brand} onMouseEnter={() => open(null)}><Logo slim={slim && !mobile} /></Link>
          <div className="nlinks">
            <button type="button" className={menu === "clips" ? "on" : ""} onMouseEnter={() => hover() && open("clips")}
              onClick={() => open(hover() || menu !== "clips" ? "clips" : null)} aria-expanded={menu === "clips"}>
              {MENUS.clips.label}<Chev />
            </button>
            <Link href="/map" className={path.startsWith("/map") ? "on" : ""} onMouseEnter={() => open(null)}>Map</Link>
            <Link href="/locals" className={path.startsWith("/locals") ? "on" : ""} onMouseEnter={() => open(null)}>Locals</Link>
            <Link href="/launch" className={path.startsWith("/launch") ? "on" : ""} onMouseEnter={() => open(null)}>Launch</Link>
            <Link href="/how" className={path.startsWith("/how") ? "on" : ""} onMouseEnter={() => open(null)}>How it works</Link>
          </div>
          <div className="navr">
            {OFFICIAL_MINT && <a href={`https://pump.fun/coin/${OFFICIAL_MINT}`} target="_blank" rel="noreferrer" className="btn btn-ghost hidden sm:inline-flex">${BRAND.ticker}</a>}
            <a className="xb" href={GTA_VI_URL} target="_blank" rel="noreferrer" aria-label="GTA VI on Rockstar Games" title="GTA VI · Rockstar Games"><RockstarIcon /></a>
            <a className="xb" href="https://github.com/bigrceo/getclip" target="_blank" rel="noreferrer" aria-label="GitHub"><GitHubIcon /></a>
            <a className="xb" href={BRAND.x} target="_blank" rel="noreferrer" aria-label="X"><XIcon /></a>
            {w.address ? (
              <span className="hidden items-center gap-1 md:inline-flex">
                <Link href={`/creator/${w.address}`} className="btn btn-ghost">{short(w.address)}</Link>
                <button onClick={w.disconnect} className="btn btn-ghost px-3" aria-label="Disconnect">×</button>
              </span>
            ) : (
              <button onClick={w.connect} className="btn btn-ghost hidden md:inline-flex">{w.connecting ? "Connecting…" : "Connect"}</button>
            )}
            <Link href="/launch" className="btn btn-hot hidden sm:inline-flex">Launch a clip</Link>
            <button className="mbtn" type="button" aria-label="Menu" aria-expanded={mobile} onClick={() => setMobile(!mobile)}><i /><i /></button>
          </div>
        </div>
        <div className={`mega${menu === "clips" ? " show" : ""}`} inert={menu !== "clips"}>
          <div className="mega-in">
            <div className="mrows">
              {MENUS.clips.rows.map(([i, t, d, h]) => (
                <Link key={t} className="mrow" href={h}>
                  <span className="mico"><Ico k={i} /></span>
                  <span><b>{t}</b><small>{d}</small></span>
                </Link>
              ))}
            </div>
            <div className="mcards">
              {MENUS.clips.cards.map(([t, d, h, img]) => (
                <a key={t} className="mcard" href={h}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <span className="mimg"><img src={img} alt="" loading="lazy" /><em className="mbadge">Open on the map</em></span>
                  <span className="mtxt"><b>{t}</b><small>{d}</small><i>↗</i></span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mlist" inert={!mobile}>
          <div>
            {MENUS.clips.rows.map(([, t, , h]) => <Link key={t} href={h}>{t}<span>↗</span></Link>)}
            <div className="pt-3 md:hidden">
              {w.address
                ? <button onClick={w.disconnect} className="btn btn-ghost w-full">{short(w.address)} · Disconnect</button>
                : <button onClick={w.connect} className="btn btn-ghost w-full">{w.connecting ? "Connecting…" : "Connect"}</button>}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
