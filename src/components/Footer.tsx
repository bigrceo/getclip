import Link from "next/link";
import { BRAND, OFFICIAL_MINT } from "@/lib/brand";
import { GitHubIcon, InstagramIcon, TikTokIcon, XIcon } from "./icons";

const COLS: [string, [string, string][]][] = [
  ["Clips", [["Launch a clip", "/launch"], ["How it works", "/how"]]],
  ["Leonida", [["The map", "/map"], ["Ocean Drive", "/map?at=ocean-drive"], ["The Keys", "/map?at=the-keys"]]],
  ["Locals", [["Lucia", "/locals/lucia"], ["Jason", "/locals/jason"], ["Hollis", "/locals/hollis"]]],
];

/** Footer as a postcard from Leonida: Ocean Drive at dusk behind, the see-through C, the state's name across the bottom. */
export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/locals/ocean-drive-bokeh.jpg" alt="" aria-hidden loading="lazy" className="absolute inset-0 size-full object-cover opacity-55" />
      <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #0a0618 0%, rgba(10,6,24,.55) 30%, rgba(40,10,50,.45) 70%, rgba(10,6,24,.9) 100%)" }} />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #ff3e8c, #ffb35c, transparent)" }} />

      <div className="relative mx-auto max-w-[1680px] px-6 pt-20 max-md:px-4 max-md:pt-14">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="max-w-[460px]">
            <span aria-hidden className="block size-[88px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,.95), rgba(255,195,138,.75))", WebkitMask: "url(/brand/logo-mask.png) center / 120% no-repeat", mask: "url(/brand/logo-mask.png) center / 120% no-repeat", filter: "drop-shadow(0 0 18px rgba(255,61,139,.7))" }} />
            <p className="mt-5 text-[30px] font-extrabold italic uppercase leading-[1.05] tracking-tight">Every GTA 6 clip<br /><span className="sunset-text">becomes a coin.</span></p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/launch" className="btn btn-hot h-11 px-5">Launch a clip</Link>
              {OFFICIAL_MINT ? <a href={`https://pump.fun/coin/${OFFICIAL_MINT}`} target="_blank" rel="noreferrer" className="btn btn-ghost h-11 px-5">${BRAND.ticker}</a>
                : <span className="btn btn-ghost pointer-events-none h-11 px-5">${BRAND.ticker} · CA soon</span>}
            </div>
            {OFFICIAL_MINT && <p className="mt-3 select-all break-all text-[12px] text-haze">CA {OFFICIAL_MINT}</p>}
          </div>
          <nav className="grid grid-cols-3 gap-x-14 gap-y-8 max-sm:grid-cols-2">
            {COLS.map(([h, links]) => (
              <div key={h}>
                <p className="mb-3 text-[12px] font-extrabold italic uppercase tracking-[.14em] text-[#ff8fb8]">{h}</p>
                <ul className="space-y-2">{links.map(([t, href]) => <li key={t}><Link href={href} className="text-[15px] text-ink/80 transition-colors hover:text-ink">{t}</Link></li>)}</ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-2">
          <a href={BRAND.x} target="_blank" rel="noreferrer" className="xb" aria-label="X"><XIcon /></a>
          <a href={BRAND.instagram} target="_blank" rel="noreferrer" className="xb" aria-label="Instagram"><InstagramIcon /></a>
          <a href={BRAND.tiktok} target="_blank" rel="noreferrer" className="xb" aria-label="TikTok"><TikTokIcon /></a>
          <a href="https://github.com/bigrceo/getclip" target="_blank" rel="noreferrer" className="xb" aria-label="GitHub"><GitHubIcon /></a>
          <span className="ml-auto text-[12px] font-extrabold italic uppercase tracking-[.14em] text-haze">State of Leonida · getclip.fun</span>
        </div>
        <p className="mt-6 max-w-[1100px] text-[12px] leading-[1.6] text-haze/80">Fan-made. Not affiliated with Rockstar Games or Take-Two Interactive. Map: Yanis V16 GTA VI Community Map via <a href="https://map.gtadb.org" className="underline" target="_blank" rel="noreferrer">gtadb.org</a> and contributors, <a href="https://creativecommons.org/licenses/by/4.0/" className="underline" target="_blank" rel="noreferrer">CC BY 4.0</a>, approximate and unofficial. Satellite imagery: Esri World Imagery (Esri, Maxar, Earthstar Geographics, and the GIS User Community), warped onto the fan map. Landmark heights: <a href="https://github.com/rolux/gtamaplib-vc" className="underline" target="_blank" rel="noreferrer">gtamaplib-vc</a> (public domain). Memecoins with no intrinsic value or utility. Not investment advice.</p>
      </div>

      <p aria-hidden className="sunset-text relative mt-6 select-none text-center font-sign uppercase leading-[.78]" style={{ fontSize: "clamp(96px, 22vw, 380px)", opacity: .9 }}>Leonida</p>
    </footer>
  );
}
