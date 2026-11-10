import Link from "next/link";
import { notFound } from "next/navigation";
import { LocalsSection } from "@/components/LocalsSection";
import { LOCALS, localById } from "@/lib/locals";
import { listCoins } from "@/lib/data";
import { usd, pct } from "@/lib/format";

export const revalidate = 30;
export function generateStaticParams() { return LOCALS.map((l) => ({ id: l.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const l = localById((await params).id);
  return l ? { title: `${l.name} · ${l.role}`, description: l.bio } : {};
}

export default async function LocalPage({ params }: { params: Promise<{ id: string }> }) {
  const l = localById((await params).id);
  if (!l) notFound();
  const others = LOCALS.filter((x) => x.id !== l.id);
  const coins = (await Promise.all((l.keywords ?? [l.id]).map((k) => listCoins("mcap", 24, k).catch(() => [])))).flat()
    .filter((c, i, a) => a.findIndex((x) => x.mint === c.mint) === i).slice(0, 12);

  return (
    <div className="mx-auto max-w-[1240px] px-6 pb-24 pt-8 max-md:px-4">
      <nav className="mb-5 text-[13px] text-haze"><Link href="/locals" className="hover:text-ink">Locals</Link> <span className="opacity-50">/</span> <span className="text-ink">{l.name}</span></nav>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* 3D portrait in their place */}
        <div className="h-[min(78vh,760px)] min-h-[460px]"><LocalsSection only={l.id} /></div>

        <div className="flex flex-col">
          <p className="label text-sun">${l.ticker} · {l.role}</p>
          <h1 className="font-sign text-[96px] uppercase leading-[.86] max-md:text-[72px]"><span className="sunset-text">{l.name}</span></h1>
          <p className="mt-2 text-[15px] text-haze">{l.place}</p>
          <div className="mt-5 space-y-3 text-[17px] leading-[1.6] text-ink/90">{(l.story ?? [l.bio]).map((p) => <p key={p}>{p}</p>)}</div>

          <dl className="mt-6 grid grid-cols-2 gap-2.5">
            {(l.facts ?? []).map(([k, v]) => (
              <div key={k} className="stat"><i>{k}</i><b className="!text-[17px]">{v}</b></div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/launch" className="btn btn-hot h-12 px-6">Launch a clip of {l.name}</Link>
            <Link href="/map" className="btn btn-ghost h-12 px-6">Find {l.name === "Lucia" ? "her" : "him"} on the map</Link>
          </div>
        </div>
      </div>

      {/* on location: a short loop of them in their place */}
      {l.video && (
        <section className="mt-16 grid items-center gap-8 md:grid-cols-[1fr_420px]">
          <div className="max-md:order-2">
            <p className="script">On location</p>
            <h2 className="sec-title sunset-text">{l.place?.includes("Keys") ? "The Keys" : "Ocean Drive"}</h2>
            <p className="mt-3 max-w-[520px] leading-[1.6] text-haze">{l.name} on {l.name === "Lucia" ? "her" : "his"} home turf, {l.place}. Clip this, and it is a coin.</p>
          </div>
          <div className="relative overflow-hidden rounded-[22px] border border-white/10 shadow-[0_30px_70px_-30px_rgba(255,61,139,.55)]">
            <video src={l.video} poster={l.mugshot} autoPlay muted loop playsInline preload="metadata" className="block aspect-[3/4] w-full object-cover" />
          </div>
        </section>
      )}

      {/* file photo */}
      {l.mugshot && (
        <section className="mt-16 grid items-center gap-8 md:grid-cols-[380px_1fr]">
          <figure className="mug">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.mugshot} alt={`${l.name}, file photo`} width={800} height={800} />
            <figcaption className="plate"><b className="block font-sign text-[22px] uppercase leading-none tracking-wide">{l.name}</b><span className="text-[11px] tracking-[.18em] text-white/60">LEONIDA · VICE CITY PD</span></figcaption>
          </figure>
          <div>
            <p className="script">On file</p>
            <h2 className="sec-title sunset-text">The record</h2>
            <p className="mt-3 max-w-[560px] leading-[1.6] text-haze">The photo the Vice City PD keeps on {l.name}. Every clip of {l.name === "Lucia" ? "her" : "him"} that turns up online can become a coin on {l.place?.includes("Keys") ? "the Keys" : "Ocean Drive"}, and the first one on the map keeps the plot.</p>
          </div>
        </section>
      )}

      {/* clip coins of this local */}
      <section className="mt-16">
        <p className="script">Clips of</p>
        <h2 className="sec-title sunset-text mb-4">{l.name}</h2>
        {coins.length === 0 ? (
          <div className="glass flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="text-haze">No clip coin of {l.name} yet. The first one takes the plot.</p>
            <Link href="/launch" className="btn btn-hot h-11 px-5">Launch the first one</Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coins.map((c) => (
              <Link key={c.mint} href={`/coin/${c.mint}`} className="glass flex items-center gap-3 p-3 transition-colors hover:border-pink/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.still} alt="" className="size-14 rounded-xl object-cover" loading="lazy" />
                <span className="min-w-0 flex-1"><b className="block">${c.ticker}</b><i className="block truncate text-[13px] not-italic text-haze">{c.name}</i></span>
                <span className="text-right"><b className="block text-[14px]">{usd(c.mcapUsd)}</b><i className={`text-[12px] not-italic ${c.change24h >= 0 ? "text-up" : "text-down"}`}>{pct(c.change24h)}</i></span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* the other local */}
      <section className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
        {others.map((o) => (
          <Link key={o.id} href={`/locals/${o.id}`} className="group flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {o.mugshot && <img src={o.mugshot} alt="" className="size-16 rounded-2xl object-cover transition-transform group-hover:scale-105" />}
            <span><i className="label block not-italic text-haze">Next local</i><b className="font-sign text-[34px] uppercase leading-none group-hover:text-pink">{o.name} →</b></span>
          </Link>
        ))}
        <Link href="/locals" className="btn btn-ghost">All the Locals</Link>
      </section>
    </div>
  );
}
