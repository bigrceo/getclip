import Link from "next/link";
import { LocalsRoster } from "@/components/LocalsSection";
export const metadata = { title: "Meet the Locals", description: "Lucia, Jason and Hollis: Ocean Drive, the Keys and the Grassrivers. Every clip of them can become a coin." };
export default function LocalsPage() {
  return (
    <section className="mx-auto max-w-[1160px] px-6 pb-20 pt-10 max-md:px-4">
      <p className="script">Meet the</p>
      <h1 className="sec-title sunset-text mb-3.5">Locals</h1>
      <p className="mb-8 mt-2.5 max-w-[720px] leading-[1.55] text-haze">A sunburnt peninsula of neon nights, swamp kings and bad decisions. Meet the faces of Leonida. Every clip of them can become a coin.</p>
      <LocalsRoster />
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/launch" className="btn btn-hot h-12 px-6">Launch a clip of them</Link>
        <Link href="/map" className="btn btn-ghost h-12 px-6">See the map</Link>
      </div>
    </section>
  );
}
