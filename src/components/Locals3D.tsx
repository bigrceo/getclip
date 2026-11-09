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
import { EffectComposer, N8AO, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export type Local = { id: string; name: string; ticker: string; role: string; bio: string; file: string; credit: string; creditUrl: string; height?: number; view?: "full" | "bust"; fade?: boolean; cam?: number; lift?: number; dim?: number; bg?: string };
export const LOCALS: Local[] = [
  { id: "lucia", name: "Lucia", ticker: "LUCIA", role: "Out on parole", bio: "Did her time, kept her fists taped. Fresh out and done waiting for anyone to hand her a way up.", file: "/models/lucia-bust.glb", bg: "/locals/ocean-drive.jpg", credit: "getclip.fun", creditUrl: "https://getclip.fun", view: "full", height: 1.0, fade: true, cam: 2.3 },
  { id: "jason", name: "Jason", ticker: "JASON", role: "Keys runner", bio: "Ex-army, now moving boats through the Keys for people who pay cash. Wants out of the small jobs.", file: "/models/jason-bust.glb", bg: "/locals/keys-marina.jpg", credit: "getclip.fun", creditUrl: "https://getclip.fun", view: "full", height: 1.0, fade: true, cam: 2.3 },
];




if (typeof window !== "undefined") {
  for (const l of LOCALS) useLoader.preload(GLTFLoader, l.file, setupLoader);
}

function setupLoader(l: GLTFLoader) {
  const draco = new DRACOLoader(); draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  l.setDRACOLoader(draco); l.setMeshoptDecoder(MeshoptDecoder);
}

/** Skin shading: wrap lighting (soft terminator), red subsurface bleed where light grazes, matte base with a faint oily
 *  clearcoat on the highlights and a soft sheen. Applied to the whole bust (one material per generated model). */
function skinMaterial(src: THREE.MeshStandardMaterial, dim: number) {
  if (!src.isMeshStandardMaterial) return src;
  const m = new THREE.MeshPhysicalMaterial({ map: src.map, bumpMap: src.map, bumpScale: 0.0035, color: new THREE.Color("#ffffff"), roughness: 0.74, metalness: 0, envMapIntensity: 0.35,
    sheen: 0.18, sheenRoughness: 0.85, sheenColor: new THREE.Color("#ffb79e"), clearcoat: 0.06, clearcoatRoughness: 0.6, specularIntensity: 0.45, side: THREE.DoubleSide }); // double-sided: thin hair shells no longer open onto the backdrop
  void dim;
  m.onBeforeCompile = (sh) => {
    // world position for the hair mask (hair = dark, brownish, upper part of the bust)
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vWPos;
      float hairMask = 0.0;
      float clothMask = 0.0;
      float metalMask = 0.0;
      uniform vec3 uKeyPos;`);
    sh.uniforms.uKeyPos = { value: new THREE.Vector3(-2.2, 1.1, 2.8) };
    sh.fragmentShader = sh.fragmentShader.replace("#include <lights_physical_pars_fragment>", `#include <lights_physical_pars_fragment>
      vec3 sssBleed(vec3 base, float dotNLraw) {
        float t = pow(saturate(1.0 - abs(dotNLraw)), 2.5);          // strongest where light grazes the skin
        return base * vec3(1.0, 0.28, 0.18) * t * 0.5;
      }
      // Kajiya-Kay: hair strands run downwards; two shifted highlights slide along the strands as the head turns
      float hairSpec(vec3 T, vec3 H, float shift, float power) {
        vec3 Ts = normalize(T + shift * normalize(cross(cross(T, H), T)));
        float dotTH = dot(Ts, H);
        float sinTH = sqrt(max(0.0, 1.0 - dotTH * dotTH));
        return pow(sinTH, power) * smoothstep(-1.0, 0.0, dotTH);
      }`);
    // hair mask from the albedo, computed right after the texture lookup; darker roots toward the crown
    sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
      {
        float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        float brown = step(diffuseColor.b * 1.08, diffuseColor.r) * step(diffuseColor.b, diffuseColor.g + 0.06);
        float high = smoothstep(-0.05, 0.12, vWPos.y);
        hairMask = (1.0 - smoothstep(0.16, 0.34, lum)) * brown * high;
        float sat = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)) - min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
        float low = 1.0 - smoothstep(-0.18, -0.02, vWPos.y);                       // below the collarbones
        clothMask = (1.0 - smoothstep(0.10, 0.22, lum)) * (1.0 - smoothstep(0.04, 0.10, sat)) * low * (1.0 - hairMask);   // dark neutral = tank top
        metalMask = smoothstep(0.40, 0.60, lum) * (1.0 - smoothstep(0.04, 0.09, sat)) * low;                               // bright neutral = chain
        diffuseColor.rgb *= 1.0 - hairMask * 0.22 * smoothstep(0.1, 0.45, vWPos.y);   // roots a touch darker near the crown
      }`);
    // bump (strand micro-relief) only on hair
    sh.fragmentShader = sh.fragmentShader.replace("dHdxy_fwd()", "dHdxy_fwd() * hairMask");
    // hair: rougher base, no clearcoat
    sh.fragmentShader = sh.fragmentShader.replace("material.roughness = max( roughnessFactor, 0.045 );", "material.roughness = max( roughnessFactor, 0.045 ); material.roughness = mix( material.roughness, 0.85, hairMask ); material.roughness = mix( material.roughness, 0.97, clothMask ); material.roughness = mix( material.roughness, 0.28, metalMask );");
    sh.fragmentShader = sh.fragmentShader.replace("material.clearcoat = clearcoat;", "material.clearcoat = clearcoat * ( 1.0 - hairMask ) * ( 1.0 - clothMask ) * ( 1.0 - metalMask );");
    // chain: metallic; tank top: no specular, strong fabric sheen; skin keeps its sheen
    sh.fragmentShader = sh.fragmentShader.replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\n\tmetalnessFactor = mix( metalnessFactor, 0.9, metalMask );");
    sh.fragmentShader = sh.fragmentShader.replace("material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );",
      "material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );\n\tmaterial.specularColor *= ( 1.0 - clothMask * 0.85 );");
    sh.fragmentShader = sh.fragmentShader.replace("material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );",
      "material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );\n\tmaterial.sheenColor = mix( material.sheenColor, vec3( 0.35 ), clothMask ) * ( 1.0 - metalMask ) * ( 1.0 - hairMask );\n\tmaterial.sheenRoughness = mix( material.sheenRoughness, 1.0, clothMask );");
    // wrap the diffuse term and add the bleed (RE_Direct_Physical is reached through lights_fragment_begin)
    sh.fragmentShader = sh.fragmentShader.replace(
      "float dotNL = saturate( dot( geometryNormal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;",
      "float dotNLraw = dot( geometryNormal, directLight.direction );\n\tfloat dotNL = saturate( ( dotNLraw + 0.3 ) / 1.3 );\n\tvec3 irradiance = dotNL * directLight.color;\n\treflectedLight.directDiffuse += sssBleed( material.diffuseColor, dotNLraw ) * directLight.color * 0.6 * ( 1.0 - hairMask ) * ( 1.0 - clothMask ) * ( 1.0 - metalMask );");
    // anisotropic hair highlights from the key light, added at the end of lighting
    sh.fragmentShader = sh.fragmentShader.replace("#include <lights_fragment_end>", `#include <lights_fragment_end>
      if (hairMask > 0.001) {
        vec3 nW = normalize(transpose(mat3(viewMatrix)) * normal);
        vec3 vW = normalize(cameraPosition - vWPos);
        vec3 lW = normalize(uKeyPos - vWPos);
        vec3 up = vec3(0.0, -1.0, 0.0);
        vec3 T = normalize(up - nW * dot(up, nW));
        vec3 H = normalize(lW + vW);
        float s1 = hairSpec(T, H, -0.08, 110.0);
        float s2 = hairSpec(T, H,  0.12, 40.0);
        vec3 tint = mix(vec3(1.0, 0.70, 0.40), diffuseColor.rgb * 2.2, 0.5);
        reflectedLight.directSpecular += hairMask * (s1 * 0.05 + s2 * 0.05 * diffuseColor.rgb * 3.0) * tint;
      }`);
  };
  m.customProgramCacheKey = () => "skin-hair-cloth-metal";
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
  const sun = g.createRadialGradient(w * 0.2, h * 0.5, 0, w * 0.2, h * 0.5, w * 0.16);   // one low sun, front-left, golden
  sun.addColorStop(0, "rgba(255,196,120,0.9)"); sun.addColorStop(0.35, "rgba(255,150,80,0.45)"); sun.addColorStop(1, "rgba(255,120,80,0)");
  g.fillStyle = sun; g.fillRect(0, 0, w, h);
  box(0, h * 0.5, w, h * 0.2, "rgba(255,110,90,0.25)", 40);   // horizon glow all around
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** Sky only (sun and everything else live on the rotating cylinders). */
function skyTexture() {
  const w = 16, h = 512, c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#2b0f55"); sky.addColorStop(0.34, "#6a1d8f"); sky.addColorStop(0.6, "#d6298b"); sky.addColorStop(0.86, "#ff8c46"); sky.addColorStop(1, "#ffc46b");
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** A real photo panorama of the shore wrapped around the bust, turning with it so orbiting the character orbits the place.
 *  The photo is mirrored once around the cylinder so the loop has no seam. */
function Panorama({ src }: { src: string }) {
  const tex = useLoader(THREE.TextureLoader, src);
  useMemo(() => { tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.MirroredRepeatWrapping; tex.repeat.x = 2; tex.anisotropy = 8; tex.needsUpdate = true; }, [tex]);
  const a = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (a.current) a.current.rotation.y += dt * 0.45; });
  // circumference 2π·7 ≈ 44 → two 21:9 copies of 22 each → height 22·9/21 ≈ 9.4
  return (
    <mesh ref={a} position-y={0.6} renderOrder={-2}><cylinderGeometry args={[7, 7, 9.4, 128, 1, true]} /><meshBasicMaterial map={tex} side={THREE.BackSide} depthWrite={false} toneMapped={false} /></mesh>
  );
}

