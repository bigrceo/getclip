"use client";
import { useEffect, useState } from "react";
import type { Coin, Sort } from "@/lib/types";
import { CoinRow, CoinTile } from "./CoinCard";

const TABS: [Sort, string][] = [["hot", "Hot"], ["new", "New"], ["mcap", "Market cap"], ["graduating", "About to graduate"]];

export function CoinGrid({ initial }: { initial: Coin[] }) {
  const [sort, setSort] = useState<Sort>("hot");
  const [view, setView] = useState<"tiles" | "list">("tiles");
  const [coins, setCoins] = useState(initial);
  useEffect(() => { try { const v = localStorage.getItem("view"); if (v === "list" || v === "tiles") setView(v); } catch {} }, []);
  useEffect(() => {
    let live = true;
    fetch(`/api/coins?sort=${sort}&limit=120`).then((r) => r.json()).then((j) => live && j.coins && setCoins(j.coins)).catch(() => {});
    return () => { live = false; };
  }, [sort]);
  const pick = (v: "tiles" | "list") => { setView(v); try { localStorage.setItem("view", v); } catch {} };
  return (
    <section className="mx-auto max-w-[1680px] px-4">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <nav className="flex flex-wrap gap-x-5 gap-y-1" role="tablist">
          {TABS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={sort === k} onClick={() => setSort(k)}
              className={`label py-1 text-[12px] ${sort === k ? "!text-ink underline decoration-coral decoration-2 underline-offset-8" : "hover:!text-ink"}`}>{l}</button>
          ))}
        </nav>
        <div className="ml-auto flex gap-4">
          {(["tiles", "list"] as const).map((v) => (
            <button key={v} onClick={() => pick(v)} className={`label ${view === v ? "!text-ink" : "hover:!text-ink"}`}>{v === "tiles" ? "Tiles" : "List"}</button>
          ))}
        </div>
      </div>
      {coins.length === 0 ? <p className="py-16 text-center text-haze">Nothing here yet.</p> : view === "tiles" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {coins.map((c) => <CoinTile key={c.mint} c={c} />)}
        </div>
      ) : (
        <div className=" border-2 border-line">{coins.map((c, i) => <CoinRow key={c.mint} c={c} i={i} />)}</div>
      )}
    </section>
  );
}
