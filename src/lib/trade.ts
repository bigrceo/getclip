import "server-only";
import { ComputeBudgetProgram, PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import { NATIVE_MINT, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { OnlinePumpSdk, PUMP_SDK, canonicalPumpPoolPda, getBuyTokenAmountFromSolAmount, getSellSolAmountFromTokenAmount } from "@pump-fun/pump-sdk";
import { OnlinePumpAmmSdk, PUMP_AMM_SDK } from "@pump-fun/pump-swap-sdk";
import { connection } from "./sol";

export type TradeReq = { mint: string; wallet: string; side: "buy" | "sell"; amount: number; slippagePct?: number };

/**
 * Prepares a buy/sell for the user's own wallet: bonding curve while it trades there, PumpSwap after graduation.
 * The user is fee payer and sole signer; we never hold funds.
 */
export async function buildTrade(r: TradeReq) {
  const conn = connection();
  const mint = new PublicKey(r.mint), user = new PublicKey(r.wallet);
  const slippage = Math.min(50, Math.max(0.5, r.slippagePct ?? 5));
  const online = new OnlinePumpSdk(conn);
  const curve = await online.fetchBondingCurve(mint).catch(() => null);
  let ixs, expected: string, venue: "curve" | "pumpswap";
  if (curve && !curve.complete) {
    venue = "curve";
    const [global, feeConfig] = await Promise.all([online.fetchGlobal(), online.fetchFeeConfig()]);
    if (r.side === "buy") {
      const st = await online.fetchBuyState(mint, user, TOKEN_2022_PROGRAM_ID);
      const solAmount = new BN(Math.round(r.amount * 1e9));
      const amount = getBuyTokenAmountFromSolAmount({ global, feeConfig, mintSupply: curve.tokenTotalSupply, bondingCurve: st.bondingCurve, amount: solAmount, quoteMint: NATIVE_MINT });
      ixs = await PUMP_SDK.buyInstructions({ global, ...st, mint, user, amount, solAmount, slippage, tokenProgram: TOKEN_2022_PROGRAM_ID });
      expected = (Number(amount.toString()) / 1e6).toFixed(0);
    } else {
      const st = await online.fetchSellState(mint, user, TOKEN_2022_PROGRAM_ID);
      const amount = new BN(Math.round(r.amount * 1e6));
      const solAmount = getSellSolAmountFromTokenAmount({ global, feeConfig, mintSupply: curve.tokenTotalSupply, bondingCurve: st.bondingCurve, amount });
      ixs = await PUMP_SDK.sellInstructions({ global, ...st, mint, user, amount, solAmount, slippage, tokenProgram: TOKEN_2022_PROGRAM_ID, mayhemMode: false });
      expected = (Number(solAmount.toString()) / 1e9).toFixed(4);
    }
  } else {
    venue = "pumpswap";
    const amm = new OnlinePumpAmmSdk(conn);
    const pool = canonicalPumpPoolPda(mint);
    const ata = getAssociatedTokenAddressSync(mint, user, true, TOKEN_2022_PROGRAM_ID);
    const st = await amm.swapSolanaState(pool, user, ata);
    ixs = r.side === "buy"
      ? await PUMP_AMM_SDK.buyQuoteInput(st, new BN(Math.round(r.amount * 1e9)), slippage)
      : await PUMP_AMM_SDK.sellBaseInput(st, new BN(Math.round(r.amount * 1e6)), slippage);
    expected = "";
  }
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: user, blockhash, lastValidBlockHeight })
    .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }), ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }), ...ixs);
  return { tx: tx.serialize({ requireAllSignatures: false }).toString("base64"), venue, expected, lastValidBlockHeight };
}
