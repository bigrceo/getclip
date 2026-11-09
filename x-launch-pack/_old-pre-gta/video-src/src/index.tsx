import React from 'react';
import { AbsoluteFill, Composition, Easing, Img, interpolate, registerRoot, spring, staticFile, useCurrentFrame, Sequence, continueRender, delayRender } from 'remotion';
import { V2Comps, LiveComps } from "./v2";
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

const INTER = loadInter('normal', { weights: ['500', '600', '700', '800'], subsets: ['latin'] }).fontFamily;
const h = delayRender('bungee');
new FontFace('Bungee', `url(${staticFile('Bungee-Regular.ttf')})`).load().then((f) => { document.fonts.add(f); continueRender(h); });
const B = 'Bungee';
const C = { night: '#14123a', deck: '#1c1a4d', hi: '#26235f', line: '#322e78', haze: '#a7a3e0', pink: '#ff3399', sun: '#ffcc00', sky: '#00ccff', mint: '#66ff99', ink: '#0b0a24' };
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const anticip = Easing.bezier(0.6, -0.35, 0.35, 1.3);
const r = (f: number, a: number, b: number, e = outExpo) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });
const pop = (f: number, s: number, d = 10, st = 180) => spring({ frame: f - s, fps: 60, config: { damping: d, stiffness: st, mass: 0.8 } });
const TICK = ['HENRY', 'OMAKASE', 'GOATS', 'WHALE', 'MESSI', 'OTTER', 'PUPS', 'GLASS', 'HUG', 'CATS', 'COLD', 'UNICORN', 'ALBINO', 'HYDRATE', 'BESTIES', 'QUIET', 'CANCEL', 'ALONE', 'PICCOLO', 'CALLME', 'WOLVERINE'];

