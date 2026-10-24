"use client";
import Link from "next/link";
import { BRAND, OFFICIAL_MINT } from "@/lib/brand";
import { Logo } from "./Logo";
import { XIcon } from "./icons";
import { short, useWallet } from "./wallet";

export function Header() {
  const w = useWallet();
  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-night/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center gap-3 px-4">
        <Link href="/" aria-label={BRAND.name}><Logo /></Link>
        <span className="hidden text-line sm:inline">/</span>
        <a href={BRAND.x} target="_blank" rel="noreferrer" className="hidden p-2 text-haze hover:text-ink sm:block" aria-label="X"><XIcon /></a>
        <a href={`https://pump.fun/coin/${OFFICIAL_MINT}`} target="_blank" rel="noreferrer" className="btn btn-ghost hidden sm:inline-flex">${BRAND.short}</a>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/launch" className="btn btn-hot">Launch<span className="hidden sm:inline"> a clip</span></Link>
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
