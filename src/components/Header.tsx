"use client";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { Logo } from "./Logo";
import { DiscordIcon, XIcon } from "./icons";
import { short, useWallet } from "./wallet";

export function Header() {
  const w = useWallet();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-night/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link href="/" aria-label={BRAND.name}><Logo /></Link>
        <span className="text-line">/</span>
        <a href={BRAND.x} target="_blank" rel="noreferrer" className="p-2 text-haze hover:text-ink" aria-label="X"><XIcon /></a>
        <a href={BRAND.discord} target="_blank" rel="noreferrer" className="p-2 text-haze hover:text-ink" aria-label="Discord"><DiscordIcon /></a>
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
