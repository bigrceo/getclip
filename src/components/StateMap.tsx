"use client";
/**
 * Port of the stateofleonida.xyz map (React Three Fiber): the extended map on a tilted plane in a teal ocean,
 * the 4K core blended on top with its mask, one beacon (halo, pulsing ring, beam, sphere) per coin, HTML pins
 * projected from the scene that dodge the hero card and the rail, OrbitControls kept inside the island.
 */
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Coin } from "@/lib/types";
import { pct } from "@/lib/format";
import { CityNeon, Clouds, DistrictLabels, MODES, Ocean, Sky, Sun, type Mode } from "./map/Atmosphere";

// ---- geometry of the two map images (from the original site) ----
const PLANE_W = 16, PLANE_H = 36576 / 4096; // core plane: 16 wide, same aspect as the 4K image
const EXT = { w: 2528, h: 1696, coreX: 330, coreY: 336, coreW: 1868 };
const UNIT = PLANE_W / EXT.coreW, EXT_W = EXT.w * UNIT, EXT_H = EXT.h * UNIT, CORE_H_PX = EXT.coreW * 2286 / 4096;
const EXT_OFF: [number, number] = [(EXT.w / 2 - (EXT.coreX + EXT.coreW / 2)) * UNIT, (EXT.h / 2 - (EXT.coreY + CORE_H_PX / 2)) * UNIT];
const OCEAN = "#06617a";
const toWorld = (u: number, v: number): [number, number, number] => [(u - 0.5) * PLANE_W, 0, (v - 0.5) * PLANE_H];

export type Plot = { id: string; district: string; u: number; v: number };
export const PLOTS: Plot[] = [
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
const DISTRICT_COLOR: Record<string, string> = { "Vice City": "#ff5fa8", "Ocean Strip": "#ffc38a", "The Keys": "#2affc6", "The Swamp": "#7bff6a", "The Hills": "#ffe17a", Outskirts: "#ffffff", "The Port": "#48d6ff" };

/** Stable plot per coin: the official coin owns HQ, the rest hash their mint onto the other plots. */
export function plotFor(c: Coin, i: number): Plot {
  if (c.official) return PLOTS[0];
  let h = 0; for (const ch of c.mint) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const free = PLOTS.slice(1);
  return free[(h + i) % free.length];
}

type Entity = { coin: Coin; plot: Plot; main: boolean };
const beamHeight = (e: Entity) => e.main ? 1.7 : Math.min(2.2, 0.35 + Math.log10(Math.max(e.coin.mcapUsd, 5000) / 5000) * 0.55);
const beamColor = (e: Entity) => e.main ? "#ff5fa8" : e.coin.change24h >= 0 ? "#2affc6" : "#ff4d6d";

// ---- scene ----
function Ground({ onReady, mode }: { onReady: () => void; mode: Mode }) {
  const m1 = useRef<THREE.MeshBasicMaterial>(null), m2 = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => { const t = new THREE.Color(MODES[mode].tint); for (const r of [m1, m2]) r.current?.color.lerp(t, 0.05); });
  const small = typeof window !== "undefined" && window.innerWidth < 900;
  const [core, mask, ext] = useLoader(THREE.TextureLoader, [small ? "/map/leonida-2k.jpg" : "/map/leonida.jpg", "/map/leonida-core-mask.png", "/map/leonida-ext.jpg"]);
  const gl = useThree((s) => s.gl);
  useMemo(() => { for (const t of [core, ext]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = gl.capabilities.getMaxAnisotropy(); } }, [core, ext, gl]);
  useEffect(() => { onReady(); }, [onReady]);
  return (
    <group>
      <Ocean mode={mode} />
      <mesh rotation-x={-Math.PI / 2} position={[EXT_OFF[0], -0.015, EXT_OFF[1]]}><planeGeometry args={[EXT_W, EXT_H]} /><meshBasicMaterial ref={m1} map={ext} toneMapped={false} /></mesh>
      <mesh rotation-x={-Math.PI / 2}><planeGeometry args={[PLANE_W, PLANE_H]} /><meshBasicMaterial ref={m2} map={core} alphaMap={mask} transparent depthWrite={false} toneMapped={false} /></mesh>
    </group>
  );
}