const Logo = ({ n, s, fill = '#fff' }: { n: string; s: number; fill?: string }) => (
  <div style={{ width: s, height: s, background: fill, WebkitMaskImage: `url(${staticFile(n + '.svg')})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
);
const Sol = ({ s }: { s: number }) => (
  <svg width={s} height={s * 0.78} viewBox="0 0 398 311"><defs><linearGradient id="sg" x1="360" y1="-37" x2="141" y2="383" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3" /><stop offset="1" stopColor="#DC1FFF" /></linearGradient></defs>
    <path fill="url(#sg)" d="M64.6 237.9a14.5 14.5 0 0 1 10.3-4.3h317.4c6.5 0 9.7 7.8 5.1 12.4l-62.7 62.7a14.5 14.5 0 0 1-10.3 4.3H7.1c-6.5 0-9.7-7.8-5.1-12.4l62.6-62.7zM64.6 3.8A15 15 0 0 1 74.9-.5h317.4c6.5 0 9.7 7.8 5.1 12.4l-62.7 62.7a14.5 14.5 0 0 1-10.3 4.3H7.1C.6 78.9-2.6 71.1 2 66.5L64.6 3.8zM333.1 120.1a14.5 14.5 0 0 0-10.3-4.3H5.4c-6.5 0-9.7 7.8-5.1 12.4l62.7 62.7a14.5 14.5 0 0 0 10.3 4.3h317.4c6.5 0 9.7-7.8 5.1-12.4l-62.7-62.7z" /></svg>
);
const Clip = ({ t, s, style }: { t: string; s: number; style?: React.CSSProperties }) => (
  <div style={{ width: s, height: s, border: `5px solid ${C.ink}`, overflow: 'hidden', background: C.deck, ...style }}>
    <Img src={staticFile(`clips/${t}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </div>
);
const Bg = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.line} 2px, transparent 2.4px)`, backgroundSize: '18px 18px', opacity: 0.6, transform: `translateY(${(f * 0.3) % 18}px)` }} />
      <div style={{ position: 'absolute', width: 900, height: 900, borderRadius: '50%', left: 90 + Math.sin(f / 90) * 80, top: 90 + Math.cos(f / 110) * 60, background: C.pink, filter: 'blur(220px)', opacity: 0.22 }} />
      <AbsoluteFill style={{ opacity: 0.07, backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence baseFrequency=%22.9%22/></filter><rect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22/></svg>")', backgroundPosition: `${(f * 37) % 200}px ${(f * 53) % 200}px` }} />
    </AbsoluteFill>
  );
};
const Big = ({ children, size = 150, color = '#fff', style }: { children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }) => (
  <div style={{ fontFamily: B, fontSize: size, lineHeight: 0.95, color, textShadow: `8px 8px 0 ${C.ink}`, textAlign: 'center', ...style }}>{children}</div>
);
const Cap = ({ f, at, children, color = C.sun }: { f: number; at: number; children: React.ReactNode; color?: string }) => {
  const p = r(f, at, at + 18);
  return <div style={{ position: 'absolute', top: 90, width: '100%', textAlign: 'center', fontFamily: B, fontSize: 70, color, textShadow: `6px 6px 0 ${C.ink}`, clipPath: `inset(0 ${100 - p * 100}% 0 0)`, transform: `translateY(${(1 - p) * 30}px)` }}>{children}</div>;
};

// 0-120 HOOK
const Hook = () => {
  const f = useCurrentFrame();
  const w1 = pop(f, 0, 9, 220), w2 = pop(f, 46, 9, 220);
  const out = r(f, 108, 120, Easing.in(Easing.cubic));
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `scale(${1 + f * 0.0012 + out * 0.6})`, opacity: 1 - out }}>
      <Big size={210} style={{ transform: `scale(${w1}) rotate(${(1 - w1) * -12}deg)` }}>that<br />clip?</Big>
      <Big size={170} color={C.pink} style={{ transform: `translateY(${(1 - w2) * 200}px) scale(${0.6 + 0.4 * w2})`, opacity: w2, marginTop: 30 }}>it's a<br /><span style={{ color: C.sun }}>coin.</span></Big>
    </AbsoluteFill>
  );
};

// 120-300 SETUP: paste link + prefix trick
const Setup = () => {
  const f = useCurrentFrame();
  const link = 'tiktok.com/@henry/video/7694…';
  const n = Math.floor(interpolate(f, [20, 80], [0, link.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const pre = r(f, 100, 125, anticip);
  const icons = [['tiktok', C.pink], ['instagram', C.sun], ['x', C.sky]];
  const box = pop(f, 6);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `scale(${1.04 - f * 0.0002})` }}>
      <Cap f={f} at={0}>paste any clip</Cap>
      <div style={{ display: 'flex', gap: 50, marginBottom: 70 }}>
        {icons.map(([n2, c], i) => { const p = pop(f, 8 + i * 6); return (
          <div key={n2} style={{ width: 150, height: 150, background: C.deck, border: `5px solid ${C.ink}`, boxShadow: `10px 10px 0 ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p}) translateY(${(1 - p) * 60}px)` }}><Logo n={n2} s={86} /></div>); })}
      </div>
      <div style={{ width: 920, height: 140, background: C.deck, border: `5px solid ${C.ink}`, boxShadow: `12px 12px 0 ${C.pink}`, display: 'flex', alignItems: 'center', padding: '0 34px', transform: `scale(${box})`, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: B, fontSize: 46, color: C.pink, maxWidth: pre * 420, overflow: 'hidden', display: 'inline-block' }}>getclip.fun/</span>
        <span style={{ fontFamily: INTER, fontWeight: 600, fontSize: 42, color: '#fff' }}>{link.slice(0, n)}<span style={{ opacity: Math.floor(f / 15) % 2 ? 1 : 0, color: C.sky }}>|</span></span>
      </div>
      <div style={{ marginTop: 60, fontFamily: INTER, fontWeight: 700, fontSize: 34, letterSpacing: '.12em', color: C.haze, opacity: r(f, 120, 140) }}>OR PUT GETCLIP.FUN/ IN FRONT</div>
    </AbsoluteFill>
  );
};

// 300-420 crop
const Crop = () => {
  const f = useCurrentFrame();
  const enter = pop(f, 0, 12);
  const sq = interpolate(r(f, 20, 70), [0, 1], [640, 520]);
  const scrub = r(f, 40, 110, Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Cap f={f} at={0}>crop the loop</Cap>
      <div style={{ position: 'relative', width: 640, height: 640, marginTop: 60, transform: `scale(${enter}) rotate(${(1 - enter) * 8}deg)` }}>
        <Clip t="HENRY" s={640} style={{ filter: 'brightness(.55)' }} />
        <div style={{ position: 'absolute', left: (640 - sq) / 2, top: (640 - sq) / 2, width: sq, height: sq, overflow: 'hidden', border: `6px solid ${C.sun}`, boxShadow: `0 0 60px ${C.sun}88` }}>
          <Img src={staticFile('clips/HENRY.jpg')} style={{ position: 'absolute', left: -(640 - sq) / 2, top: -(640 - sq) / 2, width: 640, height: 640, objectFit: 'cover' }} />
        </div>
      </div>
      <div style={{ position: 'relative', width: 640, height: 26, background: C.deck, border: `4px solid ${C.ink}`, marginTop: 40 }}>
        <div style={{ position: 'absolute', left: `${10 + scrub * 50}%`, width: '28%', top: 0, bottom: 0, background: C.pink }} />
      </div>
    </AbsoluteFill>
  );
};

// 420-540 we pay
const Pay = () => {
  const f = useCurrentFrame();
  const v = interpolate(r(f, 10, 60), [0, 1], [0, 0.006]);
  const strike = r(f, 70, 90);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Cap f={f} at={0}>we pay the launch</Cap>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30, transform: `scale(${pop(f, 2)})`, marginTop: 40 }}>
        <Sol s={130} /><Big size={120}>~{v.toFixed(3)}</Big>
      </div>
      <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 40, color: C.haze, letterSpacing: '.1em', marginTop: 20 }}>SOL · PAID BY CLIP</div>
      <div style={{ position: 'relative', marginTop: 80, transform: `scale(${pop(f, 56)})` }}>
        <Big size={110} color={C.mint}>no wallet</Big>
        <div style={{ position: 'absolute', left: -20, top: '45%', height: 14, width: `${strike * 0}%`, background: C.pink }} />
      </div>
    </AbsoluteFill>
  );
};

// 540-660 mint ends in clip
const Mint = () => {
  const f = useCurrentFrame();
  const real = '241N8v2ZxHri4ML9BBDy4WUSK1oYJdwJJDgWRfQkcLiP';
  const ch = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const settle = r(f, 10, 70, Easing.out(Easing.cubic));
  const shown = real.split('').map((c, i) => (i / real.length < settle ? c : ch[(i * 7 + f * 3) % ch.length])).join('');
  const lit = r(f, 72, 86);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Cap f={f} at={0}>mint ends in clip</Cap>
      <div style={{ width: 940, background: C.deck, border: `5px solid ${C.ink}`, boxShadow: `12px 12px 0 ${C.sky}`, padding: '40px 40px', fontFamily: INTER, fontWeight: 700, fontSize: 40, color: C.haze, wordBreak: 'break-all', lineHeight: 1.3, transform: `scale(${pop(f, 0)})` }}>
        {shown.slice(0, -4)}<span style={{ color: lit ? C.pink : C.haze, fontSize: 40 + lit * 30, textShadow: `0 0 ${lit * 30}px ${C.pink}` }}>{shown.slice(-4)}</span>
      </div>
      <div style={{ marginTop: 60, display: 'flex', alignItems: 'center', gap: 20, opacity: r(f, 80, 100), fontFamily: INTER, fontWeight: 700, fontSize: 40, color: '#fff' }}>
        <Img src={staticFile('pumpfun.png')} style={{ width: 64, height: 64 }} /> one transaction on pump.fun
      </div>
    </AbsoluteFill>
  );
};

// 660-780 PAYOFF: wall of real coins
const Payoff = () => {
  const f = useCurrentFrame();
  const cam = interpolate(f, [0, 120], [1.25, 1], { easing: outExpo });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 190px)', gap: 22, transform: `scale(${cam}) rotate(-6deg)` }}>
        {[...TICK, ...TICK.slice(0, 4)].map((t, i) => { const p = pop(f, Math.abs(12 - i) * 2.2, 11, 200); return (
          <div key={i} style={{ transform: `scale(${p})`, boxShadow: `8px 8px 0 ${[C.pink, C.sun, C.sky, C.mint][i % 4]}`, background: C.deck }}>
            <Clip t={t} s={190} /><div style={{ fontFamily: B, fontSize: 24, color: '#fff', padding: '6px 10px' }}>${t.length > 8 ? t.slice(0, 7) : t}</div></div>); })}
      </div>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', background: `rgba(20,18,58,${r(f, 40, 60) * 0.55})` }}>
        <div style={{ transform: `scale(${pop(f, 44, 8, 200)})`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Img src={staticFile('pumpfun.png')} style={{ width: 150, height: 150 }} />
          <Big size={130} color={C.mint} style={{ marginTop: 20 }}>live on<br />pump.fun</Big>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 780-900 END CARD
const End = () => {
  const f = useCurrentFrame();
  const a = pop(f, 0, 10), b = pop(f, 14), c = r(f, 26, 46);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Img src={staticFile('logo-wordmark.png')} style={{ width: 760, transform: `scale(${a}) rotate(${(1 - a) * -10}deg)` }} />
      <Big size={120} color={C.sun} style={{ marginTop: 40, transform: `scale(${b})` }}>$CLIP</Big>
      <div style={{ marginTop: 40, fontFamily: INTER, fontWeight: 700, fontSize: 42, color: '#fff', opacity: c, transform: `translateY(${(1 - c) * 20}px)` }}>any viral clip becomes a coin.</div>
      <div style={{ marginTop: 26, display: 'flex', gap: 26, alignItems: 'center', opacity: c }}>
        <Logo n="tiktok" s={46} /><Logo n="instagram" s={46} /><Logo n="x" s={46} /><span style={{ fontFamily: B, fontSize: 46, color: C.sky, marginLeft: 10 }}>getclip.fun</span>
      </div>
    </AbsoluteFill>
  );
};

const Wipe = ({ at }: { at: number }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at - 8, at, at + 8], [-120, 0, 120], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (f < at - 8 || f > at + 8) return null;
  return <AbsoluteFill style={{ background: C.pink, transform: `translateX(${p}%) skewX(-12deg)` }} />;
};

const Video = () => (
  <AbsoluteFill>
    <Bg />
    <Sequence durationInFrames={120}><Hook /></Sequence>
    <Sequence from={120} durationInFrames={180}><Setup /></Sequence>
    <Sequence from={300} durationInFrames={120}><Crop /></Sequence>
    <Sequence from={420} durationInFrames={120}><Pay /></Sequence>
    <Sequence from={540} durationInFrames={120}><Mint /></Sequence>
    <Sequence from={660} durationInFrames={120}><Payoff /></Sequence>
    <Sequence from={780} durationInFrames={120}><End /></Sequence>
    {[300, 420, 540, 660, 780].map((a) => <Wipe key={a} at={a} />)}
  </AbsoluteFill>
);

registerRoot(() => <><Composition id="HowItWorks" component={Video} durationInFrames={900} fps={60} width={1080} height={1080} /><V2Comps /><LiveComps /></>);
