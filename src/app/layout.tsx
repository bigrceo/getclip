import type { Metadata } from "next";
import { Inter, Archivo_Black } from "next/font/google";
import "./globals.css";
import { BRAND, SITE_URL } from "@/lib/brand";
import { WalletProvider } from "@/components/wallet";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const archivo = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-archivo" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.name}: viral clips, pump.fun coins`, template: `%s · ${BRAND.name}` },
  description: BRAND.tagline,
  applicationName: BRAND.name,
  openGraph: { title: BRAND.name, description: BRAND.tagline },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <a href="#content" className="sr-only focus:not-sr-only">Skip to the content</a>
        <WalletProvider>
          <Header />
          <main id="content" className="flex-1">{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
