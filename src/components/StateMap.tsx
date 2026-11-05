"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Coin } from "@/lib/types";
import { pct, usd } from "@/lib/format";

/** Map image (public/map/leonida.jpg) size and the plots coins get pinned to, in u/v of that image. */
const W = 4096, H = 2286;
export const PLOTS: { id: string; district: string; u: number; v: number }[] = [
  { id: "hq", district: "Vice City", u: 0.627, v: 0.405 },
  { id: "east", district: "Vice City", u: 0.66, v: 0.44 }, { id: "west", district: "Vice City", u: 0.595, v: 0.435 },
  { id: "club", district: "Vice City", u: 0.595, v: 0.52 }, { id: "studio", district: "Vice City", u: 0.69, v: 0.31 },
  { id: "bank", district: "Vice City", u: 0.575, v: 0.27 }, { id: "boardwalk", district: "Ocean Strip", u: 0.695, v: 0.6 },
  { id: "stilthouse", district: "The Keys", u: 0.12, v: 0.85 }, { id: "boatyard", district: "The Keys", u: 0.545, v: 0.8 },
  { id: "swamp", district: "The Swamp", u: 0.33, v: 0.62 }, { id: "hills", district: "The Hills", u: 0.31, v: 0.13 },
  { id: "lot-1", district: "Outskirts", u: 0.49, v: 0.47 }, { id: "lot-2", district: "Outskirts", u: 0.48, v: 0.53 },
  { id: "lot-3", district: "Outskirts", u: 0.52, v: 0.6 }, { id: "lot-4", district: "Outskirts", u: 0.56, v: 0.62 },
  { id: "lot-5", district: "Outskirts", u: 0.49, v: 0.66 }, { id: "lot-6", district: "Outskirts", u: 0.415, v: 0.32 },
  { id: "lot-7", district: "Outskirts", u: 0.45, v: 0.3 }, { id: "lot-8", district: "Outskirts", u: 0.37, v: 0.4 },
  { id: "lot-9", district: "Outskirts", u: 0.73, v: 0.19 }, { id: "lot-10", district: "Outskirts", u: 0.77, v: 0.22 },
  { id: "lot-11", district: "Outskirts", u: 0.8, v: 0.18 }, { id: "lot-12", district: "Outskirts", u: 0.855, v: 0.165 },
  { id: "port", district: "The Port", u: 0.21, v: 0.33 }, { id: "lot-14", district: "The Keys", u: 0.47, v: 0.86 },
  { id: "lot-15", district: "The Keys", u: 0.26, v: 0.92 }, { id: "lot-16", district: "The Keys", u: 0.055, v: 0.745 },
];
/** Stable plot per coin: the official coin owns HQ, the rest hash their mint onto the other plots. */
export function plotFor(c: Coin, i: number) {
  if (c.official) return PLOTS[0];
  let h = 0; for (const ch of c.mint) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const free = PLOTS.slice(1);
  return free[(h + i) % free.length];
}

type View = { x: number; y: number; s: number };

