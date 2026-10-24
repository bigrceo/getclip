"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { useWallet } from "./wallet";

type Draft = { ref: string; title?: string; author?: string };
type Step = "source" | "crop" | "details" | "done";
const fileUrl = (ref: string) => `/api/drafts/file?ref=${encodeURIComponent(ref)}`;

export function LaunchFlow({ initialUrl, initialRef }: { initialUrl?: string; initialRef?: string }) {
  const w = useWallet();
  const [step, setStep] = useState<Step>(initialRef ? "crop" : "source");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [draft, setDraft] = useState<Draft | null>(initialRef ? { ref: initialRef } : null);
  const [busy, setBusy] = useState(""); const [err, setErr] = useState(""); const [note, setNote] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 1, start: 0, length: 4 });
  const [render, setRender] = useState<{ stillRef: string; loopRef: string } | null>(null);
  const [form, setForm] = useState({ name: "", ticker: "", description: "", recipient: "", feeMode: "creator", firstBuySol: "" });
  const [done, setDone] = useState<{ mint: string; sig: string; dryRun?: boolean } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => { if (initialUrl) resolve(initialUrl); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (w.address && !form.recipient) setForm((f) => ({ ...f, recipient: w.address! })); }, [w.address]); // eslint-disable-line

  async function resolve(u: string) {
    setBusy("Finding the video…"); setErr(""); setNote("");
    const r = await fetch("/api/drafts/link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: u }) }).then((r) => r.json()).catch(() => ({ error: "Network error" }));
    setBusy("");
    if (r.error) return setErr(r.error);
    if (!r.draft) { setNote(r.note ?? "Drop the video file to continue."); return; }
    setDraft({ ref: r.draft.ref, title: r.title, author: r.author });
    if (r.title) setForm((f) => ({ ...f, name: f.name || r.title.replace(/#\S+/g, "").trim().slice(0, 32) }));
    setStep("crop");
  }
  async function upload(f: File) {
    setBusy("Uploading…"); setErr("");
    const fd = new FormData(); fd.append("file", f);
    const r = await fetch("/api/drafts", { method: "POST", body: fd }).then((r) => r.json()).catch(() => ({ error: "Upload failed" }));
    setBusy("");
    if (r.error) return setErr(r.error);
    setDraft({ ref: r.draft.ref }); setStep("crop");
  }
  async function doRender() {
    if (!draft) return;
    setBusy("Cutting your loop…"); setErr("");
    const r = await fetch("/api/drafts/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ref: draft.ref, crop }) }).then((r) => r.json()).catch(() => ({ error: "Render failed" }));
    setBusy("");
    if (r.error) return setErr(r.error);
    setRender(r); setStep("details");
  }
  async function launch() {
    if (!render) return;
    setErr("");
    const buy = Number(form.firstBuySol || 0);
    let buyer: string | undefined;
    if (buy > 0) { buyer = w.address ?? (await w.connect()) ?? undefined; if (!buyer) return setErr("Connect a wallet for the first buy."); }
    setBusy("Creating your coin on pump.fun…");
    try {
      const body = { name: form.name, ticker: form.ticker, description: form.description, recipient: form.recipient, feeMode: form.feeMode,
        firstBuySol: buy, buyer, stillRef: render.stillRef, loopRef: render.loopRef, sourceUrl: url || undefined };
      const r = await fetch("/api/launch/prepare", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
      if (r.error) throw new Error(r.error);
      if (r.tx) {
        setBusy("Approve in your wallet…");
        const signed = await w.sign(r.tx);
        setBusy("Sending…");
        const s = await fetch("/api/launch/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: r.id, tx: signed }) }).then((r) => r.json());
        if (s.error) throw new Error(s.error);
        setDone(s);
      } else setDone(r);
      setStep("done");
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(""); }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-sign text-3xl sm:text-4xl">Launch a clip</h1>
      <p className="mt-2 text-haze">Free: {BRAND.name} pays the launch. Your coin goes live on pump.fun in one transaction.</p>
      <ol className="mt-6 flex gap-5">
        {(["source", "crop", "details", "done"] as Step[]).map((s, i) => (
          <li key={s} className={`label ${step === s ? "!text-coral" : ""}`}>{i + 1} {s === "source" ? "Clip" : s === "crop" ? "Square" : s === "details" ? "Coin" : "Live"}</li>
        ))}
      </ol>
      <div className="mt-4 border-2 border-line bg-deck p-4 sm:p-6">
        {step === "source" && (
          <div className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); if (url.trim()) resolve(url.trim()); }} className="flex flex-col gap-2 sm:flex-row">
              <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="tiktok.com/@…/video/…, instagram.com/reel/…, youtube.com/shorts/…, x.com/…/status/…" />
              <button className="btn btn-hot h-11">Fetch</button>
            </form>
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
              onClick={() => file.current?.click()} className="cursor-pointer border-2 border-dashed border-line p-8 text-center text-haze hover:border-coral">
              Or drop a video here (mp4, mov, webm, 60 MB max)
            </div>
            <input ref={file} type="file" accept="video/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            {note && <p className="text-sun">{note}</p>}
            <p className="text-sm text-haze">Tip: put {BRAND.name}/ before any clip link to start from it.</p>
          </div>
        )}
        {step === "crop" && draft && <CropPicker src={fileUrl(draft.ref)} crop={crop} onChange={setCrop} onDone={doRender} />}
        {step === "details" && render && (
          <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
            <video src={fileUrl(render.loopRef)} autoPlay loop muted playsInline className="aspect-square w-full bg-night object-cover" />
            <div className="space-y-3">
              <L t="Name"><input className="field" maxLength={32} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></L>
              <L t="Ticker"><input className="field uppercase" maxLength={10} value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase() })} /></L>
              <L t="Description (optional)"><input className="field" maxLength={200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></L>
              <L t="Creator fees go to">
                <div className="flex gap-2">
                  <input className="field" placeholder="Solana address" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value.trim() })} />
                  {!w.address && <button type="button" onClick={w.connect} className="btn btn-ghost h-11 shrink-0">Connect</button>}
                </div>
              </L>
              <div className="flex gap-5">
                {[["creator", "To this address"], ["holders", "To holders"]].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2 text-sm"><input type="radio" checked={form.feeMode === k} onChange={() => setForm({ ...form, feeMode: k })} className="accent-coral" />{l}</label>
                ))}
              </div>
              <L t="First buy in SOL (optional, signed by your wallet)"><input className="field" inputMode="decimal" placeholder="0" value={form.firstBuySol} onChange={(e) => setForm({ ...form, firstBuySol: e.target.value.replace(/[^0-9.]/g, "") })} /></L>
              <button onClick={launch} disabled={!!busy} className="btn btn-hot h-12 w-full text-lg">Launch ${form.ticker || "COIN"}</button>
              <button onClick={() => setStep("crop")} className="label hover:!text-ink">Back to the square</button>
            </div>
          </div>
        )}
        {step === "done" && done && (
          <div className="space-y-3 text-center">
            <p className="font-sign text-2xl">{done.dryRun ? "Dry run complete" : "Your coin is live"}</p>
            {done.dryRun && <p className="text-sun">LAUNCH_DRY_RUN is on: nothing was sent on chain.</p>}
            <p className="break-all text-haze">{done.mint}</p>
            {!done.dryRun && <div className="flex justify-center gap-2"><Link href={`/coin/${done.mint}`} className="btn btn-hot">Open coin</Link>
              <a href={`https://pump.fun/coin/${done.mint}`} target="_blank" rel="noreferrer" className="btn btn-ghost">pump.fun</a></div>}
          </div>
        )}
        {busy && <p className="mt-4 text-haze">{busy}</p>}
        {err && <p className="mt-4 text-down">{err}</p>}
      </div>
    </div>
  );
}