function Beacon({ e, active, onHover, onSelect }: { e: Entity; active: boolean; onHover: (m: string | null) => void; onSelect: () => void }) {
  const beam = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [x, , z] = toWorld(e.plot.u, e.plot.v);
  const h = beamHeight(e), col = beamColor(e), dist = DISTRICT_COLOR[e.plot.district] ?? "#fff";
  const speed = 1 + Math.min(1, (e.coin.volumeSol ?? 0) / Math.max(e.coin.mcapUsd, 1) / 0.02);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring.current) { const s = 1 + ((t * 0.6 * speed + (x + z)) % 1) * 1.6; ring.current.scale.set(s, s, s); (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - (s - 1) / 1.6); }
    if (beam.current) (beam.current.material as THREE.MeshBasicMaterial).opacity = (active ? 0.9 : 0.55) + Math.sin(t * 3 + x) * 0.08;
  });
  const r = e.main ? 0.07 : 0.035;
  const ev = {
    onPointerOver: (ev: { stopPropagation: () => void }) => { ev.stopPropagation(); onHover(e.coin.mint); document.body.style.cursor = "pointer"; },
    onPointerOut: () => { onHover(null); document.body.style.cursor = ""; },
    onClick: (ev: { stopPropagation: () => void }) => { ev.stopPropagation(); onSelect(); },
  };
  return (
    <group position={[x, 0, z]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.01}><circleGeometry args={[e.main ? 0.32 : 0.2, 40]} /><meshBasicMaterial color={dist} transparent opacity={active ? 0.55 : 0.32} depthWrite={false} /></mesh>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.015}><ringGeometry args={[e.main ? 0.3 : 0.18, e.main ? 0.34 : 0.21, 48]} /><meshBasicMaterial color={col} transparent depthWrite={false} /></mesh>
      <mesh ref={beam} position-y={h / 2} {...ev}><cylinderGeometry args={[r * 0.6, r, h, 20, 1, true]} /><meshBasicMaterial color={col} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
      <mesh position-y={h} {...ev}><sphereGeometry args={[r * 1.5, 20, 20]} /><meshBasicMaterial color={col} toneMapped={false} /></mesh>
    </group>
  );
}

/** Open plot: a small gold dot on the ground, click → launch. */
function Lot({ p, onSelect, onHover }: { p: Plot; onSelect: () => void; onHover: (x: number | null, y?: number) => void }) {
  const [x, , z] = toWorld(p.u, p.v);
  return (
    <group position={[x, 0, z]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.012} onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; const r = (e.nativeEvent.target as HTMLElement).getBoundingClientRect(); onHover(e.nativeEvent.clientX - r.left, e.nativeEvent.clientY - r.top); }}
        onPointerMove={(e) => { const r = (e.nativeEvent.target as HTMLElement).getBoundingClientRect(); onHover(e.nativeEvent.clientX - r.left, e.nativeEvent.clientY - r.top); }}
        onPointerOut={() => { document.body.style.cursor = ""; onHover(null); }}>
        <circleGeometry args={[0.11, 32]} /><meshBasicMaterial color="#ffe17a" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.011}><ringGeometry args={[0.16, 0.19, 40]} /><meshBasicMaterial color="#ffe17a" transparent opacity={0.35} depthWrite={false} /></mesh>
    </group>
  );
}

