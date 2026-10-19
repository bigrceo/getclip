import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { connection, isSolAddress } from "@/lib/sol";
import { fail, ok } from "@/lib/http";
export const runtime = "nodejs";
export async function GET(req: Request) {
  try {
    const u = new URL(req.url); const address = u.searchParams.get("address"); const mint = u.searchParams.get("mint");
    if (!isSolAddress(address)) throw new Error("Bad address");
    const conn = connection(); const owner = new PublicKey(address);
    const sol = (await conn.getBalance(owner)) / 1e9;
    let tokens = 0;
    if (isSolAddress(mint)) {
      const ata = getAssociatedTokenAddressSync(new PublicKey(mint), owner, true, TOKEN_2022_PROGRAM_ID);
      tokens = Number((await conn.getTokenAccountBalance(ata).catch(() => null))?.value.uiAmount ?? 0);
    }
    return ok({ sol, tokens });
  } catch (e) { return fail(e); }
}
