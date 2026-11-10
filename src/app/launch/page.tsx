import { LaunchFlow } from "@/components/LaunchFlow";
export const metadata = { title: "Launch a clip" };
export default async function Launch({ searchParams }: { searchParams: Promise<{ url?: string; ref?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="relative isolate -mt-[84px] min-h-[100svh] overflow-hidden pt-[84px]">
      {/* Leonida backdrop: Ocean Drive at dusk, blurred and darkened, a sunset glow rising from the bottom */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: "url(/locals/ocean-drive-bokeh.jpg)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,6,24,.82) 0%, rgba(10,6,24,.55) 38%, rgba(40,10,50,.55) 70%, #0a0618 100%)" }} />
        <div className="absolute left-1/2 top-[78%] h-[70vh] w-[110vw] -translate-x-1/2 rounded-[50%] opacity-60 blur-[90px]" style={{ background: "radial-gradient(closest-side, rgba(255,104,120,.75), rgba(255,61,139,.35), transparent)" }} />
        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(255,61,139,.18)]" />
      </div>
      <LaunchFlow initialUrl={sp.url} initialRef={sp.ref} />
    </div>
  );
}
