"use client";
/** Lucia and Jason as short looping videos in their place (Ocean Drive, the Keys). The first frame shows at once as the
 *  poster, the loop starts as soon as it can play; no 3D engine on these pages. */
import Link from "next/link";
import { useState } from "react";
import { LOCALS, type Local } from "@/lib/locals";

function Clip({ l, className = "" }: { l: Local; className?: string }) {
  // the animation plays once, then the video rests on its last frame (they look at you) and only breathes: a slow,
  // barely visible rise of the frame. No loop, so the face never changes again.
  const [held, setHeld] = useState(false);
  return (
    <div className={`absolute inset-0 ${held ? "local-breathe" : ""}`}>
      <video src={l.video} poster={l.poster} autoPlay muted playsInline preload="auto" aria-label={`${l.name} on ${l.place}`}
        onEnded={() => setHeld(true)} className={`absolute inset-0 h-full w-full object-cover ${className}`} />
    </div>
  );
}

function Card({ l, compact }: { l: Local; compact?: boolean }) {
  return (
    <Link href={`/locals/${l.id}`} className={`local-link group relative block overflow-hidden ${compact ? "min-h-0 flex-1 rounded-[14px]" : "aspect-[4/5] rounded-[20px]"}`} aria-label={`${l.name}: profile`}>
      <div className="absolute inset-0 overflow-hidden rounded-[inherit] border border-white/10">
        <Clip l={l} className="transition-transform duration-700 group-hover:scale-[1.04]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%]" style={{ background: "linear-gradient(to bottom, transparent, rgba(13,7,32,.85) 75%, #0d0720)" }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
          <p className={`label text-sun ${compact ? "!text-[10px]" : ""}`}>${l.ticker} · {l.role}</p>
          <h3 className={`font-sign uppercase leading-none ${compact ? "text-[30px]" : "text-[44px]"}`}>{l.name}</h3>
          {!compact && <p className="mt-2 text-[15px] leading-[1.5] text-haze">{l.bio}</p>}
        </div>
      </div>
    </Link>
  );
}

export function LocalsSection({ compact = false, only }: { compact?: boolean; only?: string }) {
  if (only) {
    const l = LOCALS.find((x) => x.id === only);
    return l ? <div className="relative h-full overflow-hidden rounded-[22px] border border-white/10"><Clip l={l} /></div> : null;
  }
  if (compact) return <div className="flex h-full flex-col gap-2.5">{LOCALS.map((l) => <Card key={l.id} l={l} compact />)}</div>;
  return <div className="mx-auto grid max-w-[760px] gap-[18px] md:grid-cols-2">{LOCALS.map((l) => <Card key={l.id} l={l} />)}</div>;
}
