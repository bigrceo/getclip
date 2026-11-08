"use client";
/**
 * Meet the Locals, in 3D: fan-made GTA VI character models (glTF, CC BY, see LOCALS[].credit) spinning in their own
 * card. Each model only loads when its card scrolls into view; a card whose file is missing shows a silhouette.
 */
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Local = { id: string; name: string; ticker: string; role: string; bio: string; file: string; credit: string; creditUrl: string; height?: number };
export const LOCALS: Local[] = [
  { id: "lucia", name: "Lucia", ticker: "LUCIA", role: "Out on parole", bio: "Did her time, kept her fists taped. Fresh out and done waiting for anyone to hand her a way up.", file: "/models/lucia.glb", credit: "BakhtiarSource", creditUrl: "https://sketchfab.com/3d-models/lucia-caminos-gta-vi-17902730e81b48f4a70cbc53e5387526" },
  { id: "jason", name: "Jason", ticker: "JASON", role: "Keys runner", bio: "Ex-army, now moving boats through the Keys for people who pay cash. Wants out of the small jobs.", file: "/models/jason.glb", credit: "BakhtiarSource", creditUrl: "https://sketchfab.com/3d-models/jason-duval-gta-vi-e6eefc3185fb4bcda7cdf9753924e162" },
];

function setupLoader(l: GLTFLoader) {
  const draco = new DRACOLoader(); draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  l.setDRACOLoader(draco); l.setMeshoptDecoder(MeshoptDecoder);
}

function Model({ url, height = 1.8 }: { url: string; height?: number }) {
  const gltf = useLoader(GLTFLoader, url, setupLoader);
  const g = useRef<THREE.Group>(null);
  const [fit, setFit] = useState<{ s: number; y: number } | null>(null);
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene); const size = new THREE.Vector3(); box.getSize(size); const c = new THREE.Vector3(); box.getCenter(c);
    const s = height / Math.max(size.y, 1e-3);
    gltf.scene.position.set(-c.x, -box.min.y, -c.z);
    gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    setFit({ s, y: 0 });
  }, [gltf, height]);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.45; });
  if (!fit) return null;
  return <group ref={g} scale={fit.s} position-y={-height / 2}><primitive object={gltf.scene} /></group>;
}

function Env() {
  useFrame(({ gl, scene }) => { if (!scene.environment) { const p = new THREE.PMREMGenerator(gl); scene.environment = p.fromScene(new RoomEnvironment(), 0.04).texture; p.dispose(); } });
  return null;
}

function Viewer({ local, active }: { local: Local; active: boolean }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.25, 3.4], fov: 32 }} frameloop={active ? "always" : "never"} gl={{ antialias: true, alpha: true }} shadows style={{ background: "transparent" }}>
      <Env />
      <ambientLight intensity={0.5} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 2, -2]} intensity={0.8} color="#ff5fa8" />
      <Suspense fallback={null}><Model url={local.file} height={local.height} /></Suspense>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.9} receiveShadow><circleGeometry args={[1.1, 48]} /><shadowMaterial transparent opacity={0.35} /></mesh>
    </Canvas>
  );
}

function Card({ local }: { local: Local }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  useEffect(() => { fetch(local.file, { method: "HEAD" }).then((r) => setExists(r.ok)).catch(() => setExists(false)); }, [local.file]);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="glass overflow-hidden">
      <div className="relative aspect-[4/5]" style={{ background: "radial-gradient(80% 60% at 50% 70%, rgba(255,61,139,.28), transparent 70%), linear-gradient(#2a0f4e, #0d0720)" }}>
        {exists && visible ? <Viewer local={local} active={visible} /> : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="h-[62%] w-[34%] rounded-t-full bg-black/45" style={{ clipPath: "polygon(30% 0, 70% 0, 72% 18%, 95% 28%, 100% 100%, 0 100%, 5% 28%, 28% 18%)" }} />
            {exists === false && <span className="absolute bottom-3 text-[11px] font-semibold uppercase tracking-[.1em] text-haze">3D model coming</span>}
          </div>
        )}
      </div>
      <div className="p-[18px]">
        <p className="label text-sun">${local.ticker} · {local.role}</p>
        <h3 className="sec-title mt-1 !text-[42px]">{local.name}</h3>
        <p className="mt-2 leading-[1.55] text-haze">{local.bio}</p>
        <p className="mt-3 text-[11px] text-haze/70">3D model: <a href={local.creditUrl} target="_blank" rel="noopener noreferrer" className="underline">{local.credit}</a> (CC BY 4.0)</p>
      </div>
    </div>
  );
}

export function Locals3D() {
  return (
    <div className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-3">
      {LOCALS.map((l) => <Card key={l.id} local={l} />)}
    </div>
  );
}
