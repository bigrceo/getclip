"use client";
import Link from "next/link";
import { useState } from "react";
import { BRAND, OFFICIAL_MINT } from "@/lib/brand";
import type { Coin } from "@/lib/types";
import { pct, usd } from "@/lib/format";
import dynamic from "next/dynamic";
import { plotFor, PLOTS } from "./StateMap";
const StateMap = dynamic(() => import("./StateMap").then((m) => m.StateMap), { ssr: false, loading: () => <div className="absolute inset-0 grid place-items-center font-sign text-[28px] tracking-wide" style={{ background: "radial-gradient(circle, #23104a, #0a0618)" }}>Loading Leonida…</div> });
import { HeroLaunch } from "./HeroLaunch";
import { Countdown } from "./Countdown";
import { CoinDrawer } from "./CoinDrawer";

/** Leonida-style hero: the state map full-bleed, a glass card on the left, the "on the map" rail on the right. */
export function MapHero({ coins, volumeSol }: { coins: Coin[]; volumeSol: number }) {
  void volumeSol;
  const [active, setActive] = useState<string | null>(null);
  const [lead, tail] = BRAND.tagline.split(". ");
  const card = (
        <div data-pin-obstacle className="glass z-20 w-[min(440px,100%-48px)] p-5 pb-4 md:absolute md:left-6 md:top-6 max-md:mx-4 max-md:mt-3 max-md:w-auto">
          <p className="script">Welcome to the</p>
          <h1 className="font-sign text-[64px] uppercase leading-[.92] max-md:text-[50px]">
            <span className="sunset-text block" style={{ filter: "drop-shadow(0 4px 22px rgba(255,61,139,.45))" }}>{BRAND.state}</span>
            <span className="block">Clip Exchange</span>
          </h1>
          <p className="mb-3.5 mt-2.5 text-[16px] text-haze">{lead}. <span className="text-ink">{tail}</span></p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="stat"><i>Clips on the map</i><b>{coins.length}</b></div>
            <div className="stat"><i>Open plots</i><b>{Math.max(0, PLOTS.length - coins.length)}</b></div>
          </div>
          <HeroLaunch compact />
          <div className="mt-2.5 flex gap-2.5">
            {OFFICIAL_MINT
              ? <a href={`https://pump.fun/coin/${OFFICIAL_MINT}`} target="_blank" rel="noreferrer" className="btn btn-hot flex-1">Buy ${BRAND.short}</a>
              : <span className="btn btn-ghost flex-1 cursor-default opacity-70">${BRAND.short} · soon</span>}
            <Link href="/how" className="btn btn-ghost flex-1">How it works</Link>
          </div>
          <div className="mt-3.5">
            <i className="text-[12px] not-italic uppercase tracking-[1px] text-haze">GTA VI hits {BRAND.state} in</i>
            <div className="mt-1.5"><Countdown to={BRAND.releaseAt} /></div>
          </div>
        </div>
  );
  const rail = (
        <aside data-pin-obstacle className="glass z-20 flex w-[290px] flex-col px-2.5 pb-2 pt-3.5 md:absolute md:bottom-[70px] md:right-6 md:top-6 max-md:mx-4 max-md:mt-3 max-md:max-h-[360px] max-md:w-auto">
          <div className="flex items-baseline justify-between px-2 pb-2.5">
            <b className="font-sign text-[20px] font-normal uppercase tracking-wide">On the map</b>
            <i className="text-[12px] not-italic text-haze">{coins.length} {coins.length === 1 ? "clip" : "clips"}</i>
          </div>
          <ul className="m-0 list-none overflow-y-auto p-0">
            {coins.length === 0 && <li className="px-2 py-6 text-center text-sm text-haze">No clip on the map yet.<br /><Link href="/launch" className="text-sun underline">Claim the first plot</Link></li>}
            {coins.map((c, i) => (
              <li key={c.mint}>
                <button type="button" onClick={() => setActive(c.mint)} onDoubleClick={() => (location.href = `/coin/${c.mint}`)}
                  className={`flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-pink/15 ${active === c.mint ? "bg-pink/15" : ""}`}>
                  <img src={c.still} alt="" className={`size-[38px] rounded-full border border-line object-cover ${c.official ? "border-pink" : ""}`} loading="lazy" />
                  <span className="min-w-0 flex-1">
                    <b className="block text-[14px]">${c.ticker}</b>
                    <i className="block truncate text-[12px] not-italic text-haze">{c.official ? "State token" : plotFor(c, i).district}</i>
                  </span>
                  <span className="text-right">
                    <b className="block text-[14px]">{usd(c.mcapUsd)}</b>
                    <i className={`text-[12px] not-italic ${c.change24h >= 0 ? "text-up" : "text-down"}`}>{pct(c.change24h)}</i>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
  );
  return (
    <section className="relative md:h-[calc(100svh-4rem)] md:min-h-[620px] md:overflow-hidden max-md:flex max-md:flex-col max-md:pb-4">
      <div className="md:absolute md:inset-0 max-md:relative max-md:h-[64svh] max-md:min-h-[420px]">
      <StateMap coins={coins} active={active} onActive={setActive}>
        <div className="hidden md:contents">{card}{rail}</div>
        {active && coins.some((c) => c.mint === active) && <CoinDrawer coin={coins.find((c) => c.mint === active)!} district={plotFor(coins.find((c) => c.mint === active)!, coins.findIndex((c) => c.mint === active)).district} onClose={() => setActive(null)} />}
      </StateMap>
      </div>
      <div className="md:hidden">{card}{rail}</div>
    </section>
  );
}
