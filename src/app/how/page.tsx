import Link from "next/link";
import { BRAND } from "@/lib/brand";
export const metadata = { title: "How it works", description: `pump.fun coins, clips only. Launch yours free, from a TikTok, Reels, Shorts or X video.` };
const S = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <section className="border-t border-line py-6"><h2 className="font-sign text-xl">{t}</h2><div className="mt-2 space-y-2 text-haze">{children}</div></section>
);
export default function How() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-sign text-4xl">How {BRAND.name} works</h1>
      <p className="mt-2 text-lg text-haze">pump.fun coins, viral clips only.</p>
      <div className="mt-8">
        <S t="Launch a coin from any clip"><p>Paste a TikTok, Instagram Reel, YouTube Short or X video link, or drop a video file. Place its square, pick the few seconds that loop, name it. Your coin is created on pump.fun in one transaction and shows up there and on every terminal at once, its address ending in <b className="text-ink">{BRAND.vanitySuffix}</b>.</p>
          <p>Put {BRAND.name}/ before any clip link to start from it.</p></S>
        <S t="Free, and no wallet needed"><p>{BRAND.name} pays the launch (about {BRAND.launchCostSol} SOL). Paste the address the creator fees go to, or connect a wallet. A wallet signs only if you make the first buy, in the same transaction as the launch.</p></S>
        <S t="Where the fees go"><p>pump.fun pays a creator fee on every trade of your coin: to you, or, if you choose, to its holders, paid out by pump.fun itself. {BRAND.name} takes no share and charges no fee.</p>
          <p>Creator fees are claimed on pump.fun; your creator page here shows what your coins have made.</p></S>
        <S t="Trading"><p>Buys and sells go from your own wallet straight to pump.fun: its bonding curve, then PumpSwap once a coin graduates. {BRAND.name} never holds your funds: it prepares the transaction, your wallet signs it, and only that exact transaction is sent.</p></S>
        <S t="What to watch for"><p>Anyone can launch a coin, and most memecoins lose their value. Check a coin before buying: its holders, what the ten biggest and its dev hold, its trades. Never buy more than you can lose.</p>
          <p>Only launch clips you have the right to use. See something offensive, stolen or a scam? Use “Report this coin” on its page.</p></S>
      </div>
      <Link href="/launch" className="btn btn-hot mt-6">Launch a clip</Link>
    </div>
  );
}
