import "server-only";

export type Meta = { name: string; symbol: string; description: string; image: Buffer; twitter?: string; website?: string };

/** Uploads image + metadata to IPFS: Pinata when PINATA_JWT is set, else pump.fun's own endpoint. Returns the metadata URI. */
export async function uploadMetadata(m: Meta): Promise<string> {
  const jwt = process.env.PINATA_JWT;
  if (jwt) {
    const fd = new FormData();
    fd.append("file", new Blob([new Uint8Array(m.image)], { type: "image/jpeg" }), `${m.symbol}.jpg`);
    const img = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", { method: "POST", headers: { authorization: `Bearer ${jwt}` }, body: fd }).then((r) => r.json());
    if (!img.IpfsHash) throw new Error("Pinata image upload failed");
    const json = { name: m.name, symbol: m.symbol, description: m.description, image: `https://ipfs.io/ipfs/${img.IpfsHash}`, showName: true,
      createdOn: process.env.NEXT_PUBLIC_SITE_URL, ...(m.twitter ? { twitter: m.twitter } : {}), ...(m.website ? { website: m.website } : {}) };
    const meta = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", { method: "POST", headers: { authorization: `Bearer ${jwt}`, "content-type": "application/json" },
      body: JSON.stringify({ pinataContent: json, pinataMetadata: { name: `${m.symbol}.json` } }) }).then((r) => r.json());
    if (!meta.IpfsHash) throw new Error("Pinata metadata upload failed");
    return `https://ipfs.io/ipfs/${meta.IpfsHash}`;
  }
  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(m.image)], { type: "image/jpeg" }), `${m.symbol}.jpg`);
  fd.append("name", m.name); fd.append("symbol", m.symbol); fd.append("description", m.description); fd.append("showName", "true");
  if (m.twitter) fd.append("twitter", m.twitter);
  if (m.website) fd.append("website", m.website);
  const r = await fetch("https://pump.fun/api/ipfs", { method: "POST", body: fd });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j?.metadataUri) throw new Error("IPFS upload failed");
  return j.metadataUri as string;
}
