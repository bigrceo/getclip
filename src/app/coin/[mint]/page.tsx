import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoin, listHolders, listTrades } from "@/lib/data";
import { ago, pct, usd } from "@/lib/format";
import { Chart } from "@/components/Chart";
import { TradePanel } from "@/components/TradePanel";
import { Report } from "@/components/Report";
import { short } from "@/lib/format";
import { CopyButton } from "@/components/toast";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ mint: string }> }) {
  const c = await getCoin((await params).mint);
  return c ? { title: `$${c.ticker} ${c.name}`, description: `$${c.ticker} on clip.fun: ${usd(c.mcapUsd)} market cap. ${c.description ?? ""}`.trim() } : {};
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
  const top = stats.slice(0, 3), rest = stats.slice(3);
  return (
    <div className="enter mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6">
      <header className="flex flex-col gap-4 border-2 border-line bg-deck p-3 sm:p-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {c.loop ? <video src={c.loop} poster={c.still} autoPlay loop muted playsInline className="dither size-20 shrink-0 border-2 border-line object-cover sm:size-24" />
            : <img src={c.still} alt="" className="size-20 shrink-0 border-2 border-line object-cover sm:size-24" />}
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="font-sign text-2xl leading-tight sm:text-3xl"><span className="break-all">${c.ticker}</span> <span className="text-lg text-haze sm:text-xl">{c.name}</span></h1>
            {c.description && <p className="text-sm text-haze">{c.description}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-2"><span className="text-haze">{short(c.mint, 6)}</span><CopyButton text={c.mint} /></span>
              <a className="underline" href={`https://pump.fun/coin/${c.mint}`} target="_blank" rel="noreferrer">pump.fun</a>
              <a className="underline" href={`https://solscan.io/token/${c.mint}${/devnet/i.test(process.env.SOLANA_RPC_URL ?? "") ? "?cluster=devnet" : ""}`} target="_blank" rel="noreferrer">Solscan</a>
              <a className="underline" href={`https://dexscreener.com/solana/${c.mint}`} target="_blank" rel="noreferrer">DEX Screener</a>
              {c.sourceUrl && <a className="underline" href={c.sourceUrl} target="_blank" rel="noreferrer">Original clip</a>}
              <span className="text-haze">Creator fees: {c.feeMode === "holders" ? "to holders" : <Link className="underline" href={`/creator/${c.creator}`}>{short(c.creator)}</Link>}</span>
            </div>
          </div>
        </div>
        <div className="lg:w-[440px]">
          <dl className="grid grid-cols-3 gap-px bg-line">
            {top.map(([k, v]) => <div key={k} className="min-w-0 bg-night px-3 py-2"><dt className="label whitespace-nowrap">{k}</dt><dd className="mt-0.5 whitespace-nowrap font-sign text-base sm:text-lg">{v}</dd></div>)}
          </dl>
          {!c.migrated && <div className="mt-2.5" title={`${c.bondingPct.toFixed(0)}% of the bonding curve`}><div className="flex justify-between"><span className="label">Bonding curve</span><span className="label !text-ink">{c.bondingPct.toFixed(0)}%</span></div><div className="mt-1 h-6 border-2 border-line bg-night p-0.5"><div className="fill h-full bg-pink shadow-[inset_-3px_0_0_var(--color-sun)]" style={{ width: `${Math.max(2, c.bondingPct)}%` }} /></div></div>}
        </div>
      </header>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-4">
        <dl className="grid grid-cols-2 gap-px border-2 border-line bg-line sm:grid-cols-5">
          {rest.map(([k, v], i) => <div key={k} className={`bg-deck p-3 ${i === rest.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}><dt className="label">{k}</dt><dd className="mt-1 font-bold">{v}</dd></div>)}
        </dl>
        <div className=" border-2 border-line bg-deck p-3"><Chart trades={trades} /></div>
        <section>
          <h2 className="label mb-2">Trades</h2>
          <div className="overflow-hidden border-2 border-line">
            {trades.length === 0 && <p className="dither px-3 py-8 text-center text-sm text-haze">No trades yet. Be the first.</p>}
            {trades.slice(0, 30).map((t) => (
              <div key={t.sig} className="grid grid-cols-[1fr_auto_auto] gap-3 border-b-2 border-line px-3 py-2 text-sm last:border-0 sm:grid-cols-[8rem_1fr_auto_auto]">
                <span className="hidden text-haze sm:block">{short(t.wallet)}</span>
                <span className={t.side === "buy" ? "text-up" : "text-down"}>{t.side === "buy" ? "Bought" : "Sold"} {t.sol.toFixed(3)} SOL</span>
                <span className="text-haze">{usd(t.mcapUsd)}</span><span className="text-haze">{ago(t.at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <aside className="flex flex-col gap-4">
        <TradePanel mint={c.mint} ticker={c.ticker} migrated={c.migrated} />
        <section>
          <h2 className="label mb-2">Holders</h2>
          <div className=" border-2 border-line">
            {holders.slice(0, 15).map((h, i) => (
              <div key={h.wallet + i} className="flex justify-between border-b-2 border-line px-3 py-2 text-sm last:border-0">
                <span>{i + 1}. {h.curve ? "Bonding curve" : short(h.wallet)}{h.dev && <span className="label ml-2 !text-sun">Dev</span>}</span>
                <span className="text-haze">{h.pct.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </section>
        <Report mint={c.mint} />
      </aside>
      </div>
    </div>
  );
}
