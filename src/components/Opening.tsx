"use client";
/**
 * Opening, same mechanics as the JS Mastery GTA VI landing (Hero + FirstVideo), without GSAP:
 *  1. hero: pinned for 200 % of scroll; the background zooms 1.25 → 1 while the logo mask closes from 3500 % to 20 %,
 *     then the hero fades to dark;
 *  2. video: pinned for 200 %; the clip fades in and its currentTime is scrubbed by the scroll (zoom on Jason, camera
 *     to Lucia), then the site (the map hero) takes over.
 * Assets live in /public/intro: hero-bg.webp and scrub.mp4 (encode with a keyframe on every frame: ffmpeg -g 1).
 * If they are missing the opening renders nothing.
 */
import { useEffect, useRef, useState } from "react";

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2); // power1.inOut
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function Opening() {
  const [ready, setReady] = useState<boolean | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const hero = useRef<HTMLElement>(null), heroStage = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLElement>(null), vidStage = useRef<HTMLDivElement>(null), video = useRef<HTMLVideoElement>(null);
  const dur = useRef(0);

  useEffect(() => {
    Promise.all([fetch("/intro/hero-bg.webp", { method: "HEAD" }), fetch("/intro/scrub.mp4", { method: "HEAD" })])
      .then(([a, b]) => { setHasVideo(b.ok); setReady(a.ok); }).catch(() => setReady(false));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const h = hero.current!, hs = heroStage.current!, v = vid.current, vs = vidStage.current;
    const small = window.innerWidth < 769;
    let raf = 0;
    const apply = () => {
      raf = 0;
      // --- hero: progress over its pinned span ---
      const hr = h.getBoundingClientRect(); const hspan = Math.max(1, hr.height - hs.offsetHeight);
      const p = clamp01(-hr.top / hspan);
      const t1 = clamp01(p / 0.45), t2 = clamp01((p - 0.45) / 0.3), t3 = clamp01((p - 0.75) / 0.25);
      hs.style.setProperty("--scale", (1.25 - 0.25 * ease(t1)).toFixed(4));
      const size = small ? 3100 - (3100 - 50) * ease(t1) : 3500 - (3500 - 20) * ease(t1);
      hs.style.setProperty("--mask", `${size.toFixed(1)}%`);
      hs.style.setProperty("--fade", (1 - ease(t1)).toFixed(3));
      hs.style.setProperty("--heroOpacity", (1 - ease(t2)).toFixed(3));
      void t3;
      // --- video: fades in then scrubs ---
      if (!v || !vs) return;
      const vr = v.getBoundingClientRect(); const vspan = Math.max(1, vr.height - vs.offsetHeight);
      const q = clamp01(-vr.top / vspan);
      vs.style.setProperty("--vidOpacity", ease(clamp01(q / 0.25)).toFixed(3));
      const el = video.current;
      if (el && dur.current > 0) {
        const target = ease(clamp01((q - 0.1) / 0.85)) * dur.current;
        if (Math.abs(el.currentTime - target) > 1 / 60) el.currentTime = target;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const el = video.current;
    const meta = () => { dur.current = el?.duration || 0; apply(); };
    el?.addEventListener("loadedmetadata", meta); if (el && el.readyState >= 1) meta();
    apply(); window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); el?.removeEventListener("loadedmetadata", meta); if (raf) cancelAnimationFrame(raf); };
  }, [ready, hasVideo]);

  if (!ready) return null;
  return (
    <>
      <section ref={hero} className={hasVideo ? "relative h-[300svh]" : "relative h-[220svh]"} aria-label="Opening">
        <div ref={heroStage} className="opening-hero sticky top-0 h-[100svh] overflow-hidden bg-[#0d0720]">
          <div className="opening-mask absolute inset-0">
            <img src="/intro/hero-bg.webp" alt="" className="opening-bg absolute inset-0 h-full w-full object-cover" />
          </div>
          <img src="/brand/logo-1024.png" alt="" className="opening-logo absolute left-1/2 top-[18vh] w-[220px] -translate-x-1/2 max-md:w-[160px]" />
        </div>
      </section>
      {hasVideo && <section ref={vid} className="relative -mt-[100svh] h-[300svh]" aria-label="Trailer">
        <div ref={vidStage} className="opening-video sticky top-0 h-[100svh] overflow-hidden">
          <video ref={video} muted playsInline preload="auto" src="/intro/scrub.mp4" className="h-full w-full object-cover [object-position:75%_center] md:[object-position:50%_center]" />
        </div>
      </section>}
    </>
  );
}
