import { creatorCoins } from "@/lib/data";
import { isSolAddress } from "@/lib/sol";
import { notFound } from "next/navigation";
import { CoinTile } from "@/components/CoinCard";
import { usd } from "@/lib/format";
import { creatorVaultSol } from "@/lib/fees";
export const dynamic = "force-dynamic";
export default async function Creator({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  if (!isSolAddress(address)) notFound();
  const coins = await creatorCoins(address);
  const unclaimed = await creatorVaultSol(address);
  const fees = coins.reduce((s, c) => s + c.feesSol, 0), mcap = coins.reduce((s, c) => s + c.mcapUsd, 0);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <p className="label">Creator</p>
      <h1 className="mt-1 break-all font-sign text-2xl">{address}</h1>
      <dl className="mt-6 flex flex-wrap gap-10">
        <div><dt className="label">Coins</dt><dd className="text-2xl font-bold">{coins.length}</dd></div>
        <div><dt className="label">Creator fees earned</dt><dd className="text-2xl font-bold">{fees.toFixed(3)} SOL</dd></div>
        {unclaimed !== null && <div><dt className="label">Unclaimed on pump.fun</dt><dd className="text-2xl font-bold">{unclaimed.toFixed(4)} SOL</dd></div>}
        <div><dt className="label">Combined market cap</dt><dd className="text-2xl font-bold">{usd(mcap)}</dd></div>
      </dl>
      <p className="mt-2 text-sm text-haze">Fees are paid by pump.fun and claimed there.</p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{coins.map((c) => <CoinTile key={c.mint} c={c} />)}</div>
      {!coins.length && <p className="py-10 text-haze">No coins yet.</p>}
    </div>
  );
}
