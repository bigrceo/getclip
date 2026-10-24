"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Trade } from "@/lib/types";
import { ago } from "@/lib/format";

export function LiveTrades({ initial, mint }: { initial: Trade[]; mint?: string }) {
  const [trades, setTrades] = useState(initial);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(async () => {
      tick((n) => n + 1);
      const r = await fetch(`/api/trades${mint ? `?mint=${mint}` : ""}`).then((r) => r.json()).catch(() => null);
      if (r?.trades) setTrades(r.trades);
    }, 6000);
    return () => clearInterval(t);
  }, [mint]);
  return (
    <div className="overflow-hidden">
      <ul className="flex gap-3 overflow-x-auto py-1 [scrollbar-width:none]">
        {trades.slice(0, 24).map((t) => (
          <li key={t.sig} className="rise shrink-0">
            <Link href={`/coin/${t.mint}`} className="flex items-center gap-2 border-2 border-line bg-deck px-2.5 py-1.5 text-sm hover:bg-deck-hi">
              <img src={`/api/coins/${t.mint}/still`} alt="" className="h-6 w-6 object-cover" loading="lazy" />
              <span className="font-bold">${t.ticker}</span>
              <span className="text-haze">{t.side === "buy" ? "bought" : "sold"}</span>
              <span className={t.side === "buy" ? "text-up" : "text-down"}>{t.side === "buy" ? "+" : "−"}{t.sol.toFixed(2)} SOL</span>
              <span className="text-haze/70">{ago(t.at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
