import "server-only";
import { PublicKey } from "@solana/web3.js";
import { OnlinePumpSdk } from "@pump-fun/pump-sdk";
import { connection } from "./sol";

/** Live unclaimed creator fees (pump.fun curve + PumpSwap creator vaults), read on chain. null when no RPC is configured or the read fails. */
export async function creatorVaultSol(creator: string): Promise<number | null> {
  if (!process.env.SOLANA_RPC_URL) return null;
  try {
    const bal = await new OnlinePumpSdk(connection()).getCreatorVaultBalanceBothPrograms(new PublicKey(creator));
    return Number(bal.toString()) / 1e9;
  } catch { return null; }
}