const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block space-y-1"><span className="label">{t}</span>{children}</label>;

/** Square crop over the video: drag to move, slider to size, scrub the start of the loop. */
function CropPicker({ src, crop, onChange, onDone }: { src: string; crop: { x: number; y: number; size: number; start: number; length: number }; onChange: (c: any) => void; onDone: () => void }) {
  const v = useRef<HTMLVideoElement>(null); const box = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 1, h: 1, d: 0 });
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const side = Math.min(dim.w, dim.h) * crop.size; // px in video space
  const fw = side / dim.w, fh = side / dim.h;     // fractions of frame
  const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n));
  useEffect(() => { if (v.current && dim.d) v.current.currentTime = crop.start; }, [crop.start, dim.d]);
  return (
    <div className="space-y-4">
      <div ref={box} className="relative mx-auto w-fit max-w-full touch-none select-none overflow-hidden bg-night">
        <video ref={v} src={src} muted playsInline loop autoPlay className="block max-h-[60vh] max-w-full"
          onLoadedMetadata={(e) => { const t = e.currentTarget; setDim({ w: t.videoWidth, h: t.videoHeight, d: t.duration }); onChange({ ...crop, x: (1 - Math.min(t.videoWidth, t.videoHeight) / t.videoWidth) / 2, y: (1 - Math.min(t.videoWidth, t.videoHeight) / t.videoHeight) / 2 }); }} />
        <div className="absolute cursor-move border-2 border-coral shadow-[0_0_0_9999px_rgba(20,18,58,.6)]"
          style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${fw * 100}%`, height: `${fh * 100}%` }}
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, cx: crop.x, cy: crop.y }; }}
          onPointerMove={(e) => { if (!drag.current || !box.current) return; const r = box.current.getBoundingClientRect();
            onChange({ ...crop, x: clamp(drag.current.cx + (e.clientX - drag.current.x) / r.width, 1 - fw), y: clamp(drag.current.cy + (e.clientY - drag.current.y) / r.height, 1 - fh) }); }}
          onPointerUp={() => { drag.current = null; }} />
      </div>
      <label className="block"><span className="label">Square size</span>
        <input type="range" min={0.3} max={1} step={0.01} value={crop.size} className="w-full accent-coral"
          onChange={(e) => { const s = +e.target.value; const nfw = Math.min(dim.w, dim.h) * s / dim.w, nfh = Math.min(dim.w, dim.h) * s / dim.h; onChange({ ...crop, size: s, x: clamp(crop.x, 1 - nfw), y: clamp(crop.y, 1 - nfh) }); }} /></label>
      <label className="block"><span className="label">Loop starts at {crop.start.toFixed(1)} s</span>
        <input type="range" min={0} max={Math.max(0, dim.d - 1)} step={0.1} value={crop.start} className="w-full accent-coral" onChange={(e) => onChange({ ...crop, start: +e.target.value })} /></label>
      <label className="block"><span className="label">Loop length {crop.length} s</span>
        <input type="range" min={1} max={6} step={0.5} value={crop.length} className="w-full accent-coral" onChange={(e) => onChange({ ...crop, length: +e.target.value })} /></label>
      <button onClick={onDone} className="btn btn-hot h-12 w-full">Use this square</button>
    </div>
  );
}
