"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/** Paste a link → /launch?url=…; drop a video → upload, then /launch?ref=… */
export function HeroLaunch() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);
  async function upload(f: File) {
    setBusy(true); setErr("");
    const fd = new FormData(); fd.append("file", f);
    const r = await fetch("/api/drafts", { method: "POST", body: fd }).then((r) => r.json()).catch(() => ({ error: "Upload failed" }));
    setBusy(false);
    if (r.error) return setErr(r.error);
    router.push(`/launch?ref=${encodeURIComponent(r.draft.ref)}`);
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); router.push(url.trim() ? `/launch?url=${encodeURIComponent(url.trim())}` : "/launch"); }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
      className={`mx-auto mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border-2 border-dashed p-2 transition sm:flex-row ${drag ? "border-coral bg-deck-hi" : "border-line bg-deck"}`}>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a TikTok, Reels, Shorts or X video link"
        className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-haze/70" aria-label="Clip link" />
      <div className="flex gap-2">
        <button type="button" onClick={() => file.current?.click()} className="btn btn-ghost h-12 flex-1 whitespace-nowrap">{busy ? "Uploading…" : "Drop a video"}</button>
        <button className="btn btn-hot h-12 flex-1 px-6">Launch</button>
      </div>
      <input ref={file} type="file" accept="video/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {err && <p className="px-3 pb-1 text-sm text-down sm:hidden">{err}</p>}
    </form>
  );
}
