"use client";
import Link from "next/link";
import { BRAND, OFFICIAL_MINT } from "@/lib/brand";
import { Logo } from "./Logo";
import { XIcon } from "./icons";
import { short, useWallet } from "./wallet";

export function Header() {
  const w = useWallet();
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-night/95 to-night/0">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-3 px-4">
        <Link href="/" aria-label={BRAND.name}><Logo /></Link>
        <nav className="ml-4 hidden gap-[18px] text-[14px] font-semibold lg:flex"><a href="/#how" className="opacity-85 hover:text-sun hover:opacity-100">How it works</a><a href="/#launch" className="opacity-85 hover:text-sun hover:opacity-100">Launch</a><a href={BRAND.x} target="_blank" rel="noreferrer" className="flex items-center gap-1 opacity-85 hover:text-sun hover:opacity-100"><XIcon /></a></nav>
        {OFFICIAL_MINT && <a href={`https://pump.fun/coin/${OFFICIAL_MINT}`} target="_blank" rel="noreferrer" className="btn btn-ghost hidden sm:inline-flex">${BRAND.short}</a>}
        <div className="ml-auto flex items-center gap-2">
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
