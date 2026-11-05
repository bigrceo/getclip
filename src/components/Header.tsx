"use client";
import Link from "next/link";
import { BRAND, OFFICIAL_MINT } from "@/lib/brand";
import { Logo } from "./Logo";
import { RockstarIcon, XIcon } from "./icons";
import { short, useWallet } from "./wallet";

export const GTA_VI_URL = "https://www.rockstargames.com/VI";

export function Header() {
  const w = useWallet();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-night/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-3 px-4">
        <Link href="/" aria-label={BRAND.brand}><Logo /></Link>
        <span className="hidden text-line md:inline">/</span>
        <span className="hidden text-[14px] text-haze md:inline">{BRAND.tagline.split(". ")[0]}.</span>
        <div className="ml-auto flex items-center gap-2">
          <a href={GTA_VI_URL} target="_blank" rel="noreferrer" className="p-1.5 opacity-90 hover:opacity-100" aria-label="GTA VI on Rockstar Games" title="GTA VI · Rockstar Games"><RockstarIcon /></a>
          <a href={BRAND.x} target="_blank" rel="noreferrer" className="p-2 text-haze hover:text-ink" aria-label="X"><XIcon /></a>
          {OFFICIAL_MINT && <a href={`https://pump.fun/coin/${OFFICIAL_MINT}`} target="_blank" rel="noreferrer" className="btn btn-ghost hidden sm:inline-flex">${BRAND.short}</a>}
          <Link href="/launch" className="btn btn-hot max-sm:hidden">Launch<span className="hidden sm:inline"> a clip</span></Link>
          {w.address ? (
            <div className="flex items-center gap-1">
              <Link href={`/creator/${w.address}`} className="btn btn-ghost">{short(w.address)}</Link>
              <button onClick={w.disconnect} className="btn btn-ghost px-3" aria-label="Disconnect">×</button>
            </div>
          ) : (
            <button onClick={w.connect} className="btn btn-ghost">{w.connecting ? "Connecting…" : "Connect"}</button>
          )}
        </div>
      </div>
    </header>
  );
}
