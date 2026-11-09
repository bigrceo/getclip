"use client";
/**
 * Meet the Locals, in 3D: fan-made GTA VI character models (glTF, CC BY, see LOCALS[].credit) spinning in their own
 * card. Each model only loads when its card scrolls into view; a card whose file is missing shows a silhouette.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { PalmBackdrop } from "./PalmBackdrop";
import { EffectComposer, N8AO, DepthOfField, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export type Local = { id: string; name: string; ticker: string; role: string; bio: string; file: string; credit: string; creditUrl: string; height?: number; view?: "full" | "bust"; fade?: boolean; cam?: number; lift?: number; dim?: number };
export const LOCALS: Local[] = [
  { id: "lucia", name: "Lucia", ticker: "LUCIA", role: "Out on parole", bio: "Did her time, kept her fists taped. Fresh out and done waiting for anyone to hand her a way up.", file: "/models/lucia-bust.glb", credit: "getclip.fun", creditUrl: "https://getclip.fun", view: "full", height: 1.0, fade: true, cam: 2.3 },
  { id: "jason", name: "Jason", ticker: "JASON", role: "Keys runner", bio: "Ex-army, now moving boats through the Keys for people who pay cash. Wants out of the small jobs.", file: "/models/jason-bust.glb", credit: "getclip.fun", creditUrl: "https://getclip.fun", view: "full", height: 1.0, fade: true, cam: 2.3 },
];




function setupLoader(l: GLTFLoader) {
  const draco = new DRACOLoader(); draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  l.setDRACOLoader(draco); l.setMeshoptDecoder(MeshoptDecoder);
}

/** Skin shading: wrap lighting (soft terminator), red subsurface bleed where light grazes, matte base with a faint oily
 *  clearcoat on the highlights and a soft sheen. Applied to the whole bust (one material per generated model). */
