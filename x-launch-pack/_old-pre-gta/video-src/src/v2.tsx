import React from 'react';
import { AbsoluteFill, Composition, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Sequence, OffthreadVideo, Loop, continueRender, delayRender, random } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { MINTS } from './mints';

const INTER = loadInter('normal', { weights: ['600', '700', '800'], subsets: ['latin'] }).fontFamily;
const hb = delayRender('bungee2');
new FontFace('Bungee', `url(${staticFile('Bungee-Regular.ttf')})`).load().then((f) => { document.fonts.add(f); continueRender(hb); });
const B = 'Bungee';
const C = { night: '#14123a', deck: '#1c1a4d', line: '#322e78', haze: '#a7a3e0', pink: '#ff3399', sun: '#ffcc00', sky: '#00ccff', mint: '#66ff99', ink: '#0b0a24' };
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const inExpo = Easing.bezier(0.7, 0, 0.84, 0);
const cl = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const r = (f: number, a: number, b: number, e = outExpo) => interpolate(f, [a, b], [0, 1], { ...cl, easing: e });
const pop = (f: number, s: number, d = 10, st = 200) => spring({ frame: f - s, fps: 60, config: { damping: d, stiffness: st, mass: 0.7 } });
const shake = (f: number, at: number, amp = 18, len = 14) => { const k = f - at; if (k < 0 || k > len) return [0, 0]; const a = amp * (1 - k / len); return [(random('x' + f) - 0.5) * 2 * a, (random('y' + f) - 0.5) * 2 * a]; };
const ALL = ['HENRY', 'OMAKASE', 'GOATS', 'WHALE', 'MESSI', 'OTTER', 'PUPS', 'GLASS', 'HUG', 'CATS', 'COLD', 'UNICORN', 'ALBINO', 'HYDRATE', 'BESTIES', 'QUIET', 'CANCEL', 'ALONE', 'PICCOLO', 'CALLME', 'WOLVERINE'];
const ACC = [C.pink, C.sun, C.sky, C.mint];

