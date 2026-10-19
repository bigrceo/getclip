import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoin, listHolders, listTrades } from "@/lib/data";
import { ago, pct, usd } from "@/lib/format";
import { Chart } from "@/components/Chart";
import { TradePanel } from "@/components/TradePanel";
import { Report } from "@/components/Report";
import { short } from "@/lib/format";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ mint: string }> }) {
  const c = await getCoin((await params).mint);
  return c ? { title: `$${c.ticker} ${c.name}`, openGraph: { images: [c.still] } } : {};
}

export default async function CoinPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const c = await getCoin(mint);
  if (!c) notFound();
  const [trades, holders] = await Promise.all([listTrades(mint, 60), listHolders(c)]);
  const top10 = holders.filter((h) => !h.curve).slice(0, 10).reduce((s, h) => s + h.pct, 0);
  const dev = holders.find((h) => h.dev)?.pct ?? 0;
  const stats: [string, string][] = [["Market cap", usd(c.mcapUsd)], ["24h", pct(c.change24h)], ["Volume", `${c.volumeSol.toFixed(1)} SOL`], ["Holders", String(c.holders)],
    ["Top 10", `${top10.toFixed(1)}%`], ["Dev holds", `${dev.toFixed(1)}%`], ["Bonding", c.migrated ? "Graduated" : `${c.bondingPct.toFixed(0)}%`], ["Age", ago(c.createdAt)]];
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          {c.loop ? <video src={c.loop} poster={c.still} autoPlay loop muted playsInline className="aspect-square w-full rounded-2xl border border-line object-cover sm:w-56" />
            : <img src={c.still} alt="" className="aspect-square w-full rounded-2xl border border-line object-cover sm:w-56" />}
          <div className="min-w-0">
            <h1 className="font-sign text-3xl">${c.ticker}</h1>
            <p className="text-lg">{c.name}</p>
            {c.description && <p className="mt-1 text-haze">{c.description}</p>}
            <p className="mt-3 break-all text-sm text-haze">{c.mint}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <a className="underline" href={`https://pump.fun/coin/${c.mint}`} target="_blank" rel="noreferrer">pump.fun</a>
              <a className="underline" href={`https://solscan.io/token/${c.mint}`} target="_blank" rel="noreferrer">Solscan</a>
              <a className="underline" href={`https://dexscreener.com/solana/${c.mint}`} target="_blank" rel="noreferrer">DEX Screener</a>
              {c.sourceUrl && <a className="underline" href={c.sourceUrl} target="_blank" rel="noreferrer">Original clip</a>}
            </div>
            <p className="mt-3 text-sm text-haze">Creator fees: {c.feeMode === "holders" ? "to holders" : <Link className="underline" href={`/creator/${c.creator}`}>{short(c.creator)}</Link>}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {stats.map(([k, v]) => <div key={k} className="bg-deck p-3"><dt className="label">{k}</dt><dd className="mt-1 font-bold">{v}</dd></div>)}
        </dl>
        <div className="rounded-2xl border border-line bg-deck p-3"><Chart trades={trades} /></div>
        <section>
          <h2 className="label mb-2">Trades</h2>
          <div className="overflow-hidden rounded-2xl border border-line">
            {trades.slice(0, 30).map((t) => (
              <div key={t.sig} className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-line px-3 py-2 text-sm last:border-0 sm:grid-cols-[8rem_1fr_auto_auto]">
                <span className="hidden text-haze sm:block">{short(t.wallet)}</span>
                <span className={t.side === "buy" ? "text-up" : "text-down"}>{t.side === "buy" ? "Bought" : "Sold"} {t.sol.toFixed(3)} SOL</span>
                <span className="text-haze">{usd(t.mcapUsd)}</span><span className="text-haze">{ago(t.at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <aside className="space-y-6">
        <TradePanel mint={c.mint} ticker={c.ticker} migrated={c.migrated} />
        <section>
          <h2 className="label mb-2">Holders</h2>
          <div className="rounded-2xl border border-line">
            {holders.slice(0, 15).map((h, i) => (
              <div key={h.wallet + i} className="flex justify-between border-b border-line px-3 py-2 text-sm last:border-0">
                <span>{i + 1}. {h.curve ? "Bonding curve" : short(h.wallet)}{h.dev && <span className="label ml-2 !text-sun">Dev</span>}</span>
                <span className="text-haze">{h.pct.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </section>
        <Report mint={c.mint} />
      </aside>
    </div>
  );
}