type Api = { zoom: (k: number) => void };
function FogCtl({ mode }: { mode: Mode }) {
  const scene = useThree((s) => s.scene);
  useFrame(() => { const f = scene.fog as THREE.Fog | null; if (f) f.color.lerp(new THREE.Color(MODES[mode].fog), 0.05); });
  return null;
}
function Controls({ entities, selected, api }: { entities: Entity[]; selected: string | null; api: React.MutableRefObject<Api | null> }) {
  const camera = useThree((s) => s.camera);
  const dom = useThree((s) => s.gl.domElement);
  const controls = useMemo(() => {
    const c = new OrbitControls(camera, dom);
    c.enableDamping = true; c.dampingFactor = 0.08; c.screenSpacePanning = false;
    c.enableZoom = false; // the wheel scrolls the page; zoom = ctrl/cmd + wheel, pinch, or the buttons
    c.minDistance = 3; c.maxDistance = 13; c.minPolarAngle = 0.15; c.maxPolarAngle = 1.05; c.minAzimuthAngle = -0.6; c.maxAzimuthAngle = 0.6; c.zoomSpeed = 0.8;
    const off = new THREE.Vector3(window.innerWidth < 700 ? 1.4 : 0.6, 0, 0.2);
    c.target.copy(off); camera.position.add(off);
    return c;
  }, [camera, dom]);
  const goal = useRef<THREE.Vector3 | null>(null);
  // Intro flyover: start high and far, ease into the default framing.
  const intro = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null);
  useEffect(() => {
    const to = camera.position.clone();
    const from = to.clone().add(new THREE.Vector3(-6, 16, 14));
    camera.position.copy(from); intro.current = { from, to, t: 0 }; controls.enabled = false;
  }, [camera, controls]);
  useEffect(() => () => controls.dispose(), [controls]);
  useEffect(() => {
    const zoom = (k: number) => {
      const dir = camera.position.clone().sub(controls.target);
      const d = THREE.MathUtils.clamp(dir.length() * k, controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).add(dir.setLength(d));
    };
    api.current = { zoom };
    const onWheel = (e: WheelEvent) => {
      // Wheel up zooms in. Wheel down zooms out until the camera is fully out, then the page scrolls.
      const dist = camera.position.distanceTo(controls.target);
      if (e.deltaY < 0) {
        if (window.scrollY > 4) return; // coming back up the page: keep scrolling
        e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0045));
      } else if (dist < controls.maxDistance - 0.01) {
        e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0045));
      }
    };
    dom.addEventListener("wheel", onWheel, { passive: false });
    return () => { dom.removeEventListener("wheel", onWheel); api.current = null; };
  }, [camera, controls, dom, api]);
  useEffect(() => {
    const e = entities.find((e) => e.coin.mint === selected); if (!e) return;
    const [x, , z] = toWorld(e.plot.u, e.plot.v); goal.current = new THREE.Vector3(x, 0, z);
  }, [selected, entities]);
  useFrame((_, dt) => {
    if (intro.current) {
      const i = intro.current; i.t = Math.min(1, i.t + dt / 2.6);
      const e = 1 - Math.pow(1 - i.t, 3);
      camera.position.lerpVectors(i.from, i.to, e);
      if (i.t >= 1) { intro.current = null; controls.enabled = true; }
      camera.lookAt(controls.target); return;
    }
    if (goal.current) {
      const d = goal.current.clone().sub(controls.target).multiplyScalar(0.08);
      controls.target.add(d); camera.position.add(d);
      if (d.lengthSq() < 1e-6) goal.current = null;
    }
    const t = controls.target;
    const dx = THREE.MathUtils.clamp(t.x, -8, 8) - t.x, dz = THREE.MathUtils.clamp(t.z, -PLANE_H / 2, PLANE_H / 2) - t.z;
    if (dx || dz) { t.x += dx; t.z += dz; camera.position.x += dx; camera.position.z += dz; }
    controls.update();
  });
  return null;
}

// ---- HTML pins projected from the scene, dodging [data-pin-obstacle] boxes ----
type Slot = { el: HTMLButtonElement | null; line: SVGLineElement | null; fullW: number; fullH: number; measuredAt: number };
type Rect = { x: number; y: number; w: number; h: number };
const GAP = 6, MINI = 34;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w + GAP && a.x + a.w + GAP > b.x && a.y < b.y + b.h + GAP && a.y + a.h + GAP > b.y;
const priority = (e: Entity, hot: boolean) => (hot ? 1e15 : 0) + (e.main ? 1e13 : 0) + e.coin.mcapUsd;

