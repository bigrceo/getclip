import { BRAND } from "@/lib/brand";
import { listCoins, listTrades } from "@/lib/data";
import { Ticker } from "@/components/Ticker";
import { LiveTrades } from "@/components/LiveTrades";
import { CoinGrid } from "@/components/CoinGrid";
import { HeroLaunch } from "@/components/HeroLaunch";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [hot, byMcap, trades] = await Promise.all([listCoins("hot"), listCoins("mcap", 20), listTrades(undefined, 30)]);
  const [lead, tail] = BRAND.tagline.split(". ");
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-10 pt-14 text-center sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 vice-wash" />
        <div aria-hidden className="hero-glow" />
        <h1 className="relative mx-auto max-w-5xl font-sign text-5xl leading-[1] sm:text-6xl lg:text-7xl">
          {lead}.<br /><span className="text-coral">{tail}</span>
        </h1>
        <p className="relative mx-auto mt-4 max-w-xl text-base text-haze sm:text-lg">{BRAND.sub}</p>
        <HeroLaunch />
      </section>
      <Ticker coins={byMcap} />
      <section className="mx-auto max-w-[1680px] px-4 py-6">
        <h2 className="label mb-2">Live trades</h2>
        <LiveTrades initial={trades} />
      </section>
      <CoinGrid initial={hot} />
    </>
  );
}
