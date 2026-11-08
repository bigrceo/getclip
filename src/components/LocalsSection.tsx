"use client";
import dynamic from "next/dynamic";
const Locals3D = dynamic(() => import("./Locals3D").then((m) => m.Locals3D), { ssr: false });
export function LocalsSection() { return <Locals3D />; }
