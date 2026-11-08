"use client";
/**
 * Port of the JS Mastery "GTA VI landing" scroll experience (Hero → Coming soon → FirstVideo → Jason → SecondVideo →
 * Lucia → PostCard → Final → Outro), same sections, same pins, same overlaps and the same scroll-scrubbed videos, but
 * built on plain scroll progress instead of GSAP, in our brand. Media are slots under /public/intro (see README there);
 * a missing still shows a sunset panel, a missing clip shows a still gradient, so the flow never breaks.
 */
import { useEffect, useRef, useState, type RefObject } from "react";
import { BRAND } from "@/lib/brand";
import { Countdown } from "./Countdown";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
/** ScrollTrigger-like progress: 0 when `startEl` top reaches `startAt` (fraction of viewport), 1 when `endAt`. */
function prog(r: DOMRect, startAt: number, endAt: number, span = r.height) {
  const vh = window.innerHeight; const s = vh * startAt, e = vh * endAt;
  return clamp01((s - r.top) / Math.max(1, span + s - e));
}
function useExists(paths: string[]) {
  const [has, setHas] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let alive = true;
    Promise.all(paths.map((p) => fetch(p, { method: "HEAD" }).then((r) => [p, r.ok] as const).catch(() => [p, false] as const)))
      .then((rows) => { if (alive) setHas(Object.fromEntries(rows)); });
    return () => { alive = false; };
  }, [paths.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  return has;
}
function Scrub({ src, vref, className, style }: { src: string; vref: RefObject<HTMLVideoElement | null>; className?: string; style?: React.CSSProperties }) {
  return <video ref={vref} muted playsInline preload="auto" src={src} className={className} style={style} />;
}
function scrub(el: HTMLVideoElement | null, t: number) {
  if (!el || !el.duration) return;
  const target = inOut(clamp01(t)) * el.duration;
  if (Math.abs(el.currentTime - target) > 1 / 60) el.currentTime = target;
}
function Still({ src, ok, pos, className }: { src: string; ok?: boolean; pos: string; className: string }) {
  return (
    <div className={`bg-[#fff9cb] -translate-x-5 ${className}`}>
      {ok ? <img src={src} alt="" className="size-full object-cover transition duration-700 ease-in-out hover:scale-[0.98]" style={{ objectPosition: pos }} />
        : <div className="size-full" style={{ background: "linear-gradient(170deg, #2b0f55, #6a1d8f 40%, #d6298b 70%, #ff8c46)" }} />}
    </div>
  );
}

const MEDIA = ["/intro/hero-bg.webp", "/intro/scrub1.mp4", "/intro/scrub2.mp4", "/intro/scrub3.mp4", "/intro/postcard.mp4", "/intro/overlay.webp",
  "/intro/jason-1.webp", "/intro/jason-2.webp", "/intro/jason-3.webp", "/intro/lucia-1.webp", "/intro/lucia-2.webp", "/intro/lucia-3.webp"];