function PinLayout({ entities, slots, hovered, selected }: { entities: Entity[]; slots: Map<string, Slot>; hovered: string | null; selected: string | null }) {
  const camera = useThree((s) => s.camera), size = useThree((s) => s.size), dom = useThree((s) => s.gl.domElement);
  const v = useMemo(() => new THREE.Vector3(), []);
  const obstacles = useRef<{ at: number; rects: Rect[] }>({ at: -1, rects: [] });
  const frame = useRef(0);
  useFrame(() => {
    frame.current++;
    const base = dom.getBoundingClientRect();
    if (frame.current - obstacles.current.at > 15) obstacles.current = { at: frame.current, rects: [...document.querySelectorAll("[data-pin-obstacle]")].map((el) => { const r = el.getBoundingClientRect(); return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }; }) };
    const taken = [...obstacles.current.rects];
    const order = [...entities].sort((a, b) => priority(b, b.coin.mint === hovered || b.coin.mint === selected) - priority(a, a.coin.mint === hovered || a.coin.mint === selected));
    for (const e of order) {
      const s = slots.get(e.coin.mint); if (!s?.el) continue;
      const [x, , z] = toWorld(e.plot.u, e.plot.v);
      v.set(x, beamHeight(e), z).project(camera);
      const sx = (v.x + 1) / 2 * size.width, sy = (1 - v.y) / 2 * size.height;
      const onScreen = v.z < 1 && sx > -40 && sx < size.width + 40 && sy > -40 && sy < size.height + 40;
      if (s.measuredAt < 0 || frame.current - s.measuredAt > 120) {
        if (s.el.dataset.mode === "full") { s.fullW = s.el.offsetWidth; s.fullH = s.el.offsetHeight; s.measuredAt = frame.current; }
        else if (s.measuredAt < 0) { s.fullW = 120; s.fullH = 40; }
      }
      let mode = "hidden"; let box: Rect | null = null;
      if (onScreen) {
        const w = s.fullW, h = s.fullH;
        const full: [number, number][] = [[-w / 2, -10 - h], [-w / 2, -10 - h * 2 - 8], [16, -h / 2], [-w - 16, -h / 2], [-w / 2, 14], [16, -h - 20], [-w - 16, -h - 20]];
        const mini: [number, number][] = [[-17, -44], [10, -17], [-44, -17]];
        const fits = (r: Rect) => r.x >= 4 && r.y >= 60 && r.x + r.w <= size.width - 4 && r.y + r.h <= size.height - 4;
        const place = (cands: [number, number][], w: number, h: number) => { for (const [dx, dy] of cands) { const r = { x: sx + dx, y: sy + dy, w, h }; if (fits(r) && !taken.some((t) => overlaps(r, t))) return r; } return null; };
        box = place(full, w, h); if (box) mode = "full"; else { box = place(mini, MINI, MINI); if (box) mode = "mini"; }
      }
      if (box) taken.push(box);
      if (s.el.dataset.mode !== mode) s.el.dataset.mode = mode;
      if (box) s.el.style.transform = `translate3d(${box.x.toFixed(1)}px, ${box.y.toFixed(1)}px, 0)`;
      if (s.line) {
        const ex = box ? box.x + box.w / 2 : sx;
        const ey = box ? (box.y + box.h < sy ? box.y + box.h : box.y > sy ? box.y : box.y + box.h / 2) : sy;
        const show = box && Math.hypot(ex - sx, ey - sy) > 18;
        s.line.style.opacity = show ? "0.85" : "0";
        s.line.setAttribute("x1", sx.toFixed(1)); s.line.setAttribute("y1", sy.toFixed(1)); s.line.setAttribute("x2", ex.toFixed(1)); s.line.setAttribute("y2", ey.toFixed(1));
      }
    }
  });
  return null;
}

function Pins({ entities, slots, hovered, selected, onHover, onSelect }: { entities: Entity[]; slots: Map<string, Slot>; hovered: string | null; selected: string | null; onHover: (m: string | null) => void; onSelect: (m: string) => void }) {
  const slot = (m: string) => { let s = slots.get(m); if (!s) { s = { el: null, line: null, fullW: 120, fullH: 40, measuredAt: -1 }; slots.set(m, s); } return s; };
  return (
    <div className="pins" aria-label="Map labels">
      <svg className="pin-lines" aria-hidden="true">{entities.map((e) => <line key={e.coin.mint} ref={(el) => { slot(e.coin.mint).line = el; }} />)}</svg>
      {entities.map((e) => {
        const hot = hovered === e.coin.mint || selected === e.coin.mint;
        return (
          <button key={e.coin.mint} type="button" data-mode="hidden" ref={(el) => { slot(e.coin.mint).el = el; }}
            className={`pin ${e.main ? "pin-main" : ""} ${hot ? "is-active" : ""}`} onClick={() => onSelect(e.coin.mint)}
            onMouseEnter={() => onHover(e.coin.mint)} onMouseLeave={() => onHover(null)} title={`$${e.coin.ticker}`}>
            <img src={e.coin.still} alt="" loading="lazy" />
            <span className="pin-text"><b>${e.coin.ticker}</b><i className={e.coin.change24h >= 0 ? "text-up" : "text-down"}>{pct(e.coin.change24h)}</i></span>
          </button>
        );
      })}
    </div>
  );
}

