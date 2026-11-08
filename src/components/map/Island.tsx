"use client";
/**
 * Leonida: the Yanis V17 community map (gtadb.org, CC BY 4.0) on a flat, unlit plane so it stays as crisp and bright as the
 * source. The 4K version paints first (preloaded by the layout), the 8K swaps in silently once decoded.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MODES, type Mode } from "./Atmosphere";

export const LAND_Y = 0;

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

export function Island({ mode, planeW, planeH, onReady }: { mode: Mode; planeW: number; planeH: number; onReady: () => void }) {
  const small = typeof window !== "undefined" && window.innerWidth < 900;
  const map4k = useLoader(THREE.TextureLoader, "/map/yanis-4k.jpg");
  const gl = useThree((s) => s.gl);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const mask = useMemo(() => edgeMask(), []);
  const prep = (t: THREE.Texture) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = gl.capabilities.getMaxAnisotropy(); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  useMemo(() => prep(map4k), [map4k]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => {
    if (small) return;
    let alive = true;
    new THREE.TextureLoader().load("/map/yanis-8k.jpg", (t) => { if (!alive || !mat.current) return; mat.current.map = prep(t); mat.current.needsUpdate = true; });
    return () => { alive = false; };
  }, [small]); // eslint-disable-line react-hooks/exhaustive-deps
  useFrame(() => { mat.current?.color.lerp(new THREE.Color(MODES[mode].tint), 0.05); });
  return (
    <mesh rotation-x={-Math.PI / 2} renderOrder={0}>
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial ref={mat} map={map4k} alphaMap={mask} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
