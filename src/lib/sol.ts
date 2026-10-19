import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

export function connection() {
  const url = process.env.SOLANA_RPC_URL;
  if (!url) throw new Error("SOLANA_RPC_URL is not set");
  return new Connection(url, "confirmed");
}
/** Pays the launch (~0.006 SOL) and co-signs every create transaction. */
export function platformKeypair(): Keypair {
  const k = process.env.PLATFORM_SECRET_KEY;
  if (!k) throw new Error("PLATFORM_SECRET_KEY is not set");
  return Keypair.fromSecretKey(bs58.decode(k));
}
export function isSolAddress(s: string | null | undefined): s is string {
  if (!s || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) return false;
  try { new PublicKey(s); return true; } catch { return false; }
}
export const dryRun = () => process.env.LAUNCH_DRY_RUN !== "0";
/** True when the server RPC points at devnet (test-only code paths key off this; mainnet behavior never changes). */
export const isDevnet = () => /devnet/i.test(process.env.SOLANA_RPC_URL ?? "");
