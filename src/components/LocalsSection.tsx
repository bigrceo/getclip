"use client";
import dynamic from "next/dynamic";
const Locals3D = dynamic(() => import("./Locals3D").then((m) => m.Locals3D), { ssr: false });
export function LocalsSection({ compact = false, only }: { compact?: boolean; only?: string }) { return <Locals3D compact={compact} only={only} />; }