export function StateMap({ coins, active, onActive, children }: { coins: Coin[]; active: string | null; onActive: (m: string | null) => void; children?: React.ReactNode }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const slots = useMemo(() => new Map<string, Slot>(), []);
  const entities = useMemo<Entity[]>(() => coins.map((c, i) => ({ coin: c, plot: plotFor(c, i), main: !!c.official })), [coins]);
  const takenPlots = useMemo(() => new Set(entities.map((e) => e.plot.id)), [entities]);
  const small = typeof window !== "undefined" && window.innerWidth < 700;
  const api = useRef<Api | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("dusk");
  const [lotTip, setLotTip] = useState<{ plot: Plot; x: number; y: number } | null>(null);
  const onReady = useMemo(() => () => setReady(true), []);
  const select = (m: string) => onActive(m);
  return (
    <div className="map-canvas absolute inset-0">
      <Canvas dpr={[1, 2]} camera={{ position: small ? [0, 12, 4.8] : [0, 10.5, 7.6], fov: 42, near: 0.1, far: 200 }} gl={{ antialias: true }} onPointerMissed={() => onActive(null)}>
        <fog attach="fog" args={[MODES.dusk.fog, 14, 30]} />
        <FogCtl mode={mode} />
        <Sky mode={mode} />
        <Sun mode={mode} />
        <Suspense fallback={null}><Ground onReady={onReady} mode={mode} /></Suspense>
        {ready && <><Clouds mode={mode} /><DistrictLabels toWorld={toWorld} /><CityNeon mode={mode} toWorld={toWorld} /></>}
        {ready && entities.map((e) => <Beacon key={e.coin.mint} e={e} active={active === e.coin.mint || hovered === e.coin.mint} onHover={setHovered} onSelect={() => select(e.coin.mint)} />)}
        {ready && PLOTS.filter((p) => !takenPlots.has(p.id)).map((p) => <Lot key={p.id} p={p} onSelect={() => router.push("/launch")} onHover={(x, y) => setLotTip(x == null ? null : { plot: p, x, y: y! })} />)}
        <Controls entities={entities} selected={active} api={api} />
        <PinLayout entities={entities} slots={slots} hovered={hovered} selected={active} />
      </Canvas>
      <Pins entities={entities} slots={slots} hovered={hovered} selected={active} onHover={setHovered} onSelect={select} />
      <div className="map-vignette" aria-hidden="true" />
      <div aria-hidden={ready} className={`pointer-events-none absolute inset-0 z-10 grid place-items-center transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`} style={{ background: "radial-gradient(circle, #23104a, #0a0618)" }}>
        <div className="text-center"><img src="/brand/pfp-512.png" alt="" width={96} height={96} className="mx-auto mb-4 rounded-[20px]" style={{ filter: "drop-shadow(0 0 24px rgba(255,61,139,.6))" }} /><p className="script">Flying into</p><p className="sec-title sunset-text">Leonida</p><p className="mt-3 text-[12px] font-semibold uppercase tracking-[.1em] text-haze">getclip.fun</p></div>
      </div>
      {lotTip && <div className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-[10px] bg-[#ffe17a] px-2.5 py-1.5 text-center text-[12px] font-bold text-[#1a0b26] shadow-lg" style={{ left: lotTip.x, top: lotTip.y }}>Open plot · {lotTip.plot.district}<br /><span className="font-semibold opacity-80">Launch a clip to claim it</span></div>}
      <div className="absolute bottom-[18px] left-6 z-20 flex rounded-full border border-line bg-black/40 p-[3px] max-md:bottom-3 max-md:left-3">
        {(Object.keys(MODES) as Mode[]).map((k) => <button key={k} type="button" onClick={() => setMode(k)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors ${mode === k ? "text-[#1a0b26]" : "text-ink/75 hover:text-ink"}`} style={mode === k ? { background: "var(--sunset)" } : undefined}>{MODES[k].label}</button>)}
      </div>
      <div className="absolute bottom-[18px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 max-md:bottom-3">
        <button type="button" onClick={() => api.current?.zoom(1.35)} className="grid size-9 place-items-center rounded-full border border-line bg-night/70 text-lg font-bold text-ink hover:bg-night/90" aria-label="Zoom out">−</button>
        <span className="whitespace-nowrap rounded-full border border-line bg-night/70 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[.06em] text-haze max-md:hidden">Drag to pan · scroll to zoom · click a beacon</span>
        <button type="button" onClick={() => api.current?.zoom(0.74)} className="grid size-9 place-items-center rounded-full border border-line bg-night/70 text-lg font-bold text-ink hover:bg-night/90" aria-label="Zoom in">+</button>
      </div>
      {children}
    </div>
  );
}
