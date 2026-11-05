"use client";
/**
 * 3D city: building footprints classified from the Yanis V17 raster (public/map/buildings.json, [cx, cy, w, d, rot, area] in
 * image u/v) extruded as one InstancedMesh, plus the 107 landmark towers triangulated by Robert Luxemburg (public domain,
 * github.com/rolux/gtamaplib-vc) at their real height. Heights are stylised ×HEIGHT_SCALE so the skyline reads from the air.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MODES, type Mode } from "./Atmosphere";
import { DISTRICTS } from "./districts";

type Fp = [number, number, number, number, number, number];
type Lm = { name: string; u: number; v: number; h: number; w: number; shape: string };
const METER = 16 / 14848;        // plane width 16 wu = 58 tiles × 256 game units
const HEIGHT_SCALE = 2.0;        // stylised: real metres × 2
const CORES = DISTRICTS.filter((d) => ["Vice City", "Vice Beach"].includes(d.name));

function windowsTexture() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 128; const g = c.getContext("2d")!;
  g.fillStyle = "#000"; g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 8) for (let x = 4; x < 64; x += 8) { if (Math.random() < 0.55) { g.fillStyle = Math.random() < 0.8 ? "#ffd27a" : "#9fe8ff"; g.fillRect(x, y, 4, 5); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function Buildings({ mode, planeW, planeH }: { mode: Mode; planeW: number; planeH: number }) {
  const [data, setData] = useState<{ fps: Fp[]; lms: Lm[] } | null>(null);
  useEffect(() => {
    Promise.all([fetch("/map/buildings.json").then((r) => r.json()), fetch("/map/landmarks.json").then((r) => r.json())])
      .then(([fps, lms]) => setData({ fps, lms })).catch(() => setData({ fps: [], lms: [] }));
  }, []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshLambertMaterial>(null);
  const emissive = useMemo(() => windowsTexture(), []);
  const geo = useMemo(() => { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return g; }, []);
  const count = (data?.fps.length ?? 0) + (data?.lms.length ?? 0);
  useEffect(() => {
    const m = mesh.current; if (!m || !data) return;
    const o = new THREE.Object3D(), col = new THREE.Color();
    const toX = (u: number) => (u - 0.5) * planeW, toZ = (v: number) => (v - 0.5) * planeH;
    const lmPts = data.lms.map((l) => [l.u, l.v, l.h] as const);
    let i = 0;
    for (const [cu, cv, w, d, rot, area] of data.fps) {
      // real height when a landmark sits on this footprint, else by size and distance to the downtown cores
      let h = 0;
      for (const [lu, lv, lh] of lmPts) if (Math.abs(lu - cu) < 0.004 && Math.abs(lv - cv) < 0.004) { h = Math.max(h, lh); }
      if (!h) {
        const core = Math.min(...CORES.map((c) => Math.hypot((c.u - cu) * 1.05, c.v - cv)));
        const urban = THREE.MathUtils.clamp(1 - core / 0.09, 0, 1);
        const hash = (Math.sin(cu * 9731 + cv * 5113) * 43758.5) % 1;
        h = 7 + Math.sqrt(area) * 1.2 + urban * (25 + Math.abs(hash) * 70);
      }
      o.position.set(toX(cu), 0, toZ(cv)); o.rotation.set(0, -rot, 0);
      o.scale.set(Math.max(w * planeW, 0.012), h * METER * HEIGHT_SCALE, Math.max(d * planeH, 0.012)); o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      const t = THREE.MathUtils.clamp(h / 120, 0, 1);
      col.setHSL(0.78 - t * 0.08, 0.12 + t * 0.25, 0.86 - t * 0.28); m.setColorAt(i, col); i++;
    }
    for (const l of data.lms) {
      const side = Math.max(l.w || 20, 18) * METER * 1.6;
      o.position.set(toX(l.u), 0, toZ(l.v)); o.rotation.set(0, 0, 0); o.scale.set(side, l.h * METER * HEIGHT_SCALE, side); o.updateMatrix();
      m.setMatrixAt(i, o.matrix); col.set("#ffffff"); m.setColorAt(i, col); i++;
    }
    m.count = i; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [data, planeW, planeH]);
  useFrame(() => {
    const mm = mat.current; if (!mm) return;
    const target = MODES[mode].neon;
    mm.emissiveIntensity += (target * 0.9 - mm.emissiveIntensity) * 0.05;
    mm.color.lerp(new THREE.Color(MODES[mode].tint), 0.05);
  });
  if (!data) return null;
  return (
    <instancedMesh ref={mesh} args={[geo, undefined, Math.max(count, 1)]} frustumCulled={false} renderOrder={2}>
      <meshLambertMaterial ref={mat} color="#ffffff" emissive="#ffffff" emissiveMap={emissive} emissiveIntensity={0} />
    </instancedMesh>
  );
}

/** Sun + ambient so the boxes read in 3D; follows the mode. */
export function CityLight({ mode }: { mode: Mode }) {
  const sun = useRef<THREE.DirectionalLight>(null), amb = useRef<THREE.AmbientLight>(null);
  useFrame(() => {
    const m = MODES[mode];
    if (sun.current) { sun.current.color.lerp(new THREE.Color(m.sun), 0.05); sun.current.intensity += ((mode === "night" ? 0.35 : mode === "dusk" ? 1.6 : 2.2) - sun.current.intensity) * 0.05; sun.current.position.lerp(new THREE.Vector3(6, m.sunY + 3, -8), 0.05); }
    if (amb.current) { amb.current.intensity += ((mode === "night" ? 0.9 : 1.4) - amb.current.intensity) * 0.05; amb.current.color.lerp(new THREE.Color(mode === "night" ? "#5a62c9" : "#ffffff"), 0.05); }
  });
  return <><ambientLight ref={amb} intensity={1.4} /><directionalLight ref={sun} position={[6, 8, -8]} intensity={1.8} /></>;
}
