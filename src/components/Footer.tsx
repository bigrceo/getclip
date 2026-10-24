import Link from "next/link";
import { BRAND, OFFICIAL_MINT } from "@/lib/brand";
import { Logo } from "./Logo";
import { InstagramIcon, TikTokIcon, XIcon } from "./icons";

export function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-line">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-6 px-4 py-8">
        <Logo size={22} />
        <Link href="/how" className="text-haze hover:text-ink">How it works</Link>
        <a href={`https://pump.fun/coin/${OFFICIAL_MINT}`} target="_blank" rel="noreferrer" className="text-haze hover:text-ink">${BRAND.short}</a>
        <span className="select-all break-all text-haze">CA: {OFFICIAL_MINT}</span>
        <div className="ml-auto flex gap-2">
          <a href={BRAND.x} className="p-2 text-haze hover:text-ink" aria-label="X"><XIcon /></a>
          <a href={BRAND.instagram} className="p-2 text-haze hover:text-ink" aria-label="Instagram"><InstagramIcon /></a>
          <a href={BRAND.tiktok} className="p-2 text-haze hover:text-ink" aria-label="TikTok"><TikTokIcon /></a>
        </div>
      </div>
    </footer>
  );
}
