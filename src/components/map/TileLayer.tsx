"use client";
/**
 * Native-resolution detail: the island's 256 px z5 tiles (public/map/tiles/{row}_{col}.jpg) are streamed in around the
 * camera target when the camera gets close, drawn just above the 8K base map with the same tint, and faded in.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MODES, type Mode } from "./Atmosphere";

const COLS = 58, ROWS = 79;
const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();
const order: string[] = [];
const MAX_CACHE = 700;

function getTexture(key: string, gl: THREE.WebGLRenderer, onLoad: () => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const t = loader.load(`/map/tiles/${key}.jpg`, () => onLoad());
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = gl.capabilities.getMaxAnisotropy(); t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
  cache.set(key, t); order.push(key);
  if (order.length > MAX_CACHE) { const old = order.shift()!; cache.get(old)?.dispose(); cache.delete(old); }
  return t;
}

function Tile({ k, i, j, tw, th, w, h, mode, gl }: { k: string; i: number; j: number; tw: number; th: number; w: number; h: number; mode: Mode; gl: THREE.WebGLRenderer }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const [loaded, setLoaded] = useState(cache.has(k) && !!cache.get(k)!.image);
  const tex = useMemo(() => getTexture(k, gl, () => setLoaded(true)), [k, gl]);
  useFrame((_, dt) => {
    const m = mat.current; if (!m) return;
    m.color.lerp(new THREE.Color(MODES[mode].tint), 0.05);
    const target = loaded ? 1 : 0; m.opacity += (target - m.opacity) * Math.min(1, dt * 6);
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position={[-w / 2 + (i + 0.5) * tw, 0.003, -h / 2 + (j + 0.5) * th]} renderOrder={1}>
      <planeGeometry args={[tw, th]} />
      <meshBasicMaterial ref={mat} map={tex} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

export function TileLayer({ mode, planeW, planeH, target, api }: { mode: Mode; planeW: number; planeH: number; target: THREE.Vector3; api: React.MutableRefObject<{ target: THREE.Vector3 } | null> }) {
  const camera = useThree((s) => s.camera), gl = useThree((s) => s.gl);
  const [keys, setKeys] = useState<{ k: string; i: number; j: number }[]>([]);
  const last = useRef({ at: 0, sig: "" });
  const tw = planeW / COLS, th = planeH / ROWS;
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current.at < 0.25) return;
    last.current.at = clock.elapsedTime;
    if (api.current) target.copy(api.current.target);
    const dist = camera.position.distanceTo(target);
    const r = dist < 3.2 ? 7 : dist < 5 ? 6 : dist < 7.5 ? 4 : 0;
    const ci = Math.floor((target.x + planeW / 2) / tw), cj = Math.floor((target.z + planeH / 2) / th);
    const sig = r ? `${r}:${ci}:${cj}` : "";
    if (sig === last.current.sig) return;
    last.current.sig = sig;
    if (!r) { setKeys([]); return; }
    const next: { k: string; i: number; j: number; d: number }[] = [];
    for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r - 2; i <= ci + r + 2; i++) {
      if (i < 0 || j < 0 || i >= COLS || j >= ROWS) continue;
      next.push({ k: `${j}_${i}`, i, j, d: (i - ci) ** 2 + (j - cj) ** 2 });
    }
    next.sort((a, b) => a.d - b.d);
    setKeys(next.slice(0, 200));
  });
  useEffect(() => () => { /* textures stay in the LRU cache for the session */ }, []);
  return <group>{keys.map((t) => <Tile key={t.k} k={t.k} i={t.i} j={t.j} tw={tw} th={th} w={planeW} h={planeH} mode={mode} gl={gl} />)}</group>;
}
