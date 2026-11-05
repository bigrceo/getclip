"use client";
/** Atmosphere for the Leonida map: animated ocean, sky dome with a sun, drifting clouds with shadows, district labels, city neon. */
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export type Mode = "day" | "dusk" | "night";
export const MODES: Record<Mode, { sky: string; horizon: string; fog: string; ocean1: string; ocean2: string; tint: string; sun: string; sunY: number; neon: number; label: string }> = {
  day:   { sky: "#5fc4e8", horizon: "#cfeefb", fog: "#cfeefb", ocean1: "#2c68a6", ocean2: "#5a9ad8", tint: "#ffffff", sun: "#fff6d8", sunY: 9, neon: 0.0, label: "Day" },
  dusk:  { sky: "#3b1b6b", horizon: "#ff8a5c", fog: "#ff8a5c", ocean1: "#2c587b", ocean2: "#7a8ab8", tint: "#ffd7bd", sun: "#ffb36b", sunY: 2.4, neon: 0.7, label: "Dusk" },
  night: { sky: "#070418", horizon: "#2a1150", fog: "#2a1150", ocean1: "#183a8b", ocean2: "#3a5fc0", tint: "#8a8fd6", sun: "#dfe6ff", sunY: 7, neon: 1.0, label: "Night" },
};

const oceanVert = /* glsl */`
  varying vec2 vUv; varying vec3 vPos;
  void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.0); vPos = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const oceanFrag = /* glsl */`
  uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uFog; uniform vec3 uCam; uniform float uNight;
  varying vec2 vUv; varying vec3 vPos;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  void main(){
    vec2 p = vPos.xz * 0.9;
    float n = noise(p * 1.2 + vec2(uTime*0.06, uTime*0.04)) * 0.6 + noise(p * 3.1 - vec2(uTime*0.09, uTime*0.05)) * 0.4;
    float w = sin(p.x*2.0 + uTime*0.8 + n*4.0) * 0.5 + 0.5;
    float sp = pow(noise(p * 9.0 + vec2(uTime*0.35, -uTime*0.25)), 14.0) * (1.0 - uNight*0.8);
    float d = distance(vPos.xz, uCam.xz);
    float f = 1.0 - smoothstep(16.0, 40.0, d);
    // additive shimmer only: the base water colour comes from the fogged plane underneath, so there is no seam with the map
    vec3 col = uShallow * (n * 0.06 + w * 0.03) + vec3(sp) * 0.18;
    gl_FragColor = vec4(col * f, 1.0);
  }`;

export function Ocean({ mode }: { mode: Mode }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uDeep: { value: new THREE.Color() }, uShallow: { value: new THREE.Color() }, uFog: { value: new THREE.Color() }, uCam: { value: new THREE.Vector3() }, uNight: { value: 0 } }), []);
  useFrame(({ clock, camera }) => {
    const m = MODES[mode];
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uDeep.value.lerp(new THREE.Color(m.ocean1), 0.05); uniforms.uShallow.value.lerp(new THREE.Color(m.ocean2), 0.05); uniforms.uFog.value.lerp(new THREE.Color(m.fog), 0.05);
    uniforms.uCam.value.copy(camera.position); uniforms.uNight.value += (m.neon - uniforms.uNight.value) * 0.05;
  });
  // Same maths as the map plane: water colour × mode tint, multiplied in linear space, so the seam disappears.
  const WATER = "#2c68a6";
  const base = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => { base.current?.color.lerp(new THREE.Color(WATER).multiply(new THREE.Color(MODES[mode].tint)), 0.05); });
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.03}>
        <planeGeometry args={[260, 260]} />
        <meshBasicMaterial ref={base} color={WATER} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.025}>
        <planeGeometry args={[260, 260]} />
        <shaderMaterial ref={mat} vertexShader={oceanVert} fragmentShader={oceanFrag} uniforms={uniforms} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  );
}

const skyVert = /* glsl */`varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const skyFrag = /* glsl */`
  uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uSunDir; uniform float uNight;
  varying vec3 vW;
  float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
  void main(){
    vec3 d = normalize(vW);
    float h = clamp(d.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uTop, pow(h, 0.55));
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSun * (pow(s, 220.0) * 1.4 + pow(s, 12.0) * 0.25);
    float st = step(0.9985, hash(floor(d * 420.0))) * smoothstep(0.85, 1.0, uNight) * smoothstep(0.12, 0.5, h);
    col += vec3(st);
    gl_FragColor = vec4(col, 1.0);
  }`;