function skinMaterial(src: THREE.MeshStandardMaterial, dim: number) {
  if (!src.isMeshStandardMaterial) return src;
  const m = new THREE.MeshPhysicalMaterial({ map: src.map, color: new THREE.Color("#ffffff"), roughness: 0.6, metalness: 0, envMapIntensity: 0.5,
    sheen: 0.18, sheenRoughness: 0.85, sheenColor: new THREE.Color("#ffb79e"), clearcoat: 0.22, clearcoatRoughness: 0.42, specularIntensity: 0.8 });
  void dim;
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <lights_physical_pars_fragment>", `#include <lights_physical_pars_fragment>
      vec3 sssBleed(vec3 base, float dotNLraw) {
        float t = pow(saturate(1.0 - abs(dotNLraw)), 2.5);          // strongest where light grazes the skin
        return base * vec3(1.0, 0.28, 0.18) * t * 0.5;
      }`);
    // wrap the diffuse term and add the bleed (RE_Direct_Physical is reached through lights_fragment_begin)
    sh.fragmentShader = sh.fragmentShader.replace(
      "float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;",
      "float dotNLraw = dot( geometryNormal, directLight.direction );\n\tfloat dotNL = saturate( ( dotNLraw + 0.3 ) / 1.3 );\n\tvec3 irradiance = dotNL * directLight.color;\n\treflectedLight.directDiffuse += sssBleed( material.diffuseColor, dotNLraw ) * directLight.color * 0.6;");
  };
  m.customProgramCacheKey = () => "skin";
  return m;
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
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mesh.material = mats.length === 1 ? skinMaterial(mats[0] as THREE.MeshStandardMaterial, dim) : mats.map((m) => skinMaterial(m as THREE.MeshStandardMaterial, dim));
    });
    setFit({ s, y: 0 });
  }, [scene, height, dim]);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.45; });
  if (!fit) return null;
  // full: whole body centred; bust: the top ~32 % of the model (head and shoulders) centred, the rest fades out below
  return <group ref={g} scale={fit.s} position-y={(view === "bust" ? -height * 0.72 : -height / 2) + lift}><primitive object={scene} /></group>;
}

function studioHDR() {
  const w = 1024, h = 512, c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#3a2a5c"); sky.addColorStop(0.5, "#2a1836"); sky.addColorStop(0.62, "#4a1f3c"); sky.addColorStop(1, "#0a0710");
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  const box = (x: number, y: number, bw: number, bh: number, col: string, blur: number) => { g.save(); g.filter = `blur(${blur}px)`; g.fillStyle = col; g.fillRect(x, y, bw, bh); g.restore(); };
  box(w * 0.18, h * 0.22, w * 0.16, h * 0.3, "rgba(255,238,215,0.95)", 18);   // key softbox, front-left
  box(w * 0.62, h * 0.3, w * 0.12, h * 0.22, "rgba(150,175,255,0.55)", 22);   // cool fill, right
  box(w * 0.92, h * 0.26, w * 0.1, h * 0.26, "rgba(255,120,90,0.7)", 20);     // sunset rim, behind
  box(0, h * 0.26, w * 0.04, h * 0.26, "rgba(255,120,90,0.7)", 20);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** The palm sunset backdrop, drawn into a texture used as the scene background so the post stack (DoF, grain, vignette)
 *  covers it too; the HTML PalmBackdrop stays underneath for the silhouette fallback. */
function backdropTexture() {
  const w = 800, h = 1000, c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, w * 0.1, h); sky.addColorStop(0, "#2b0f55"); sky.addColorStop(0.34, "#6a1d8f"); sky.addColorStop(0.62, "#d6298b"); sky.addColorStop(0.88, "#ff8c46"); sky.addColorStop(1, "#ffc46b");
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  const sun = g.createRadialGradient(w / 2, h * 0.62, 0, w / 2, h * 0.62, w * 0.35); sun.addColorStop(0, "rgba(255,230,150,.95)"); sun.addColorStop(0.42, "rgba(255,150,80,.6)"); sun.addColorStop(0.7, "rgba(255,150,80,0)");
  g.fillStyle = sun; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(0, h * 0.66, w, 1);
  const palm = (x: number, y: number, sc: number, flip: boolean, lean: number) => {
    g.save(); g.translate(x, y); g.scale(flip ? -sc : sc, sc); g.rotate(lean * Math.PI / 180); g.fillStyle = "#160a2e";
    g.fill(new Path2D("M-9 0 C -14 -120, 4 -240, 2 -360 L 14 -360 C 22 -240, 8 -120, 11 0 Z"));
    g.translate(8, -358);
    for (let i = 0; i < 9; i++) { const a = (-170 + i * 20 + (i % 2 ? 6 : -4)) * Math.PI / 180, L = 150 + (i % 3) * 22; g.save(); g.rotate(a); g.fill(new Path2D(`M0 0 C ${L * 0.25} ${-L * 0.35}, ${L * 0.6} ${-L * 0.5}, ${L} ${-L * 0.42} C ${L * 0.65} ${-L * 0.28}, ${L * 0.35} ${-L * 0.1}, 0 0 Z`)); g.restore(); }
    g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.fill(); g.restore();
  };
  const k = w / 400; palm(48 * k, 1040, 0.72 * k, false, -8); palm(372 * k, 1050, 0.86 * k, true, 6); palm(330 * k, 1080, 0.5 * k, true, -14);
  g.fillStyle = "#160a2e"; g.fillRect(0, h * 0.94, w, h * 0.06);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function Env() {
  useFrame(({ gl, scene }) => {
    if (!scene.environment) { const p = new THREE.PMREMGenerator(gl); scene.environment = p.fromEquirectangular(studioHDR()).texture; scene.environmentIntensity = 0.9; p.dispose(); }
    if (!scene.background) scene.background = backdropTexture();
  });
  return null;
}

function Viewer({ local, active }: { local: Local; active: boolean }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, local.view === "bust" ? 0.02 : 0.1, local.cam ?? 4.5], fov: 30 }} frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }} shadows="soft" style={{ background: "transparent" }}>
      <Env />
      {/* portrait lighting: warm key from the front-left, cool fill from the right, sunset rim from behind */}
      <ambientLight intensity={0.22} color="#c9b8ff" />
      <spotLight position={[-1.6, 2.2, 2.6]} angle={0.6} penumbra={0.9} intensity={20} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} shadow-normalBias={0.01} />
      <spotLight position={[2.4, 1.2, 2.0]} angle={0.7} penumbra={1} intensity={7} color="#9fb8ff" />
      <spotLight position={[0.8, 1.8, -2.4]} angle={0.7} penumbra={1} intensity={6} color="#ff7a5c" />
      <Suspense fallback={null}><Model url={local.file} height={local.height} view={local.view} lift={local.lift} dim={local.dim} /></Suspense>
      {!local.fade && <mesh rotation-x={-Math.PI / 2} position-y={-0.9} receiveShadow><circleGeometry args={[1.1, 48]} /><shadowMaterial transparent opacity={0.35} /></mesh>}
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={0.3} intensity={0.9} distanceFalloff={0.6} quality="performance" />
        <DepthOfField focusDistance={0.02} focalLength={0.08} bokehScale={1.6} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.2} />
        <Vignette eskil={false} offset={0.3} darkness={0.4} />
      </EffectComposer>
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
        {local.credit !== "getclip.fun" && <p className="mt-3 text-[11px] text-haze/70">3D model: <a href={local.creditUrl} target="_blank" rel="noopener noreferrer" className="underline">{local.credit}</a> (CC BY 4.0)</p>}
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
