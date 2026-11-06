"use client";
/**
 * Leonida as an architect's model: the fan map (Yanis V17, gtadb.org, CC BY 4.0) on a thick island slab displaced out of
 * the water by public/map/landmask.png, lit and shadowed like a tabletop diorama. Cliffs (steep normals) read as sand/rock.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MODES, type Mode } from "./Atmosphere";

export const LAND_Y = 0.14;          // top of the slab
const BASE_Y = -0.06;                // water-level vertices sit under the ocean

export function Island({ mode, planeW, planeH, onReady }: { mode: Mode; planeW: number; planeH: number; onReady: () => void }) {
  const small = typeof window !== "undefined" && window.innerWidth < 900;
  const [map, height, normal] = useLoader(THREE.TextureLoader, [small ? "/map/yanis-4k.jpg" : "/map/yanis-8k.jpg", "/map/landmask.png", "/map/landnormal.png"]);
  const gl = useThree((s) => s.gl);
  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = gl.capabilities.getMaxAnisotropy(); map.generateMipmaps = true; map.minFilter = THREE.LinearMipmapLinearFilter;
    for (const t of [height, normal]) { t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; }
  }, [map, height, normal, gl]);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const seg = small ? [360, 490] : [720, 980];
  useEffect(() => { onReady(); }, [onReady]);
  useFrame(() => {
    const m = mat.current; if (!m) return;
    m.color.lerp(new THREE.Color(MODES[mode].tint).multiplyScalar(mode === "day" ? 0.72 : 0.8), 0.05);
  });
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow castShadow renderOrder={0}>
      <planeGeometry args={[planeW, planeH, seg[0], seg[1]]} />
      <meshStandardMaterial ref={mat} map={map} displacementMap={height} displacementScale={LAND_Y - BASE_Y} displacementBias={BASE_Y}
        normalMap={normal} normalScale={new THREE.Vector2(0.9, 0.9)} alphaMap={height} alphaTest={0.25} roughness={0.95} metalness={0} envMapIntensity={0.12}
        onUpdate={(m) => {
          if (m.userData.cliff) return; m.userData.cliff = true;
          m.onBeforeCompile = (s) => {
            // Cliffs: where the slab height ramps down to the water, replace the stretched map pixels by sand → rock.
            s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D displacementMap;")
              .replace("#include <map_fragment>", `#include <map_fragment>
              float hh = texture2D(displacementMap, vMapUv).r;
              float cl = 1.0 - smoothstep(0.6, 0.97, hh);
              vec3 cliff = mix(vec3(0.95, 0.89, 0.74), vec3(0.55, 0.44, 0.32), smoothstep(0.15, 0.9, cl));
              diffuseColor.rgb = mix(diffuseColor.rgb, cliff, smoothstep(0.0, 0.35, cl));`);
          };
          m.needsUpdate = true;
        }} />
    </mesh>
  );
}