function Env() {
  useFrame(({ gl, scene }) => {
    if (!scene.environment) { const p = new THREE.PMREMGenerator(gl); scene.environment = p.fromEquirectangular(studioHDR()).texture; scene.environmentIntensity = 0.9; p.dispose(); }
    if (!scene.background) scene.background = skyTexture();
  });
  return null;
}

function Viewer({ local, active }: { local: Local; active: boolean }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, local.view === "bust" ? 0.02 : 0.1, local.cam ?? 4.5], fov: 30 }} frameloop={active ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }} shadows="soft" style={{ background: "transparent" }}>
      <Env />
      <Suspense fallback={null}><Panorama src={local.bg ?? "/locals/ocean-drive.jpg"} /></Suspense>
      {/* portrait lighting: warm key from the front-left, cool fill from the right, sunset rim from behind */}
      <ambientLight intensity={0.34} color="#8c78b8" />
      <spotLight position={[-2.2, 1.1, 2.8]} angle={0.7} penumbra={1} intensity={15} color="#ffd6a8" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} shadow-normalBias={0.01} />
      <spotLight position={[2.4, 1.2, 2.0]} angle={0.7} penumbra={1} intensity={3} color="#b07ad8" />
      <spotLight position={[0.8, 1.0, -2.4]} angle={0.7} penumbra={1} intensity={2.5} color="#ff6e4a" />
      <Suspense fallback={null}><Model url={local.file} height={local.height} view={local.view} lift={local.lift} dim={local.dim} /></Suspense>
      {!local.fade && <mesh rotation-x={-Math.PI / 2} position-y={-0.9} receiveShadow><circleGeometry args={[1.1, 48]} /><shadowMaterial transparent opacity={0.35} /></mesh>}
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={0.3} intensity={0.9} distanceFalloff={0.6} quality="performance" />
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
  useEffect(() => { fetch(local.file, { method: "HEAD", cache: "no-store" }).then((r) => setExists(r.ok)).catch(() => setExists(false)); }, [local.file]);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setVisible(true); }, { rootMargin: "300px", threshold: 0 });
    const t = setTimeout(() => { const r = el.getBoundingClientRect(); if (r.bottom > -300 && r.top < innerHeight + 300) setVisible(true); }, 800);
    io.observe(el); return () => { io.disconnect(); clearTimeout(t); };
  }, []);
  return (
    <div ref={ref} className="glass overflow-hidden">
      <div className="relative aspect-[4/5] overflow-hidden">
        <PalmBackdrop />
        {exists !== false ? <Viewer local={local} active={visible} /> : (
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
