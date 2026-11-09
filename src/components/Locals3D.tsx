"use client";
/**
 * Meet the Locals, in 3D: fan-made GTA VI character models (glTF, CC BY, see LOCALS[].credit) spinning in their own
 * card. Each model only loads when its card scrolls into view; a card whose file is missing shows a silhouette.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PalmBackdrop } from "./PalmBackdrop";

export type Local = { id: string; name: string; ticker: string; role: string; bio: string; file: string; credit: string; creditUrl: string; height?: number; view?: "full" | "bust"; fade?: boolean; cam?: number; lift?: number; dim?: number };
export const LOCALS: Local[] = [
  { id: "lucia", name: "Lucia", ticker: "LUCIA", role: "Out on parole", bio: "Did her time, kept her fists taped. Fresh out and done waiting for anyone to hand her a way up.", file: "/models/lucia2.glb", credit: "pariuudit", creditUrl: "https://sketchfab.com/3d-models/lucia-8973f1637b0c44848279895e91a96ea3", view: "full", height: 0.62, fade: true, cam: 1.75, lift: 0.0, dim: 0.82 },
  { id: "jason", name: "Jason", ticker: "JASON", role: "Keys runner", bio: "Ex-army, now moving boats through the Keys for people who pay cash. Wants out of the small jobs.", file: "/models/jason-bust.glb", credit: "Sketchfab community", creditUrl: "https://sketchfab.com/search?q=jason+duval+gta+vi&type=models", view: "bust", height: 1.0, fade: true, cam: 1.75 },
];




function setupLoader(l: GLTFLoader) {
  const draco = new DRACOLoader(); draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  l.setDRACOLoader(draco); l.setMeshoptDecoder(MeshoptDecoder);
}

function Model({ url, height = 1.8, view = "full", lift = 0, dim = 1 }: { url: string; height?: number; view?: "full" | "bust"; lift?: number; dim?: number }) {
  const gltf = useLoader(GLTFLoader, url, setupLoader);
  // useLoader caches by URL: two cards showing the same file each need their own copy of the scene graph
  const scene = useMemo(() => gltf.scene.clone(true), [gltf]);
  const g = useRef<THREE.Group>(null);
  const [fit, setFit] = useState<{ s: number; y: number } | null>(null);
  useEffect(() => {
    scene.position.set(0, 0, 0);
    const box = new THREE.Box3().setFromObject(scene); const size = new THREE.Vector3(); box.getSize(size); const c = new THREE.Vector3(); box.getCenter(c);
    const s = height / Math.max(size.y, 1e-3);
    scene.position.set(-c.x, -box.min.y, -c.z);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh; if (!mesh.isMesh) return;
      mesh.castShadow = true; mesh.receiveShadow = true;
      // Skin and hair must not read as metal: converted models often ship metallic 1 / roughness 0 → white hot spots.
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        const std = m as THREE.MeshStandardMaterial;
        if (std.isMeshStandardMaterial) { std.metalness = Math.min(std.metalness, 0.05); std.roughness = Math.max(std.roughness, 0.72); std.envMapIntensity = 0.35 * dim; std.color.setScalar(dim); std.needsUpdate = true; }
      }
    });
    setFit({ s, y: 0 });
  }, [scene, height, dim]);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.45; });
  if (!fit) return null;
  // full: whole body centred; bust: the top ~32 % of the model (head and shoulders) centred, the rest fades out below
  return <group ref={g} scale={fit.s} position-y={(view === "bust" ? -height * 0.72 : -height / 2) + lift}><primitive object={scene} /></group>;
}

function Env() {
  useFrame(({ gl, scene }) => { if (!scene.environment) { const p = new THREE.PMREMGenerator(gl); scene.environment = p.fromScene(new RoomEnvironment(), 0.04).texture; p.dispose(); } });
  return null;
}

/** Lucia bust, composed: the full-body model is clipped just above the collarbones and the detailed head sits on the neck,
 *  its bandana covering the seam. Body coordinates: feet at 0, height 1.8. */
