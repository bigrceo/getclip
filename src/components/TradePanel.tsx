"use client";
import { useEffect, useState } from "react";
import { useWallet } from "./wallet";

export function TradePanel({ mint, ticker, migrated }: { mint: string; ticker: string; migrated: boolean }) {
  const w = useWallet();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [bal, setBal] = useState<{ sol: number; tokens: number } | null>(null);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (w.address) fetch(`/api/wallet?address=${w.address}&mint=${mint}`).then((r) => r.json()).then((j) => !j.error && setBal(j)).catch(() => {}); }, [w.address, mint]);
  async function go() {
    setMsg("");
    const a = w.address ?? (await w.connect()); if (!a) return;
    setBusy(true);
    try {
      const q = await fetch("/api/trade/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mint, wallet: a, side, amount: Number(amount) }) }).then((r) => r.json());
      if (q.error) throw new Error(q.error);
      const signed = await w.sign(q.tx);
      const { Connection, Transaction } = await import("@solana/web3.js");
      const { Buffer } = await import("buffer");
      const conn = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com", "confirmed");
      const sig = await conn.sendRawTransaction(Transaction.from(Buffer.from(signed, "base64")).serialize());
      setMsg("Sent. Confirming…");
      for (let i = 0; i < 20; i++) {
        const s = await fetch(`/api/trade/fill?sig=${sig}&wallet=${a}&mint=${mint}`).then((r) => r.json());
        if (s.err) throw new Error("Trade failed on chain");
        if (s.status === "confirmed" || s.status === "finalized") { setMsg("Done."); break; }
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }
  return (
    <div className=" border-2 border-line bg-deck p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="relative grid flex-1 grid-cols-2 border-2 border-line bg-night" role="tablist">
          <span aria-hidden className={`absolute inset-y-0 left-0 w-1/2 transition-[transform,background-color] duration-200 ease-[var(--ease-snap)] ${side === "buy" ? "bg-up" : "translate-x-full bg-down"}`} />
          {(["buy", "sell"] as const).map((s) => <button key={s} role="tab" aria-selected={side === s} onClick={() => { setSide(s); setAmount(""); }}
            className={`relative h-10 font-sign text-sm uppercase transition-colors ${side === s ? "text-night" : "text-haze hover:text-ink"}`}>{s === "buy" ? "Buy" : "Sell"}</button>)}
        </div>
        <span className="label">{migrated ? "PumpSwap" : "Bonding curve"}</span>
      </div>
      <input className="field" inputMode="decimal" placeholder={side === "buy" ? "Amount in SOL" : `Amount of $${ticker}`} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {(side === "buy" ? ["0.1", "0.5", "1"] : ["25", "50", "100"]).map((p) => (
          <button key={p} className="label h-9 border-2 border-line px-2.5 transition-colors hover:border-sky hover:!text-ink active:translate-y-px" onClick={() => setAmount(side === "buy" ? p : bal ? String(Math.floor(bal.tokens * +p / 100)) : "")}>{side === "buy" ? `${p} SOL` : `${p}%`}</button>
        ))}
        {bal && <span className="label ml-auto">{side === "buy" ? `${bal.sol.toFixed(3)} SOL` : `${bal.tokens.toLocaleString()} $${ticker}`}</span>}
      </div>
      <button onClick={go} disabled={busy || !(Number(amount) > 0)} className={`btn mt-3 h-12 w-full text-night shadow-[3px_3px_0_var(--color-night)] transition-colors ${side === "buy" ? "bg-up" : "bg-down"} disabled:opacity-50`}>
        {busy ? "Working…" : w.address ? `${side === "buy" ? "Buy" : "Sell"} $${ticker}` : "Connect to trade"}
      </button>
      {msg && <p role="status" className={`enter mt-2 text-sm ${msg === "Done." ? "text-up" : msg.startsWith("Sent") ? "text-sky" : "text-down"}`}>{msg}</p>}
    </div>
  );
}