export function Landing() {
  const has = useExists(MEDIA);
  const hero = useRef<HTMLElement>(null), heroStage = useRef<HTMLDivElement>(null);
  const v1sec = useRef<HTMLElement>(null), v1 = useRef<HTMLVideoElement>(null), v1stage = useRef<HTMLDivElement>(null);
  const jason = useRef<HTMLElement>(null), jasonBox = useRef<HTMLDivElement>(null);
  const v2sec = useRef<HTMLElement>(null), v2 = useRef<HTMLVideoElement>(null), v2stage = useRef<HTMLDivElement>(null);
  const lucia = useRef<HTMLElement>(null), luciaBox = useRef<HTMLDivElement>(null);
  const post = useRef<HTMLElement>(null), vp = useRef<HTMLVideoElement>(null);
  const fin = useRef<HTMLElement>(null), v3 = useRef<HTMLVideoElement>(null), finContent = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLElement>(null), outroMsg = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const apply = () => {
      raf = 0;
      const small = window.innerWidth < 769, vh = window.innerHeight;
      // ---- Hero: pinned 200 %. fade-out → scale 1.25→1 + mask 3500%→20% → mask-wrapper opacity 0 → entrance message wipes in
      if (hero.current && heroStage.current) {
        const r = hero.current.getBoundingClientRect(); const p = clamp01(-r.top / Math.max(1, r.height - vh));
        const s = heroStage.current.style;
        const a = inOut(clamp01(p / 0.2)), b = inOut(clamp01((p - 0.2) / 0.35)), c = inOut(clamp01((p - 0.55) / 0.2)), d = inOut(clamp01((p - 0.6) / 0.4));
        s.setProperty("--fadeOut", (1 - a).toFixed(3));
        s.setProperty("--scale", (1.25 - 0.25 * b).toFixed(4));
        const maskFrom = small ? 3100 : 3500, maskTo = small ? 50 : 20;
        s.setProperty("--mask", `${(maskFrom - (maskFrom - maskTo) * b).toFixed(1)}%`);
        // the mask starts centred on the solid part of the C (so the whole viewport shows the picture) and ends centred
        s.setProperty("--mx", `${(19.6 + (50 - 19.6) * b).toFixed(2)}%`); s.setProperty("--my", `${(56.5 + (26 - 56.5) * b).toFixed(2)}%`);
        s.setProperty("--maskOpacity", (1 - c).toFixed(3));
        s.setProperty("--entrance", `${(d * 100).toFixed(1)}%`); // radial wipe radius
      }
      // ---- FirstVideo: overlaps the hero (-150vh), pinned 200 %: hero fades, clip fades in and scrubs
      if (v1sec.current && v1stage.current) {
        const r = v1sec.current.getBoundingClientRect(); const q = clamp01(-r.top / Math.max(1, r.height - vh));
        heroStage.current?.style.setProperty("--heroOpacity", (1 - inOut(clamp01((q - 0.1) / 0.3))).toFixed(3));
        v1stage.current.style.setProperty("--vid", inOut(clamp01(q / 0.4)).toFixed(3));
        scrub(v1.current, (q - 0.05) / 0.9);
      }
      // ---- Jason: -80vh overlap; the clip fades out as Jason arrives; the image column drifts up 300 px
      if (jason.current) {
        const r = jason.current.getBoundingClientRect();
        const f = prog(r, 0.9, 0.5, r.height * 0.1);
        v1stage.current?.style.setProperty("--vidOut", (1 - inOut(f)).toFixed(3));
        const y = prog(r, 0.5, 0.5, r.height * 0.8);
        if (jasonBox.current) jasonBox.current.style.transform = `translate3d(0, ${(-300 * inOut(y)).toFixed(1)}px, 0)`;
      }
      // ---- SecondVideo: -60vh overlap, pinned over its own height: fades in and scrubs
      if (v2sec.current && v2stage.current) {
        const r = v2sec.current.getBoundingClientRect(); const q = clamp01(-r.top / Math.max(1, r.height - vh));
        v2stage.current.style.setProperty("--vid", inOut(clamp01(q / 0.35)).toFixed(3));
        scrub(v2.current, q);
      }
      // ---- Lucia: -80vh overlap; the second clip fades; images drift up 200 px
      if (lucia.current) {
        const r = lucia.current.getBoundingClientRect();
        const f = prog(r, 0.8, 0.5, r.height * 0.1);
        v2stage.current?.style.setProperty("--vidOut", (1 - inOut(f)).toFixed(3));
        const y = prog(r, 0.5, 0.5, r.height * 0.8);
        if (luciaBox.current) luciaBox.current.style.transform = `translate3d(0, ${(-200 * inOut(y)).toFixed(1)}px, 0)`;
      }
      // ---- PostCard: scrub while it crosses the centre
      if (post.current) { const r = post.current.getBoundingClientRect(); scrub(vp.current, prog(r, 0.5, 0.5)); }
      // ---- Final: pinned 90 %; content fades/scales in and scrubs
      if (fin.current && finContent.current) {
        const r = fin.current.getBoundingClientRect(); const q = clamp01((vh * 0.8 - r.top) / Math.max(1, r.height * 0.9 + vh * 0.8));
        finContent.current.style.setProperty("--fin", inOut(clamp01(q / 0.5)).toFixed(3));
        scrub(v3.current, q);
      }
      // ---- Outro: -100vh overlap; final fades out, message fades in
      if (outro.current && outroMsg.current) {
        const r = outro.current.getBoundingClientRect(); const q = clamp01((vh * 0.3 - r.top) / (vh * 0.2));
        finContent.current?.style.setProperty("--finOut", (1 - inOut(clamp01(q * 2))).toFixed(3));
        outroMsg.current.style.opacity = inOut(clamp01(q * 2 - 1)).toFixed(3);
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply(); window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll);
    const vids = [v1.current, v2.current, v3.current, vp.current]; vids.forEach((v) => v?.addEventListener("loadedmetadata", onScroll));
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); vids.forEach((v) => v?.removeEventListener("loadedmetadata", onScroll)); if (raf) cancelAnimationFrame(raf); };
  }, [has]);

  const title = (
    <h3 className="gradient-title">GTA VI hits<br />{BRAND.state}<br />in</h3>
  );
  return (
    <div className="landing">
      {/* 1. Hero + Coming soon (pinned 200 %) */}
      <section ref={hero} className="relative h-[300svh]" aria-label="Opening">
        <div ref={heroStage} className="landing-hero sticky top-0 h-[100svh] w-full overflow-hidden">
          <div className="landing-mask absolute inset-0">
            {has["/intro/hero-bg.webp"] ? <img src="/intro/hero-bg.webp" alt="" className="landing-bg absolute inset-0 h-full w-full object-cover" />
              : <div className="landing-bg absolute inset-0" style={{ background: "linear-gradient(170deg, #2b0f55, #6a1d8f 40%, #d6298b 70%, #ff8c46)" }} />}
            <img src="/brand/logo-1024.png" alt="" className="landing-fade absolute left-1/2 top-[18vh] w-[220px] -translate-x-1/2 max-md:w-[160px]" />
            <div className="landing-fade absolute left-1/2 top-1/2 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white max-md:size-20"><span className="ml-1 text-3xl text-[#1a0b26]">▶</span></div>
            <span className="landing-fade absolute bottom-6 left-1/2 -translate-x-1/2 text-[12px] font-semibold uppercase tracking-[.2em] text-white/80">Watch the trailer</span>
          </div>
          <div className="landing-entrance absolute inset-0 z-20 flex flex-col items-center justify-center gap-10">
            <img src="/brand/logo-1024.png" alt="" className="w-[220px] max-md:w-[160px]" />
            {title}
            <Countdown to={BRAND.releaseAt} />
          </div>
        </div>
      </section>

      {/* 2. First video (pinned 200 %, overlaps the hero by 150vh) */}
      <section ref={v1sec} className="relative -mt-[150svh] h-[300svh]" aria-label="Trailer">
        <div ref={v1stage} className="landing-vid sticky top-0 h-[100svh] overflow-hidden">
          {has["/intro/scrub1.mp4"] ? <Scrub src="/intro/scrub1.mp4" vref={v1} className="h-full w-full object-cover [object-position:75%_center] md:[object-position:50%_center]" />
            : <div className="h-full w-full" style={{ background: "radial-gradient(80% 60% at 50% 60%, #d6298b33, transparent), #120a24" }} />}
        </div>
      </section>

      {/* 3. Jason (overlaps -80vh) */}
      <section ref={jason} className="landing-person relative z-10 -mt-[80svh] flex w-full flex-col justify-between gap-5 overflow-x-hidden py-40 ps-10 lg:flex-row lg:ps-40 2xl:ps-80" style={{ marginTop: "calc(-80svh + 15rem)" }}>
        <div className="person-content max-w-lg">
          <h1>Jason Duval</h1>
          <h2>Jason wants an easy life, but things just keep getting harder.</h2>
          <p>Jason grew up around grifters and crooks. After a stint in the Army trying to shake off his troubled teens, he found himself in the Keys doing what he knows best, working for local drug runners. It might be time to try something new.</p>
          <Still src="/intro/jason-2.webp" ok={has["/intro/jason-2.webp"]} pos="80% center" className="mt-20 h-[90vh] w-auto md:mt-36" />
        </div>
        <div ref={jasonBox} className="mt-96 space-y-5">
          <Still src="/intro/jason-1.webp" ok={has["/intro/jason-1.webp"]} pos="5% center" className="w-auto lg:h-[80vh]" />
          <Still src="/intro/jason-3.webp" ok={has["/intro/jason-3.webp"]} pos="42% center" className="h-[50vh] md:w-[60%]" />
        </div>
      </section>

      {/* 4. Second video (pinned over its height, overlaps -60vh) */}
      <section ref={v2sec} className="relative -mt-[60svh] h-[200svh]" aria-label="Trailer 2">
        <div ref={v2stage} className="landing-vid sticky top-0 h-[100svh] overflow-hidden">
          {has["/intro/scrub2.mp4"] ? <Scrub src="/intro/scrub2.mp4" vref={v2} className="h-full w-full object-cover" style={{ objectPosition: "15% 0%" }} />
            : <div className="h-full w-full" style={{ background: "radial-gradient(80% 60% at 30% 40%, #ff8c4633, transparent), #120a24" }} />}
        </div>
      </section>

      {/* 5. Lucia (overlaps -80vh) */}
      <section ref={lucia} className="landing-person relative z-10 flex w-full flex-col justify-between gap-5 overflow-x-hidden py-40 lg:flex-row" style={{ marginTop: "calc(-80svh + 15rem)" }}>
        <div ref={luciaBox} className="mt-96 flex flex-col items-end gap-5 ps-10 lg:w-1/2">
          <Still src="/intro/lucia-1.webp" ok={has["/intro/lucia-1.webp"]} pos="85% center" className="w-auto lg:h-[80vh]" />
          <Still src="/intro/lucia-3.webp" ok={has["/intro/lucia-3.webp"]} pos="62% center" className="md:w-[60%] lg:h-[90vh]" />
        </div>
        <div className="person-content lg:w-1/2">
          <div className="max-w-xl ps-10 lg:ps-32">
            <h1>Lucia Caminos</h1>
            <h2>Lucia’s father taught her to fight as soon as she could walk.</h2>
            <p>Life has been coming at her swinging ever since. Fighting for her family landed her in the Leonida Penitentiary. Sheer luck got her out. Lucia’s learned her lesson — only smart moves from here.</p>
          </div>
          <Still src="/intro/lucia-2.webp" ok={has["/intro/lucia-2.webp"]} pos="50% center" className="my-20 w-[80%] translate-x-5 md:my-36 lg:w-[70%] lg:-translate-x-5 lg:h-[60vh]" />
          <p className="max-w-xl ps-10 lg:ps-32">More than anything, Lucia wants the good life her mom has dreamed of since their days in Liberty City — but instead of half-baked fantasies, Lucia is prepared to take matters into her own hands.</p>
        </div>
      </section>

      {/* 6. Postcard */}
      <section ref={post} className="relative flex items-center justify-center pb-80 shadow-2xl">
        <div className="absolute left-0 w-full h-[220vh] md:h-[200vh] md:-bottom-[83%] xl:-bottom-1/2" style={{ background: "linear-gradient(135deg, #1e2a52 0%, #6e4b91 100%)" }} />
        <div className="group relative mx-5 flex h-[30vh] w-full items-center justify-center overflow-hidden transition duration-700 hover:rotate-1 md:mx-12 md:h-[40vh] xl:mx-56 xl:h-[85vh]">
          {has["/intro/overlay.webp"] && <img src="/intro/overlay.webp" alt="" className="absolute z-10 h-full w-full" />}
          {has["/intro/postcard.mp4"] ? <video ref={vp} muted playsInline autoPlay loop preload="auto" src="/intro/postcard.mp4" className="h-full w-full object-cover 2xl:scale-x-105" />
            : <div className="h-full w-full" style={{ background: "linear-gradient(170deg, #2b0f55, #6a1d8f 40%, #d6298b 70%, #ff8c46)" }} />}
          <a href="#map" className="absolute -bottom-28 left-1/2 z-20 w-2/3 -translate-x-1/2 rounded-full bg-white px-5 py-4 text-center text-lg text-[#1a0b26] transition duration-700 group-hover:bg-[#fff9cb] md:bottom-16 md:w-fit md:px-7">Explore {BRAND.state}</a>
        </div>
      </section>

      {/* 7. Final (pinned 90 %) + 8. Outro */}
      <section ref={fin} className="relative h-[190svh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div ref={finContent} className="landing-final size-full">
            {has["/intro/scrub3.mp4"] ? <Scrub src="/intro/scrub3.mp4" vref={v3} className="h-full w-full object-cover" />
              : <div className="h-full w-full" style={{ background: "radial-gradient(70% 60% at 50% 50%, #6a1d8f66, transparent), #120a24" }} />}
          </div>
        </div>
      </section>
      <section ref={outro} className="relative -mt-[100svh] h-[100svh]">
        <div ref={outroMsg} className="flex h-full flex-col items-center justify-center gap-10 opacity-0">
          <img src="/brand/logo-1024.png" alt="" className="w-[220px] max-md:w-[160px]" />
          {title}
          <Countdown to={BRAND.releaseAt} />
        </div>
      </section>
    </div>
  );
}
