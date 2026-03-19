import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://special-adventure.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Solana Memecoin P&L Tracker",
    template: "%s | Solana P&L Tracker",
  },
  description:
    "Track wallet P&L across memecoin trades on Solana. View portfolio value, swap history, and cumulative P&L over time — powered by Helius.",
  keywords: [
    "Solana",
    "memecoin",
    "P&L",
    "profit and loss",
    "wallet tracker",
    "crypto portfolio",
    "Helius",
    "DeFi",
  ],
  authors: [{ name: "Adam Momen", url: "https://github.com/adammomen" }],
  creator: "Adam Momen",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Solana Memecoin P&L Tracker",
    title: "Solana Memecoin P&L Tracker",
    description:
      "Track wallet P&L across memecoin trades on Solana. View portfolio value, swap history, and cumulative P&L over time.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Memecoin P&L Tracker",
    description: "Track wallet P&L across memecoin trades on Solana.",
    creator: "@adammomen",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <Providers>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <footer className="mt-auto border-t border-[var(--color-border)]/60 py-8" role="contentinfo">
            <div className="max-w-2xl mx-auto px-4 flex flex-col items-center justify-center gap-1">
              <p className="text-sm text-[var(--color-muted)]">
                Built with{" "}
                <span className="inline-block text-red-500/90" aria-hidden>
                  ♥
                </span>{" "}
                by{" "}
                <Link
                  href="https://github.com/adammomen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors duration-150"
                >
                  Adam Momen
                </Link>
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
