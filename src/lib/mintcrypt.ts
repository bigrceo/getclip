import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * At-rest encryption for mint_pool secrets: AES-256-GCM with MINT_POOL_KEY (32 bytes, base64 or hex).
 * Stored as "enc:v1:<base64(iv12 | ciphertext | tag16)>". Rows without the prefix are legacy plaintext base58.
 */
const PREFIX = "enc:v1:";
function key(): Buffer | null {
  const k = process.env.MINT_POOL_KEY?.trim();
  if (!k) return null;
  const b = /^[0-9a-f]{64}$/i.test(k) ? Buffer.from(k, "hex") : Buffer.from(k, "base64");
  if (b.length !== 32) throw new Error("MINT_POOL_KEY must be 32 bytes (base64 or 64 hex chars)");
  return b;
}
export const hasMintKey = () => key() !== null;
export function sealMintSecret(base58: string): string {
  const k = key();
  if (!k) return base58;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  c.setAAD(Buffer.from("mint_pool"));
  const ct = Buffer.concat([c.update(base58, "utf8"), c.final()]);
  return PREFIX + Buffer.concat([iv, ct, c.getAuthTag()]).toString("base64");
}
export function openMintSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const k = key();
  if (!k) throw new Error("mint_pool secret is encrypted but MINT_POOL_KEY is not set");
  const b = Buffer.from(stored.slice(PREFIX.length), "base64");
  const d = createDecipheriv("aes-256-gcm", k, b.subarray(0, 12));
  d.setAAD(Buffer.from("mint_pool"));
  d.setAuthTag(b.subarray(b.length - 16));
  return Buffer.concat([d.update(b.subarray(12, b.length - 16)), d.final()]).toString("utf8");
}
