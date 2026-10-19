"use client";
import Link from "next/link";
import { useRef } from "react";
import type { Coin } from "@/lib/types";
import { ago, pct, usd } from "@/lib/format";

/** Tile: still frame, plays the clip loop on hover. */
export function CoinTile({ c }: { c: Coin }) {
  const v = useRef<HTMLVideoElement>(null);
  return (
    <Link href={`/coin/${c.mint}`} className="group block overflow-hidden rounded-2xl border border-line bg-deck transition hover:-translate-y-0.5 hover:border-coral"
      onMouseEnter={() => v.current?.play().catch(() => {})} onMouseLeave={() => { if (v.current) { v.current.pause(); v.current.currentTime = 0; } }}>
      <div className="relative aspect-square bg-night">
        <img src={c.still} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        {c.loop && <video ref={v} src={c.loop} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition group-hover:opacity-100" />}
        <span className="label absolute left-2 top-2 text-ink drop-shadow">{c.official ? "Official" : c.migrated ? "Graduated" : ago(c.createdAt)}</span>
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-bold">${c.ticker}</span>
          <span className={`text-sm font-semibold ${c.change24h >= 0 ? "text-up" : "text-down"}`}>{pct(c.change24h)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-2 text-sm text-haze">
          <span className="truncate">{c.name}</span><span>{usd(c.mcapUsd)}</span>
        </div>
        {!c.migrated && <div className="mt-2 h-1 overflow-hidden rounded bg-night"><div className="h-full bg-sun" style={{ width: `${c.bondingPct}%` }} /></div>}
      </div>
    </Link>
  );
}

export function CoinRow({ c, i }: { c: Coin; i: number }) {
  return (
    <Link href={`/coin/${c.mint}`} className="grid grid-cols-[2rem_3rem_1fr_auto_auto] items-center gap-3 border-b border-line px-2 py-2 hover:bg-deck sm:grid-cols-[2rem_3rem_1fr_6rem_6rem_6rem_5rem]">
      <span className="text-haze">{i + 1}</span>
      <img src={c.still} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" />
      <span className="min-w-0"><span className="font-bold">${c.ticker}</span> <span className="truncate text-haze">{c.name}</span></span>
      <span className="text-right">{usd(c.mcapUsd)}</span>
      <span className={`text-right ${c.change24h >= 0 ? "text-up" : "text-down"}`}>{pct(c.change24h)}</span>
      <span className="hidden text-right text-haze sm:block">{c.holders} holders</span>
      <span className="hidden text-right text-haze sm:block">{c.migrated ? "Graduated" : `${c.bondingPct.toFixed(0)}%`}</span>
    </Link>
  );
}
