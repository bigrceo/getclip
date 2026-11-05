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

// ---- Yanis V16 GTA VI community map (gtadb.org, CC BY 4.0), island crop stitched from the z5 tiles: 6118×8192 ----
const IMG_W = 6118, IMG_H = 8192;
const PLANE_W = 16, PLANE_H = PLANE_W * IMG_H / IMG_W;
const OCEAN = "#2c68a6";
const toWorld = (u: number, v: number): [number, number, number] => [(u - 0.5) * PLANE_W, 0, (v - 0.5) * PLANE_H];
/** Feathered rectangle so the map's own water dissolves into the ocean shader. */
function edgeMask() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 512; const g = c.getContext("2d")!;
  g.fillStyle = "#000"; g.fillRect(0, 0, 512, 512);
  const f = 40;
  for (const [x0, y0, x1, y1, h] of [[0, 0, 512, f, true], [0, 512 - f, 512, 512, true], [0, 0, f, 512, false], [512 - f, 0, 512, 512, false]] as [number, number, number, number, boolean][]) {
    const gr = h ? g.createLinearGradient(0, y0, 0, y1) : g.createLinearGradient(x0, 0, x1, 0);
    const out = h ? y0 === 0 : x0 === 0;
    gr.addColorStop(0, out ? "#000" : "#fff"); gr.addColorStop(1, out ? "#fff" : "#000");
    g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  g.fillStyle = "#fff"; g.fillRect(f, f, 512 - 2 * f, 512 - 2 * f);
  return new THREE.CanvasTexture(c);
}

export type Plot = { id: string; district: string; u: number; v: number };
export const PLOTS: Plot[] = [
  { id: "hq", district: "Vice City", u: 0.64, v: 0.52 },
  { id: "vc-1", district: "Vice City", u: 0.67, v: 0.49 }, { id: "vc-2", district: "Vice City", u: 0.61, v: 0.55 }, { id: "vc-3", district: "Vice City", u: 0.66, v: 0.56 }, { id: "vc-4", district: "Vice City", u: 0.62, v: 0.48 },
  { id: "vb-1", district: "Vice Beach", u: 0.84, v: 0.45 }, { id: "vb-2", district: "Vice Beach", u: 0.86, v: 0.5 }, { id: "vb-3", district: "Vice Beach", u: 0.8, v: 0.41 },
  { id: "air", district: "Vice City Intl", u: 0.55, v: 0.59 },
  { id: "pg-1", district: "Port Gellhorn", u: 0.26, v: 0.53 }, { id: "pg-2", district: "Port Gellhorn", u: 0.29, v: 0.57 },
  { id: "am-1", district: "Ambrosia", u: 0.53, v: 0.35 }, { id: "am-2", district: "Ambrosia", u: 0.58, v: 0.38 },
  { id: "gr-1", district: "Grassrivers", u: 0.22, v: 0.3 }, { id: "gr-2", district: "Grassrivers", u: 0.27, v: 0.34 },
  { id: "mk-1", district: "Mount Kalaga", u: 0.47, v: 0.2 }, { id: "mk-2", district: "Mount Kalaga", u: 0.55, v: 0.16 }, { id: "mk-3", district: "Mount Kalaga", u: 0.4, v: 0.26 },
  { id: "ev-1", district: "Everglades", u: 0.44, v: 0.66 }, { id: "ev-2", district: "Everglades", u: 0.38, v: 0.6 }, { id: "ev-3", district: "Everglades", u: 0.5, v: 0.7 },
  { id: "so-1", district: "South Leonida", u: 0.6, v: 0.73 }, { id: "so-2", district: "South Leonida", u: 0.66, v: 0.66 },
  { id: "lk-1", district: "Leonard Keys", u: 0.52, v: 0.86 }, { id: "lk-2", district: "Leonard Keys", u: 0.58, v: 0.82 }, { id: "lk-3", district: "Leonard Keys", u: 0.26, v: 0.85 }, { id: "lk-4", district: "Leonard Keys", u: 0.4, v: 0.9 },
  { id: "ne-1", district: "Vice City", u: 0.72, v: 0.44 }, { id: "ne-2", district: "Vice Beach", u: 0.9, v: 0.56 },
];
const DISTRICT_COLOR: Record<string, string> = { "Vice City": "#ff5fa8", "Vice Beach": "#ffc38a", "Vice City Intl": "#ffffff", "Port Gellhorn": "#48d6ff", Ambrosia: "#ffe17a", Grassrivers: "#b6ff6a", "Mount Kalaga": "#d9b8ff", Everglades: "#7bff6a", "South Leonida": "#ffd1a1", "Leonard Keys": "#2affc6" };

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
  const m1 = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => { m1.current?.color.lerp(new THREE.Color(MODES[mode].tint), 0.05); });
  const small = typeof window !== "undefined" && window.innerWidth < 900;
  const map = useLoader(THREE.TextureLoader, small ? "/map/yanis-4k.jpg" : "/map/yanis-8k.jpg");
  const gl = useThree((s) => s.gl);
  const mask = useMemo(() => edgeMask(), []);
  useMemo(() => { map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = gl.capabilities.getMaxAnisotropy(); map.generateMipmaps = true; map.minFilter = THREE.LinearMipmapLinearFilter; }, [map, gl]);
  useEffect(() => { onReady(); }, [onReady]);
  return (
    <group>
      <Ocean mode={mode} half={[PLANE_W / 2, PLANE_H / 2]} />
      <mesh rotation-x={-Math.PI / 2}><planeGeometry args={[PLANE_W, PLANE_H]} /><meshBasicMaterial ref={m1} map={map} alphaMap={mask} transparent depthWrite={false} toneMapped={false} /></mesh>
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
  useEffect(() => { (window as unknown as { __scene?: THREE.Scene }).__scene = scene; }, [scene]);
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
    c.minDistance = 2.2; c.maxDistance = 26; c.minPolarAngle = 0.15; c.maxPolarAngle = 1.05; c.minAzimuthAngle = -0.6; c.maxAzimuthAngle = 0.6; c.zoomSpeed = 0.8;
    const [hx, , hz] = toWorld(0.64, 0.5);
    const off = new THREE.Vector3(hx + (window.innerWidth < 700 ? 0.8 : 1.2), 0, hz + 0.6);
    c.target.copy(off); camera.position.add(off);
    return c;
  }, [camera, dom]);
  const goal = useRef<THREE.Vector3 | null>(null);
  // Intro flyover: start high and far, ease into the default framing.
  const intro = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null);
  useEffect(() => {
    const to = camera.position.clone();
    const from = to.clone().add(new THREE.Vector3(-8, 22, 18));
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
    const dx = THREE.MathUtils.clamp(t.x, -PLANE_W / 2, PLANE_W / 2) - t.x, dz = THREE.MathUtils.clamp(t.z, -PLANE_H / 2, PLANE_H / 2) - t.z;
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
      <Canvas dpr={[1, 2]} camera={{ position: small ? [0, 15, 6] : [0, 12.5, 9], fov: 42, near: 0.1, far: 260 }} gl={{ antialias: true }} onPointerMissed={() => onActive(null)}>
        <fog attach="fog" args={[MODES.dusk.fog, 18, 60]} />
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
