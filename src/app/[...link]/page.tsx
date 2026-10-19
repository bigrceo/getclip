import { notFound, redirect } from "next/navigation";
/** clip.fun/tiktok.com/@x/video/123 → launch prefilled with that link. */
export default async function Prefix({ params, searchParams }: { params: Promise<{ link: string[] }>; searchParams: Promise<Record<string, string>> }) {
  const { link } = await params;
  const joined = link.map(decodeURIComponent).join("/").replace(/^(https?):\/(?!\/)/, "$1://");
  if (!/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+\//i.test(joined + "/")) notFound();
  const qs = new URLSearchParams(await searchParams).toString();
  redirect(`/launch?url=${encodeURIComponent(joined + (qs ? `?${qs}` : ""))}`);
}
