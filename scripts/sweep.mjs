// Send everything left on the platform wallet back to an address.
// usage: node scripts/sweep.mjs <destination> [--go]   (dry run without --go)
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";

const [dest, flag] = process.argv.slice(2);
if (!dest) throw new Error("usage: node scripts/sweep.mjs <destination> [--go]");
const j = JSON.parse(fs.readFileSync(new URL("../.secrets/mainnet-platform.json", import.meta.url)));
const kp = Keypair.fromSecretKey(Array.isArray(j.secret) ? Uint8Array.from(j.secret) : bs58.decode(j.secret));
const conn = new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");
const bal = await conn.getBalance(kp.publicKey);
const amount = bal - 5000;
console.log(`${kp.publicKey.toBase58()} → ${dest}: ${(amount / 1e9).toFixed(6)} SOL`);
if (amount <= 0) process.exit(0);
if (flag !== "--go") { console.log("dry run, add --go to send"); process.exit(0); }
const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: new PublicKey(dest), lamports: amount }));
console.log("sig", await sendAndConfirmTransaction(conn, tx, [kp]));