export function Sky({ mode }: { mode: Mode }) {
  const uniforms = useMemo(() => ({ uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uSun: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0.3, 0.3, -1) }, uNight: { value: 0 } }), []);
  useFrame(() => {
    const m = MODES[mode];
    uniforms.uTop.value.lerp(new THREE.Color(m.sky), 0.05); uniforms.uHorizon.value.lerp(new THREE.Color(m.horizon), 0.05); uniforms.uSun.value.lerp(new THREE.Color(m.sun), 0.05);
    uniforms.uSunDir.value.lerp(new THREE.Vector3(0.35, m.sunY / 10, -1), 0.05); uniforms.uNight.value += (m.neon - uniforms.uNight.value) * 0.05;
  });
  return (
    <mesh>
      <sphereGeometry args={[200, 32, 16]} />
      <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

function cloudTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const blob = (x: number, y: number, r: number) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, "rgba(255,255,255,.95)"); rg.addColorStop(0.55, "rgba(255,255,255,.55)"); rg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = rg; g.fillRect(0, 0, 256, 256); };
  blob(128, 140, 90); blob(80, 150, 60); blob(180, 150, 65); blob(120, 110, 55); blob(160, 120, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function Clouds({ mode, count = 9 }: { mode: Mode; count?: number }) {
  const tex = useMemo(() => cloudTexture(), []);
  const group = useRef<THREE.Group>(null);
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: (Math.random() - 0.5) * 30, z: (Math.random() - 0.5) * 26, y: 3.2 + Math.random() * 1.2, s: 2.2 + Math.random() * 2.2, v: 0.08 + Math.random() * 0.08, r: Math.random() * Math.PI, i })), [count]);
  useFrame((_, dt) => {
    const g = group.current; if (!g) return;
    g.children.forEach((child, i) => {
      const s = seeds[Math.floor(i / 2)];
      s.x += s.v * dt; if (s.x > 18) s.x = -18;
      child.position.x = s.x;
    });
  });
  const m = MODES[mode];
  const tint = mode === "night" ? "#4a4f8f" : mode === "dusk" ? "#ffd1c4" : "#ffffff";
  return (
    <group ref={group}>
      {seeds.flatMap((s) => [
        <sprite key={`c${s.i}`} position={[s.x, s.y, s.z]} scale={[s.s * 1.6, s.s, 1]}><spriteMaterial map={tex} color={tint} transparent opacity={mode === "night" ? 0.55 : 0.85} depthWrite={false} fog={false} /></sprite>,
        <sprite key={`s${s.i}`} position={[s.x + 0.6, 0.02, s.z + 0.8]} scale={[s.s * 1.5, s.s * 0.6, 1]}><spriteMaterial map={tex} color="#000" transparent opacity={m.neon > 0.5 ? 0.12 : 0.22} depthWrite={false} /></sprite>,
      ])}
    </group>
  );
}

