import Link from "next/link";
import { BRAND, OFFICIAL_MINT } from "@/lib/brand";
import { Logo } from "./Logo";
import { InstagramIcon, TikTokIcon, XIcon } from "./icons";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-6 px-4 py-8">
        <Logo size={22} />
        <Link href="/how" className="text-haze hover:text-ink">How it works</Link>
        {OFFICIAL_MINT ? <><a href={`https://pump.fun/coin/${OFFICIAL_MINT}`} target="_blank" rel="noreferrer" className="text-haze hover:text-ink">${BRAND.short}</a>
        <span className="select-all break-all text-haze">CA: {OFFICIAL_MINT}</span></> : <span className="text-haze">${BRAND.short}: CA soon</span>}
        <p className="basis-full text-[12px] leading-[1.6] text-haze">Fan-made. Not affiliated with Rockstar Games or Take-Two Interactive. Map: Yanis V16 GTA VI Community Map via <a href="https://map.gtadb.org" className="underline" target="_blank" rel="noreferrer">gtadb.org</a> and contributors, <a href="https://creativecommons.org/licenses/by/4.0/" className="underline" target="_blank" rel="noreferrer">CC BY 4.0</a>, approximate and unofficial. Satellite imagery: Esri World Imagery (Esri, Maxar, Earthstar Geographics, and the GIS User Community), warped onto the fan map. Landmark heights: <a href="https://github.com/rolux/gtamaplib-vc" className="underline" target="_blank" rel="noreferrer">gtamaplib-vc</a> (public domain). Memecoins with no intrinsic value or utility. Not investment advice.</p>
        <div className="ml-auto flex gap-2">
          <a href={BRAND.x} className="p-2 text-haze hover:text-ink" aria-label="X"><XIcon /></a>
          <a href={BRAND.instagram} className="p-2 text-haze hover:text-ink" aria-label="Instagram"><InstagramIcon /></a>
          <a href={BRAND.tiktok} className="p-2 text-haze hover:text-ink" aria-label="TikTok"><TikTokIcon /></a>
        </div>
      </div>
    </footer>
  );
}