const Clip = ({ t, style, rate = 1 }: { t: string; style?: React.CSSProperties; rate?: number }) => (
  <Loop durationInFrames={Math.floor(230 / rate)}>
    <OffthreadVideo src={staticFile(`loops/${t}.mp4`)} muted playbackRate={rate} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />
  </Loop>
);
const Logo = ({ n, s, fill = '#fff' }: { n: string; s: number; fill?: string }) => (
  <div style={{ width: s, height: s, background: fill, WebkitMaskImage: `url(${staticFile(n + '.svg')})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
);
// directional (horizontal) motion blur
const HBlur = ({ id, amt, children, style }: { id: string; amt: number; children: React.ReactNode; style?: React.CSSProperties }) => (
  <>
    <svg width={0} height={0} style={{ position: 'absolute' }}><filter id={id} x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation={`${Math.max(0, amt)} ${Math.max(0, amt) * 0.08}`} /></filter></svg>
    <div style={{ ...style, filter: amt > 0.3 ? `url(#${id})` : undefined }}>{children}</div>
  </>
);
const Grain = () => { const f = useCurrentFrame(); return (
  <AbsoluteFill style={{ opacity: 0.08, pointerEvents: 'none', backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence baseFrequency=%22.9%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22/></svg>")', backgroundPosition: `${(f * 37) % 200}px ${(f * 53) % 200}px` }} />); };
const Bg = () => { const f = useCurrentFrame(); return (
  <AbsoluteFill style={{ background: C.night }}>
    <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.line} 2px, transparent 2.4px)`, backgroundSize: '18px 18px', opacity: 0.6, transform: `translateY(${(f * 0.4) % 18}px)` }} />
    <div style={{ position: 'absolute', width: 900, height: 900, borderRadius: '50%', left: 90 + Math.sin(f / 70) * 120, top: 120 + Math.cos(f / 90) * 90, background: C.pink, filter: 'blur(220px)', opacity: 0.25 }} />
  </AbsoluteFill>); };
const T = ({ children, size = 120, color = '#fff', style }: { children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }) => (
  <div style={{ fontFamily: B, fontSize: size, lineHeight: 0.95, color, textShadow: `7px 7px 0 ${C.ink}`, textAlign: 'center', ...style }}>{children}</div>
);
const Mint = ({ t, size = 30 }: { t: string; size?: number }) => { const m = MINTS[t]; return (
  <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: size, color: C.haze, letterSpacing: '.02em' }}>
    {m.slice(0, 5)}…{m.slice(-12, -4)}<span style={{ color: C.ink, background: C.mint, padding: '0 6px', marginLeft: 2 }}>{m.slice(-4)}</span>
  </div>); };
const Card = ({ t, w, acc = C.pink, children, flash = 0 }: { t: string; w: number; acc?: string; children?: React.ReactNode; flash?: number }) => (
  <div style={{ width: w, background: C.deck, border: `6px solid ${C.ink}`, boxShadow: `${w * 0.025}px ${w * 0.025}px 0 ${acc}`, position: 'relative' }}>
    <div style={{ width: '100%', aspectRatio: '1', position: 'relative', overflow: 'hidden', borderBottom: `6px solid ${C.ink}` }}><Clip t={t} /></div>
    <div style={{ padding: `${w * 0.03}px ${w * 0.04}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontFamily: B, fontSize: w * 0.085, color: '#fff' }}>${t}</div>
      <Img src={staticFile('pumpfun.png')} style={{ width: w * 0.1, height: w * 0.1 }} />
    </div>
    <div style={{ padding: `0 ${w * 0.04}px ${w * 0.035}px` }}><Mint t={t} size={w * 0.042} /></div>
    {children}
    <div style={{ position: 'absolute', inset: -6, background: '#fff', opacity: flash, pointerEvents: 'none' }} />
  </div>
);

// 0-130 HOOK: GOATS full frame
const Hook = () => {
  const f = useCurrentFrame();
  const z = 1.12 - f * 0.0009;
  const w = ['this', 'clip', 'has'];
  const big = pop(f, 22, 8, 260);
  const no = pop(f, 72, 8, 280);
  const [sx, sy] = shake(f, 72, 22);
  const dim = r(f, 66, 80);
  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px,${sy}px)` }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}><Clip t="GOATS" style={{ filter: `saturate(${1 - dim * 0.6}) brightness(${1 - dim * 0.35})` }} /></AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(11,10,36,.55) 0%, rgba(11,10,36,0) 40%, rgba(11,10,36,0) 60%, rgba(11,10,36,.7) 100%)' }} />
      <div style={{ position: 'absolute', top: 70, width: '100%', display: 'flex', justifyContent: 'center', gap: 28 }}>
        {w.map((x, i) => { const p = pop(f, i * 5, 9, 320); return <T key={x} size={92} style={{ transform: `translateY(${(1 - p) * -120}px)`, opacity: Math.min(1, p * 2) }}>{x}</T>; })}
      </div>
      <div style={{ position: 'absolute', top: 175, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <T size={170} color={C.sun} style={{ transform: `scale(${big * (1 - dim * 0.25)}) rotate(${(1 - big) * -8}deg)`, transformOrigin: '50% 0%' }}>4.4M views</T>
      </div>
      <div style={{ position: 'absolute', bottom: 80, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <T size={200} color={C.pink} style={{ transform: `scale(${no * 1}) rotate(${(1 - no) * 10 - 3}deg)`, opacity: f >= 72 ? 1 : 0 }}>and no coin.</T>
      </div>
      <div style={{ position: 'absolute', top: 375, left: 0, right: 0, textAlign: 'center', fontFamily: INTER, fontWeight: 700, fontSize: 26, color: '#fff', opacity: r(f, 30, 45) * 0.85, letterSpacing: '.1em' }}>X · @FUUUUKATSU · STATION GOATS</div>
    </AbsoluteFill>
  );
};

// 130-300 TRANSFORM: shrink into crop -> ticker -> slam coin card
const Transform = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const S = 620;
  const shrink = r(f, 0, 26, Easing.bezier(0.65, -0.25, 0.25, 1.15));
  const full = Math.max(width, height);
  const size = interpolate(shrink, [0, 1], [full, S]);
  const handles = r(f, 18, 34);
  const tick = '$GOATS';
  const n = Math.floor(interpolate(f, [36, 64], [0, tick.length], cl));
  const slamAt = 82;
  const slamP = pop(f, slamAt, 7, 300);
  const pre = r(f, 68, slamAt, inExpo); // anticipation: pull back
  const carded = f >= slamAt;
  const flash = interpolate(f, [slamAt, slamAt + 10], [0.9, 0], cl);
  const [sx, sy] = shake(f, slamAt, 26, 18);
  const ring = r(f, slamAt, slamAt + 30);
  const cam = 1 + (f - slamAt > 0 ? (f - slamAt) * 0.0006 : 0);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `translate(${sx}px,${sy}px) scale(${cam})` }}>
      <Bg />
      {!carded ? (
        <div style={{ position: 'relative', width: size, height: size, transform: `scale(${1 - pre * 0.12}) rotate(${pre * -4}deg)`, marginTop: -60 * shrink }}>
          <div style={{ width: '100%', height: '100%', overflow: 'hidden', border: shrink > 0.5 ? `6px solid ${C.ink}` : 'none' }}><Clip t="GOATS" /></div>
          {/* crop frame + handles */}
          <div style={{ position: 'absolute', inset: -4, border: `4px solid ${C.sun}`, opacity: handles }} />
          {[0, 1].map((a) => <div key={a} style={{ position: 'absolute', left: `${33.3 * (a + 1)}%`, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,.5)', opacity: handles }} />)}
          {[0, 1].map((a) => <div key={a} style={{ position: 'absolute', top: `${33.3 * (a + 1)}%`, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,.5)', opacity: handles }} />)}
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => (
            <div key={i} style={{ position: 'absolute', width: 60, height: 60, left: x ? undefined : -14, right: x ? -14 : undefined, top: y ? undefined : -14, bottom: y ? -14 : undefined,
              borderLeft: x ? 'none' : `14px solid ${C.sun}`, borderRight: x ? `14px solid ${C.sun}` : 'none', borderTop: y ? 'none' : `14px solid ${C.sun}`, borderBottom: y ? `14px solid ${C.sun}` : 'none', transform: `scale(${pop(f, 18 + i * 3, 9, 300)})` }} />))}
          <div style={{ position: 'absolute', bottom: -130, width: '100%', textAlign: 'center' }}>
            <T size={96} color="#fff">{tick.slice(0, n)}<span style={{ color: C.sun, opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>|</span></T>
          </div>
          <div style={{ position: 'absolute', top: -70, width: '100%', textAlign: 'center', fontFamily: INTER, fontWeight: 800, fontSize: 28, letterSpacing: '.14em', color: C.sun, opacity: handles }}>SQUARE CROP · 4S LOOP</div>
        </div>
      ) : (
        <div style={{ transform: `scale(${0.6 + 0.4 * slamP}) rotate(${(1 - slamP) * 6 - 2}deg)` }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 700, height: 700, marginLeft: -350, marginTop: -350, borderRadius: '50%', border: `${20 * (1 - ring)}px solid ${C.mint}`, transform: `scale(${0.6 + ring * 1.4})`, opacity: 1 - ring }} />
          <Card t="GOATS" w={560} acc={C.pink} flash={flash} />
          <div style={{ position: 'absolute', top: -46, right: -70, transform: `rotate(12deg) scale(${pop(f, slamAt + 10, 8, 300)})`, background: C.mint, color: C.ink, fontFamily: B, fontSize: 52, padding: '8px 22px', border: `5px solid ${C.ink}` }}>MINTED</div>
          <div style={{ position: 'absolute', bottom: -96, left: 0, right: 0, textAlign: 'center', fontFamily: INTER, fontWeight: 800, fontSize: 30, color: '#fff', letterSpacing: '.08em', opacity: r(f, slamAt + 20, slamAt + 34) }}>EVERY MINT ENDS IN <span style={{ color: C.mint }}>CLIP</span></div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// 300-420 MONTAGE: 5 beats x 24f, whip pans
const MON = ['OMAKASE', 'WHALE', 'CATS', 'UNICORN', 'CALLME'];
const Montage = () => {
  const f = useCurrentFrame();
  const L = 24;
  const i = Math.min(MON.length - 1, Math.floor(f / L));
  const k = f - i * L;
  const dir = i % 2 ? -1 : 1;
  const inP = r(k, 0, 9, Easing.bezier(0.2, 0.9, 0.3, 1));
  const x = (1 - inP) * 1300 * dir;
  const vel = Math.abs(interpolate(k, [0, 2, 9], [0, 60, 0], cl));
  const s = pop(k, 6, 8, 340);
  const [sx, sy] = shake(k, 8, 12, 10);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Bg />
      <div style={{ position: 'absolute', top: 60, width: '100%' }}><T size={80} color={C.sun}>clip → coin</T></div>
      <HBlur id={'m' + i} amt={vel} style={{ transform: `translate(${x + sx}px, ${sy + 30}px) rotate(${dir * (1 - inP) * 8}deg) scale(${0.92 + 0.08 * s})` }}>
        <Card t={MON[i]} w={520} acc={ACC[i % 4]} flash={interpolate(k, [6, 12], [0.6, 0], cl)} />
      </HBlur>
      <div style={{ position: 'absolute', bottom: 50, display: 'flex', gap: 14 }}>
        {MON.map((_, j) => <div key={j} style={{ width: 60, height: 10, background: j <= i ? C.pink : C.line }} />)}
      </div>
    </AbsoluteFill>
  );
};

// 420-530 WALL: 21 live coins
const Wall = () => {
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  const cam = interpolate(f, [0, 70], [2.6, 1], { ...cl, easing: Easing.bezier(0.5, 0, 0.1, 1) });
  const cell = 200;
  const rows = height > 1100 ? 5 : 4;
  const cols = Math.ceil(21 / rows);
  const tiles = [...ALL, ...ALL].slice(0, rows * cols + cols);
  const lab = pop(f, 38, 9, 240);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <Bg />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: 16, transform: `scale(${cam}) rotate(-5deg)` }}>
        {tiles.map((t, i) => (
          <div key={i} style={{ width: cell, background: C.deck, border: `4px solid ${C.ink}`, boxShadow: `6px 6px 0 ${ACC[i % 4]}` }}>
            <div style={{ width: '100%', aspectRatio: '1', position: 'relative', overflow: 'hidden' }}>{Math.abs(i - Math.floor(tiles.length / 2)) < 30 ? <Clip t={t} /> : null}</div>
            <div style={{ fontFamily: B, fontSize: 22, color: '#fff', padding: '4px 8px', whiteSpace: 'nowrap', overflow: 'hidden' }}>${t}</div>
          </div>))}
      </div>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', background: `rgba(20,18,58,${r(f, 34, 50) * 0.5})` }}>
        <div style={{ transform: `scale(${lab})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <T size={150} color={C.mint}>21 coins</T>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}><Img src={staticFile('pumpfun.png')} style={{ width: 70, height: 70 }} /><T size={60}>live on pump.fun</T></div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 530-690 PASTE: logos + prefix trick
const Paste = () => {
  const f = useCurrentFrame();
  const link = 'tiktok.com/@roodabeguh/video/75…';
  const n = Math.floor(interpolate(f, [14, 50], [0, link.length], cl));
  const pre = 'getclip.fun/';
  const pn = Math.floor(interpolate(f, [70, 100], [0, pre.length], cl));
  const box = pop(f, 0, 10, 260);
  const zoom = interpolate(f, [60, 80], [1, 1.12], { ...cl, easing: outExpo });
  const enter = pop(f, 112, 7, 320);
  const [sx, sy] = shake(f, 112, 14, 12);
  const icons: [string, string, string][] = [['tiktok', C.pink, 'TIKTOK'], ['instagram', C.sun, 'REELS'], ['x', C.sky, 'X']];
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `translate(${sx}px,${sy}px)` }}>
      <Bg />
      <div style={{ position: 'absolute', top: 90, width: '100%' }}><T size={84} color={C.sun}>{f < 64 ? 'paste any clip' : 'or just add this'}</T></div>
      <div style={{ display: 'flex', gap: 46, marginBottom: 70, marginTop: 40 }}>
        {icons.map(([n2, c, lb], i) => { const p = pop(f, 2 + i * 4, 8, 300); return (
          <div key={n2} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, transform: `scale(${p}) translateY(${(1 - p) * 80}px) rotate(${(1 - p) * (i - 1) * 20}deg)` }}>
            <div style={{ width: 150, height: 150, background: C.deck, border: `5px solid ${C.ink}`, boxShadow: `9px 9px 0 ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Logo n={n2} s={84} /></div>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 24, letterSpacing: '.14em', color: C.haze }}>{lb}</div>
          </div>); })}
      </div>
      <div style={{ transform: `scale(${box * zoom})`, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 900, height: 120, background: C.deck, border: `5px solid ${C.ink}`, boxShadow: `12px 12px 0 ${C.pink}`, display: 'flex', alignItems: 'center', padding: '0 28px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <span style={{ fontFamily: B, fontSize: 36, color: C.ink, background: pn ? C.mint : 'transparent', padding: pn ? '2px 6px' : 0 }}>{pre.slice(0, pn)}</span>
          <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 34, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, marginLeft: pn ? 8 : 0 }}>{link.slice(0, n)}</span>
          <span style={{ opacity: Math.floor(f / 10) % 2 ? 1 : 0, color: C.sky, fontFamily: INTER, fontSize: 42 }}>|</span>
        </div>
      </div>
      <div style={{ marginTop: 70, transform: `scale(${enter})`, background: C.pink, color: '#fff', fontFamily: B, fontSize: 56, padding: '14px 40px', border: `5px solid ${C.ink}`, boxShadow: `8px 8px 0 ${C.ink}` }}>→ COIN IN SECONDS</div>
    </AbsoluteFill>
  );
};

// 690-930 END
const End = () => {
  const f = useCurrentFrame();
  const a = pop(f, 0, 9, 220), b = pop(f, 14, 9), c = pop(f, 26, 9), d = pop(f, 38, 9);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `scale(${1.03 - Math.min(f, 120) * 0.00025})` }}>
      <Bg />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
        <Img src={staticFile('logo-wordmark.png')} style={{ width: 700, transform: `scale(${a}) rotate(${(1 - a) * -10}deg)` }} />
        <T size={66} style={{ transform: `scale(${b})` }}>any viral clip <span style={{ color: C.sun }}>→</span><br />a <span style={{ color: C.mint }}>pump.fun</span> coin</T>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, letterSpacing: '.12em', color: C.pink, transform: `scale(${c})` }}>FREE. NO WALLET.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, transform: `scale(${d})`, marginTop: 10 }}>
          <T size={64} color={C.sky}>getclip.fun</T><T size={64} color={C.sun}>$CLIP</T>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const LaunchV2 = () => (
  <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
    <Sequence durationInFrames={130}><Hook /></Sequence>
    <Sequence from={130} durationInFrames={170}><Transform /></Sequence>
    <Sequence from={300} durationInFrames={120}><Montage /></Sequence>
    <Sequence from={420} durationInFrames={110}><Wall /></Sequence>
    <Sequence from={530} durationInFrames={160}><Paste /></Sequence>
    <Sequence from={690}><End /></Sequence>
    <Grain />
  </AbsoluteFill>
);
export const V2Comps = () => (<>
  <Composition id="LaunchV2" component={LaunchV2} durationInFrames={930} fps={60} width={1080} height={1080} />
  <Composition id="LaunchV2x45" component={LaunchV2} durationInFrames={930} fps={60} width={1080} height={1350} />
</>);

// ===== LIVE V1 (8s, no ticker) =====
const LiveWall = () => {
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  const cam = interpolate(f, [0, 150], [1.0, 1.9], { ...cl, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const cell = 200, rows = height > 1100 ? 8 : 7, cols = 7;
  const tiles = Array.from({ length: rows * cols }, (_, i) => ALL[(i * 5) % ALL.length]);
  const S = 34;
  const slam = pop(f, S, 7, 320);
  const flash = f >= S ? interpolate(f, [S, S + 10], [0.85, 0], cl) : 0;
  const [sx, sy] = shake(f, S, 28, 18);
  const ring = r(f, S, S + 34);
  const dim = r(f, S - 4, S + 6);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', overflow: 'hidden', transform: `translate(${sx}px,${sy}px)` }}>
      <Bg />
      <div style={{ position: 'absolute', display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: 16, transform: `scale(${cam}) rotate(-5deg)` }}>
        {tiles.map((t, i) => (
          <div key={i} style={{ width: cell, height: cell, border: `4px solid ${C.ink}`, boxShadow: `6px 6px 0 ${ACC[i % 4]}`, overflow: 'hidden', position: 'relative' }}><Clip t={t} rate={1 + (i % 3) * 0.1} /></div>))}
      </div>
      <AbsoluteFill style={{ background: `rgba(20,18,58,${dim * 0.6})` }} />
      <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', border: `${26 * (1 - ring)}px solid ${C.sun}`, transform: `scale(${0.4 + ring * 1.6})`, opacity: f >= S ? 1 - ring : 0 }} />
      <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', border: `${16 * (1 - ring)}px solid ${C.pink}`, transform: `scale(${0.3 + ring * 1.1})`, opacity: f >= S ? 1 - ring : 0 }} />
      <div style={{ position: 'absolute', opacity: f >= S ? 1 : 0, transform: `scale(${2.2 - 1.2 * slam}) rotate(${(1 - slam) * 8 - 3}deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <T size={200} color={C.pink}>CLIP</T>
        <T size={200} color={C.sun}>IS LIVE</T>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 30, opacity: r(f, S + 20, S + 34) }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.mint, boxShadow: `0 0 ${20 + 18 * Math.sin(f / 6)}px ${C.mint}`, transform: `scale(${1 + 0.15 * Math.sin(f / 6)})` }} />
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 34, letterSpacing: '.16em', color: '#fff' }}>LIVE NOW</div>
        </div>
      </div>
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
    </AbsoluteFill>
  );
};
const LiveSnap = () => {
  const f = useCurrentFrame();
  const shrink = r(f, 0, 22, Easing.bezier(0.65, -0.25, 0.25, 1.15));
  const size = interpolate(shrink, [0, 1], [1400, 560]);
  const S = 36, p = pop(f, S, 7, 300);
  const [sx, sy] = shake(f, S, 22, 14);
  const ring = r(f, S, S + 30);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `translate(${sx}px,${sy}px)` }}>
      <Bg />
      {f < S ? (
        <div style={{ width: size, height: size, overflow: 'hidden', border: shrink > 0.5 ? `6px solid ${C.ink}` : 'none', outline: `4px solid rgba(255,204,0,${shrink})` }}><Clip t="WHALE" /></div>
      ) : (
        <div style={{ transform: `scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * 6 - 2}deg)`, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 700, height: 700, marginLeft: -350, marginTop: -350, borderRadius: '50%', border: `${20 * (1 - ring)}px solid ${C.mint}`, transform: `scale(${0.6 + ring * 1.4})`, opacity: 1 - ring }} />
          <Card t="WHALE" w={560} acc={C.pink} flash={interpolate(f, [S, S + 10], [0.9, 0], cl)} />
          <div style={{ position: 'absolute', top: -46, right: -70, transform: `rotate(12deg) scale(${pop(f, S + 10, 8, 300)})`, background: C.mint, color: C.ink, fontFamily: B, fontSize: 52, padding: '8px 22px', border: `5px solid ${C.ink}` }}>MINTED</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
const LiveEnd = () => {
  const f = useCurrentFrame();
  const a = pop(f, 0, 9, 260), b = pop(f, 8, 9, 260), c = pop(f, 16, 9, 260);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Bg />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44 }}>
        <Img src={staticFile('logo-wordmark.png')} style={{ width: 720, transform: `scale(${a})` }} />
        <T size={70} style={{ transform: `scale(${b})` }}>any viral clip <span style={{ color: C.sun }}>→</span><br />a <span style={{ color: C.mint }}>pump.fun</span> coin</T>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, transform: `scale(${c})` }}>
          <Img src={staticFile('pumpfun.png')} style={{ width: 64, height: 64 }} />
          <T size={72} color={C.sky}>getclip.fun</T>
        </div>
      </div>
    </AbsoluteFill>
  );
};
export const LiveV1 = () => (
  <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
    <Sequence durationInFrames={150}><LiveWall /></Sequence>
    <Sequence from={150} durationInFrames={120}><LiveSnap /></Sequence>
    <Sequence from={270}><LiveEnd /></Sequence>
    <Grain />
  </AbsoluteFill>
);
export const LiveComps = () => (<>
  <Composition id="LiveV1" component={LiveV1} durationInFrames={480} fps={60} width={1080} height={1350} />
  <Composition id="LiveV1x11" component={LiveV1} durationInFrames={480} fps={60} width={1080} height={1080} />
</>);
