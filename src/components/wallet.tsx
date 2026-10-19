"use client";
import { Buffer } from "buffer";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Provider = {
  publicKey?: { toString(): string } | null; isPhantom?: boolean;
  connect(o?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signTransaction<T>(tx: T): Promise<T>;
  on?(ev: string, cb: (...a: any[]) => void): void;
};
type Ctx = { address: string | null; connecting: boolean; available: boolean; connect(): Promise<string | null>; disconnect(): Promise<void>; sign(b64: string): Promise<string> };
const WalletCtx = createContext<Ctx | null>(null);

function provider(): Provider | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.phantom?.solana ?? w.solflare ?? w.backpack?.solana ?? w.solana ?? null;
}

/** Injected Solana wallet (Phantom first, then Solflare / Backpack / any wallet-standard injector exposing window.solana). */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const p = provider();
    setAvailable(Boolean(p));
    p?.connect({ onlyIfTrusted: true }).then((r) => setAddress(r.publicKey.toString())).catch(() => {});
    p?.on?.("accountChanged", (pk: any) => setAddress(pk ? pk.toString() : null));
  }, []);
  const connect = useCallback(async () => {
    const p = provider();
    if (!p) { window.open("https://phantom.app/download", "_blank"); return null; }
    setConnecting(true);
    try { const r = await p.connect(); const a = r.publicKey.toString(); setAddress(a); return a; }
    catch { return null; } finally { setConnecting(false); }
  }, []);
  const disconnect = useCallback(async () => { await provider()?.disconnect(); setAddress(null); }, []);
  const sign = useCallback(async (b64: string) => {
    const p = provider(); if (!p) throw new Error("No wallet");
    const { Transaction } = await import("@solana/web3.js");
    const tx = Transaction.from(Buffer.from(b64, "base64"));
    const signed = await p.signTransaction(tx);
    return Buffer.from(signed.serialize({ requireAllSignatures: false })).toString("base64");
  }, []);
  return <WalletCtx.Provider value={{ address, connecting, available, connect, disconnect, sign }}>{children}</WalletCtx.Provider>;
}
export function useWallet() {
  const c = useContext(WalletCtx);
  if (!c) throw new Error("WalletProvider missing");
  return c;
}
export { short } from "@/lib/format";
