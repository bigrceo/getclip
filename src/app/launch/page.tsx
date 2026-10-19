import { LaunchFlow } from "@/components/LaunchFlow";
export const metadata = { title: "Launch a clip" };
export default async function Launch({ searchParams }: { searchParams: Promise<{ url?: string; ref?: string }> }) {
  const sp = await searchParams;
  return <LaunchFlow initialUrl={sp.url} initialRef={sp.ref} />;
}
