"use client";
/**
 * Opening, Rockstar-style: a pinned full-screen scene with Lucia and Jason (our glTF portraits) on the palm sunset.
 * Scrolling dollies the camera into their faces; at the end of the zoom the scene fades and the site (the map hero)
 * takes over. Progress is read from the section's own position, so it works at any page offset.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PalmBackdrop } from "./PalmBackdrop";
import { BRAND } from "@/lib/brand";

function setupLoader(l: GLTFLoader) {
  const draco = new DRACOLoader(); draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  l.setDRACOLoader(draco); l.setMeshoptDecoder(MeshoptDecoder);
}

function Head({ url, height, x, y = 0, z, yaw, dim = 1 }: { url: string; height: number; x: number; y?: number; z: number; yaw: number; dim?: number }) {
  const gltf = useLoader(GLTFLoader, url, setupLoader);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf]);
  const g = useRef<THREE.Group>(null);
  const [s, setS] = useState(1);
  useEffect(() => {
    scene.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(scene); const size = new THREE.Vector3(); box.getSize(size); const c = new THREE.Vector3(); box.getCenter(c);
    scene.position.set(-c.x, -box.min.y, -c.z);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh; if (!mesh.isMesh) return; mesh.castShadow = true;
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const std = m as THREE.MeshStandardMaterial;
        if (std.isMeshStandardMaterial) { std.metalness = Math.min(std.metalness, 0.05); std.roughness = Math.max(std.roughness, 0.72); std.envMapIntensity = 0.35 * dim; std.color.setScalar(dim); std.needsUpdate = true; }
      }
    });
    setS(height / Math.max(size.y, 1e-3));
  }, [scene, height, dim]);
  useFrame(({ clock }) => { if (g.current) g.current.rotation.y = yaw + Math.sin(clock.elapsedTime * 0.5 + x) * 0.06; });
  return <group ref={g} position={[x, -height / 2 + y, z]} scale={s}><primitive object={scene} /></group>;
}

function Rig({ progress }: { progress: React.MutableRefObject<number> }) {
  const { camera, scene, gl } = useThree();
  useEffect(() => { const p = new THREE.PMREMGenerator(gl); scene.environment = p.fromScene(new RoomEnvironment(), 0.04).texture; p.dispose(); }, [scene, gl]);
  useFrame(() => {
    const q = progress.current, e = q * q * (3 - 2 * q);
    camera.position.set(THREE.MathUtils.lerp(0, -0.12, e), THREE.MathUtils.lerp(0.1, 0.16, e), THREE.MathUtils.lerp(4.4, 1.75, e));
    camera.lookAt(THREE.MathUtils.lerp(0, -0.1, e), THREE.MathUtils.lerp(0.0, 0.12, e), 0);
  });
  return null;
}

export function IntroScene() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [live, setLive] = useState(true);
  useEffect(() => {
    const sec = section.current, st = stage.current; if (!sec || !st) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const r = sec.getBoundingClientRect(); const span = Math.max(1, r.height - st.offsetHeight);
      const q = Math.min(1, Math.max(0, -r.top / span));
      progress.current = q;
      st.style.setProperty("--q", q.toFixed(4));
      setLive(q < 0.999);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply(); window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <section ref={section} className="relative h-[220svh]" aria-label="Intro">
      <div ref={stage} className="intro3d sticky top-0 h-[100svh] overflow-hidden">
        <PalmBackdrop />
        <div className="absolute inset-0">
          <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.15, 4.4], fov: 30 }} frameloop={live ? "always" : "never"} gl={{ antialias: true, alpha: true }} shadows style={{ background: "transparent" }}>
            <Rig progress={progress} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[2.5, 4, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-3, 2, -2]} intensity={0.8} color="#ff5fa8" />
            <Suspense fallback={null}>
              <Head url="/models/lucia2.glb" height={0.66} x={-0.42} y={-0.16} z={0.1} yaw={0.35} dim={0.82} />
              <Head url="/models/jason-bust.glb" height={1.0} x={0.38} y={-0.12} z={-0.15} yaw={-0.3} />
            </Suspense>
          </Canvas>
        </div>
        <div className="intro-fade pointer-events-none absolute inset-x-0 bottom-0 h-[38%]" style={{ background: "linear-gradient(to bottom, transparent, rgba(13,7,32,.9) 70%, #0d0720)" }} />
        <div className="intro-title pointer-events-none absolute inset-x-0 bottom-[9%] z-10 text-center">
          <p className="script">Welcome to</p>
          <p className="sec-title sunset-text">{BRAND.state}</p>
          <p className="mt-2 text-[14px] font-semibold uppercase tracking-[.14em] text-ink/85">{BRAND.tagline}</p>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[.2em] text-haze">Scroll</p>
        </div>
        <div className="intro-veil pointer-events-none absolute inset-0 bg-[#0d0720]" />
      </div>
    </section>
  );
}