export function StateMap({ coins, active, onActive, children }: { coins: Coin[]; active: string | null; onActive: (m: string | null) => void; children?: React.ReactNode }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const view = useRef<View>({ x: 0, y: 0, s: 0.3 });
  const [, bump] = useState(0);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const apply = useCallback(() => {
    const v = view.current, el = world.current; if (!el) return;
    el.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.s})`;
    el.style.setProperty("--inv", String(1 / v.s));
  }, []);
  const clamp = useCallback((v: View) => {
    const b = box.current; if (!b) return v;
    const bw = b.clientWidth, bh = b.clientHeight;
    const minS = Math.max(bw / W, bh / H) * 0.9, maxS = 1.2;
    v.s = Math.min(maxS, Math.max(minS, v.s));
    const ww = W * v.s, wh = H * v.s, slack = 0.25;
    v.x = Math.min(bw * slack, Math.max(bw - ww - bw * slack, v.x));
    v.y = Math.min(bh * slack, Math.max(bh - wh - bh * slack, v.y));
    return v;
  }, []);
  /** Centre the view on a u/v point at scale s (animated). */
  const focus = useCallback((u: number, v: number, s?: number) => {
    const b = box.current, el = world.current; if (!b || !el) return;
    const S = s ?? view.current.s;
    const target = clamp({ s: S, x: b.clientWidth / 2 - u * W * S, y: b.clientHeight / 2 - v * H * S });
    el.style.transition = "transform .6s cubic-bezier(.2,.8,.2,1)";
    view.current = target; apply();
    setTimeout(() => { if (el) el.style.transition = ""; }, 650);
  }, [apply, clamp]);
  useEffect(() => {
    const b = box.current; if (!b) return;
    let ready = false;
    const init = () => {
      if (ready || !b.clientWidth || !b.clientHeight) return;
      ready = true;
      const s = Math.max(b.clientWidth / W, b.clientHeight / H) * 1.25;
      view.current = clamp({ s, x: b.clientWidth * 0.55 - 0.63 * W * s, y: b.clientHeight / 2 - 0.43 * H * s });
      apply(); bump((n) => n + 1);
    };
    init();
    const ro = new ResizeObserver(() => { if (!ready) init(); else { view.current = clamp(view.current); apply(); } });
    ro.observe(b);
    return () => ro.disconnect();
  }, [apply, clamp]);
  useEffect(() => {
    if (!active) return;
    const i = coins.findIndex((c) => c.mint === active); if (i < 0) return;
    const p = plotFor(coins[i], i); focus(p.u, p.v, Math.max(view.current.s, 0.45));
  }, [active, coins, focus]);
  const onWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest(".glass")) return; // let the page scroll from the card and the rail
    e.preventDefault();
    const b = box.current!.getBoundingClientRect();
    const px = e.clientX - b.left, py = e.clientY - b.top;
    const v = view.current, k = Math.exp(-e.deltaY * 0.0015);
    const ns = Math.min(1.2, Math.max(0.05, v.s * k)), r = ns / v.s;
    view.current = clamp({ s: ns, x: px - (px - v.x) * r, y: py - (py - v.y) * r }); apply();
  };
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".pin")) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: view.current.x, vy: view.current.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    view.current = clamp({ ...view.current, x: d.vx + dx, y: d.vy + dy }); apply();
  };
  const onUp = () => { drag.current = null; };
  return (
    <div ref={box} onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      className="absolute inset-0 touch-none overflow-hidden" style={{ background: "radial-gradient(circle at 50% 40%, #1b6f8e, #0f3d55 60%, #0a0618 130%)", cursor: drag.current ? "grabbing" : "grab" }}>
      <div ref={world} className="map-world" style={{ width: W, height: H }}>
        <img src="/map/leonida.jpg" width={W} height={H} alt="" draggable={false} className="block" />
        {coins.map((c, i) => {
          const p = plotFor(c, i);
          const main = !!c.official;
          return (
            <button key={c.mint} type="button" onClick={() => { onActive(c.mint); router.push(`/coin/${c.mint}`); }} onMouseEnter={() => onActive(c.mint)}
              className={`pin ${main ? "pin-main" : ""} ${active === c.mint ? "on" : ""}`}
              style={{ left: p.u * W, top: p.v * H, transform: "translate(-50%, calc(-100% - 18px)) scale(var(--inv))", transformOrigin: "50% calc(100% + 18px)" }}
              aria-label={`$${c.ticker} on the map`}>
              {active === c.mint && <span className="pin-pulse" />}
              <img src={c.still} alt="" />
              <span><b>${c.ticker}</b><i className={c.change24h >= 0 ? "text-up" : "text-down"}>{usd(c.mcapUsd)} · {pct(c.change24h)}</i></span>
            </button>
          );
        })}
        {PLOTS.filter((p) => !coins.some((c, i) => plotFor(c, i).id === p.id)).map((p) => (
          <a key={p.id} href="/launch" className="pin pin-lot" title={`${p.district}: open plot, launch a clip to claim it`}
            style={{ left: p.u * W, top: p.v * H, transform: "translate(-50%, -50%) scale(var(--inv))" }} aria-label={`Open plot in ${p.district}`} />
        ))}
      </div>
      <div className="map-vignette" />
      {children}
    </div>
  );
}