function labelTexture(text: string, sub?: string) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 160;
  const g = c.getContext("2d")!;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "700 64px Anton, Impact, 'Arial Narrow', sans-serif";
  g.shadowColor = "rgba(0,0,0,.8)"; g.shadowBlur = 14;
  g.lineWidth = 8; g.strokeStyle = "rgba(10,6,24,.85)"; g.strokeText(text, 256, sub ? 62 : 80);
  g.fillStyle = "#fff4ec"; g.fillText(text, 256, sub ? 62 : 80);
  if (sub) { g.font = "600 26px Inter, system-ui, sans-serif"; g.letterSpacing = "4px"; g.fillStyle = "#ffc38a"; g.shadowBlur = 8; g.fillText(sub.toUpperCase(), 256, 122); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

const DISTRICTS: { name: string; sub: string; u: number; v: number }[] = [
  { name: "VICE CITY", sub: "downtown", u: 0.64, v: 0.5 }, { name: "VICE BEACH", sub: "ocean drive", u: 0.85, v: 0.44 },
  { name: "PORT GELLHORN", sub: "west coast", u: 0.26, v: 0.51 }, { name: "AMBROSIA", sub: "sugar country", u: 0.53, v: 0.33 },
  { name: "GRASSRIVERS", sub: "north west", u: 0.22, v: 0.28 }, { name: "MOUNT KALAGA", sub: "national park", u: 0.47, v: 0.18 },
  { name: "EVERGLADES", sub: "gator country", u: 0.42, v: 0.66 }, { name: "LEONARD KEYS", sub: "island road", u: 0.45, v: 0.88 },
];
export function DistrictLabels({ toWorld }: { toWorld: (u: number, v: number) => [number, number, number] }) {
  const texs = useMemo(() => DISTRICTS.map((d) => labelTexture(d.name, d.sub)), []);
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    const g = group.current; if (!g) return;
    const d = camera.position.length();
    const o = THREE.MathUtils.clamp((d - 5) / 8, 0, 1); // fade out when close
    g.children.forEach((c) => { const m = (c as THREE.Sprite).material as THREE.SpriteMaterial; m.opacity += (o * 0.95 - m.opacity) * 0.1; });
  });
  return (
    <group ref={group}>
      {DISTRICTS.map((d, i) => { const [x, , z] = toWorld(d.u, d.v); return (
        <sprite key={d.name} position={[x, 0.55, z]} scale={[3.2, 1, 1]}><spriteMaterial map={texs[i]} transparent opacity={0} depthWrite={false} depthTest={false} /></sprite>
      ); })}
    </group>
  );
}

function glowTexture(color: string) {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128); rg.addColorStop(0, color); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/** Neon haze over downtown that comes up at dusk and night. */
export function CityNeon({ mode, toWorld }: { mode: Mode; toWorld: (u: number, v: number) => [number, number, number] }) {
  const pink = useMemo(() => glowTexture("rgba(255,61,139,.75)"), []), cyan = useMemo(() => glowTexture("rgba(42,255,198,.6)"), []);
  const a = useRef<THREE.Sprite>(null), b = useRef<THREE.Sprite>(null);
  useFrame(({ clock }) => {
    const target = MODES[mode].neon;
    for (const [r, k] of [[a, 0.5], [b, 0.35]] as const) { const s = r.current; if (!s) continue; const m = s.material; m.opacity += (target * k * (0.9 + Math.sin(clock.elapsedTime * 2 + k) * 0.1) - m.opacity) * 0.08; }
  });
  const [x, , z] = toWorld(0.65, 0.52);
  return (
    <>
      <sprite ref={a} position={[x, 0.5, z]} scale={[5.5, 4.2, 1]}><spriteMaterial map={pink} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
      <sprite ref={b} position={[x + 0.8, 0.4, z + 0.5]} scale={[3.4, 2.2, 1]}><spriteMaterial map={cyan} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
    </>
  );
}

/** Sun disc + lens glow sprite near the horizon. */
export function Sun({ mode }: { mode: Mode }) {
  const tex = useMemo(() => glowTexture("rgba(255,240,200,1)"), []);
  const ref = useRef<THREE.Sprite>(null);
  useFrame(() => { const m = MODES[mode]; const s = ref.current; if (!s) return; s.position.lerp(new THREE.Vector3(14, m.sunY * 2.2, -38), 0.05); s.material.color.lerp(new THREE.Color(m.sun), 0.05); s.material.opacity += ((mode === "night" ? 0.35 : 0.9) - s.material.opacity) * 0.05; });
  return <sprite ref={ref} position={[14, 10, -38]} scale={[mode === "night" ? 5 : 11, mode === "night" ? 5 : 11, 1]}><spriteMaterial map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></sprite>;
}
