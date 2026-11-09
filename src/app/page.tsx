import Link from "next/link";
import { BRAND, OFFICIAL_MINT } from "@/lib/brand";
import { listCoins, listTrades } from "@/lib/data";
import { Ticker } from "@/components/Ticker";
import { LiveTrades } from "@/components/LiveTrades";
import { CoinGrid } from "@/components/CoinGrid";
import { MapHero } from "@/components/MapHero";

/** pump.fun mark: the tilted two-tone pill. */
function PumpLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-label="pump.fun" role="img">
      <g transform="rotate(-45 16 16)">
        <rect x="4.5" y="10" width="23" height="12" rx="6" fill="#ffffff" stroke="#14281d" strokeWidth="1.6" />
        <path d="M16 10.8h5.5a5.2 5.2 0 0 1 0 10.4H16z" fill="#5fd38d" />
        <line x1="16" y1="10.4" x2="16" y2="21.6" stroke="#14281d" strokeWidth="1.6" />
        <rect x="4.5" y="10" width="23" height="12" rx="6" fill="none" stroke="#14281d" strokeWidth="1.6" />
      </g>
    </svg>
  );
}
import { Countdown } from "@/components/Countdown";
import { CopyCA } from "@/components/CopyCA";

export const dynamic = "force-dynamic";

const H2 = ({ script, children }: { script: string; children: React.ReactNode }) => (
  <><p className="script">{script}</p><h2 className="sec-title sunset-text mb-3.5">{children}</h2></>
);

export default async function Home() {
  const [hot, byMcap, trades] = await Promise.all([listCoins("hot"), listCoins("mcap", 24), listTrades(undefined, 30)]);
  const volume = byMcap.reduce((a, c) => a + (c.volumeSol || 0), 0);
  return (
    <>
      <MapHero coins={byMcap} volumeSol={volume} />
      <Ticker coins={byMcap} />
      <section className="mx-auto max-w-[1680px] px-4 py-6">
        <h2 className="label mb-2">Live trades</h2>
        <LiveTrades initial={trades} />
      </section>
      <CoinGrid initial={hot} />

      <section id="how" className="mx-auto max-w-[1160px] px-6 pt-[90px] max-md:px-4 max-md:pt-16">
        <H2 script="How it">Works</H2>
        <div className="route mb-6 mt-2.5 flex flex-wrap items-center gap-2.5">
          <span>GTA VI clip</span><i /><span className="hot inline-flex items-center gap-2"><PumpLogo /> pump.fun coin</span><i /><span>Plot on the map</span>
        </div>
        <div className="grid gap-[18px] md:grid-cols-3">
          <div className="step"><b>01</b><h3 className="my-1.5 text-[20px] font-bold">Paste a clip from {BRAND.state}</h3><p className="leading-[1.55] text-haze">A TikTok, X or YouTube link of any GTA VI moment, or your own capture. Pick the square and the seconds that loop. That clip becomes the coin&apos;s face.</p></div>
          <div className="step"><b>02</b><h3 className="my-1.5 text-[20px] font-bold">It launches on pump.fun</h3><p className="leading-[1.55] text-haze">{BRAND.name} pays the launch (about {BRAND.launchCostSol} SOL). No wallet needed: the coin is live in one transaction, its address ending in <b className="text-ink">{BRAND.vanitySuffix}</b>, on every terminal at once. Creator fees are yours.</p></div>
          <div className="step"><b>03</b><h3 className="my-1.5 text-[20px] font-bold">It gets a plot on the map</h3><p className="leading-[1.55] text-haze">Every clip coin pins to a district of {BRAND.state}: Vice City, Vice Beach, Port Gellhorn, Ambrosia, the Everglades, the Keys. The biggest market caps sit on the map above; the first one that takes a plot keeps it.</p></div>
        </div>
        <div className="glass mt-[18px] px-[22px] py-1.5">
          <p className="leading-[1.55] text-haze">Downtown never sleeps. The Keys never ask questions. Out in the swamp something with a gold chain runs the water, and up in the hills a hunter swears he saw it take a selfie.</p>
          <p className="leading-[1.55] text-haze">Fifty million players, a phone in every pocket, a fake brand on every corner. The first clip of each of them is a coin. {BRAND.state} is the map it all lands on.</p>
        </div>
      </section>

      <section id="launch" className="mx-auto max-w-[1160px] px-6 pt-[90px] max-md:px-4 max-md:pt-16">
        <H2 script="How to">Launch</H2>
        <ul className="m-0 my-5 grid list-none gap-3.5 p-0 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Find the moment", "A wasted screen, a five-star chase, a fake ad on a billboard, an NPC saying something unhinged. If it is already on TikTok or X, copy the link."],
            ["Paste it here", `Drop the link or the file in the box on the map. ${BRAND.name} grabs the video, you choose the square and the loop.`],
            ["Name it, launch it", "Name, ticker, one line. Paste the wallet the creator fees go to, or connect one to make the first buy. Free, one transaction."],
            ["Hold your plot", `Your coin shows on pump.fun, on every terminal and on the ${BRAND.state} map. Share the link: the clip is the ad.`],
          ].map(([t, b], i) => (
            <li key={t} className="glass flex gap-3.5 p-[18px]"><b className="num-badge">{i + 1}</b><div><h3 className="mb-1 text-[16px] font-bold">{t}</h3><p className="m-0 leading-[1.5] text-haze">{b}</p></div></li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/launch" className="btn btn-hot">Launch a clip</Link>
          {OFFICIAL_MINT ? <CopyCA mint={OFFICIAL_MINT} /> : <span className="text-sm text-sun">${BRAND.ticker} CA: soon, only from this page and our X.</span>}
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-6 pt-[90px] max-md:px-4 max-md:pt-16">
        <H2 script="Your own legend">The rules</H2>
        <ul className="glass m-0 my-5 list-disc py-5 pl-11 pr-5 leading-[1.6]">
          <li className="my-1.5">Only clips you have the right to use. No Rockstar, GTA or Take-Two names or art in the coin itself, no impersonation. Coins that break this are hidden from the map.</li>
          <li className="my-1.5">Anyone can launch, most memecoins lose their value. Check a coin before buying: its holders, what the dev holds, its trades. Never buy more than you can lose.</li>
          <li className="my-1.5">{BRAND.name} takes no share and charges no fee. Creator fees are paid by pump.fun to the wallet you gave.</li>
        </ul>
        <div className="glass p-5">
          <i className="text-[12px] not-italic uppercase tracking-[1px] text-haze">GTA VI hits {BRAND.state} in</i>
          <div className="mt-2 max-w-md"><Countdown to={BRAND.releaseAt} /></div>
        </div>
      </section>
    </>
  );
}
