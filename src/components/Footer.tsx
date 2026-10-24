import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { MOCK_COINS } from "@/lib/mock";
import { Logo } from "./Logo";
import { InstagramIcon, TikTokIcon, XIcon } from "./icons";

export function Footer() {
  const official = process.env.NEXT_PUBLIC_OFFICIAL_MINT || MOCK_COINS[0].mint;
  return (
    <footer className="mt-16 border-t-2 border-line">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-6 px-4 py-8">
        <Logo size={22} />
        <Link href="/how" className="text-haze hover:text-ink">How it works</Link>
        <Link href={`/coin/${official}`} className="text-haze hover:text-ink">${BRAND.short}</Link>
        <div className="ml-auto flex gap-2">
          <a href={BRAND.x} className="p-2 text-haze hover:text-ink" aria-label="X"><XIcon /></a>
          <a href={BRAND.instagram} className="p-2 text-haze hover:text-ink" aria-label="Instagram"><InstagramIcon /></a>
          <a href={BRAND.tiktok} className="p-2 text-haze hover:text-ink" aria-label="TikTok"><TikTokIcon /></a>
        </div>
      </div>
    </footer>
  );
}