const BODY_H = 1.8, CLIP_Y = 1.5, HEAD_H = 0.40, HEAD_Y = 1.39, FOCUS_Y = 1.58;
function LuciaBust({ dim = 0.82 }: { dim?: number }) {
  const body = useLoader(GLTFLoader, "/models/lucia.glb", setupLoader), head = useLoader(GLTFLoader, "/models/lucia2.glb", setupLoader);
  const gl = useThree((s) => s.gl);
  const bodyScene = useMemo(() => body.scene.clone(true), [body]); const headScene = useMemo(() => head.scene.clone(true), [head]);
  const g = useRef<THREE.Group>(null);
  const [fit, setFit] = useState<{ bs: number; hs: number; hx: number; hz: number } | null>(null);
  useEffect(() => {
    gl.localClippingEnabled = true;
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), CLIP_Y);
    const prep = (scene: THREE.Object3D, height: number, clip: boolean, tone: number) => {
      scene.position.set(0, 0, 0); scene.scale.setScalar(1);
      const box = new THREE.Box3().setFromObject(scene); const size = new THREE.Vector3(); box.getSize(size); const c = new THREE.Vector3(); box.getCenter(c);
      scene.position.set(-c.x, -box.min.y, -c.z);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh; if (!mesh.isMesh) return; mesh.castShadow = true;
        for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          const std = m as THREE.MeshStandardMaterial;
          if (std.isMeshStandardMaterial) { std.metalness = Math.min(std.metalness, 0.05); std.roughness = Math.max(std.roughness, 0.72); std.envMapIntensity = 0.35 * tone; std.color.setScalar(tone); if (clip) { std.clippingPlanes = [plane]; std.clipShadows = true; } std.needsUpdate = true; }
        }
      });
      return height / Math.max(size.y, 1e-3);
    };
    const bs = prep(bodyScene, BODY_H, true, 0.9);
    const hs = prep(headScene, HEAD_H, false, dim);
    setFit({ bs, hs, hx: 0, hz: 0.01 });
  }, [bodyScene, headScene, gl, dim]);
  useFrame(({ clock }) => { if (g.current) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.25 + 0.15; });
  if (!fit) return null;
  return (
    <group ref={g} position-y={-FOCUS_Y}>
      <group scale={fit.bs}><primitive object={bodyScene} /></group>
      <group position={[fit.hx, HEAD_Y, fit.hz]} scale={fit.hs}><primitive object={headScene} /></group>
    </group>
  );
}

function Viewer({ local, active }: { local: Local; active: boolean }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, local.view === "bust" ? 0.02 : 0.1, local.cam ?? 4.5], fov: 30 }} frameloop={active ? "always" : "never"} gl={{ antialias: true, alpha: true }} shadows style={{ background: "transparent" }}>
      <Env />
      <ambientLight intensity={0.5} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 2, -2]} intensity={0.8} color="#ff5fa8" />
      <Suspense fallback={null}>{local.id === "lucia" ? <LuciaBust dim={local.dim} /> : <Model url={local.file} height={local.height} view={local.view} lift={local.lift} dim={local.dim} />}</Suspense>
      {!local.fade && <mesh rotation-x={-Math.PI / 2} position-y={-0.9} receiveShadow><circleGeometry args={[1.1, 48]} /><shadowMaterial transparent opacity={0.35} /></mesh>}
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
      <div className="relative aspect-[4/5] overflow-hidden">
        <PalmBackdrop />
        {exists && visible ? <Viewer local={local} active={visible} /> : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="h-[62%] w-[34%] rounded-t-full bg-black/45" style={{ clipPath: "polygon(30% 0, 70% 0, 72% 18%, 95% 28%, 100% 100%, 0 100%, 5% 28%, 28% 18%)" }} />
            {exists === false && <span className="absolute bottom-3 text-[11px] font-semibold uppercase tracking-[.1em] text-haze">3D model coming</span>}
          </div>
        )}
        {local.fade && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]" style={{ background: "linear-gradient(to bottom, transparent, rgba(13,7,32,.92) 70%, #0d0720)" }} aria-hidden="true" />}
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
    <div className="mx-auto grid max-w-[760px] gap-[18px] md:grid-cols-2">
      {LOCALS.map((l) => <Card key={l.id} local={l} />)}
    </div>
  );
}
