import Link from "next/link";
export default function NotFound() {
  return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-sign text-3xl">Nothing here</h1><Link href="/" className="btn btn-hot mt-6">Home</Link></div>;
}
