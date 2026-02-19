import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PDFMagic - Free Online PDF Tools",
    template: "%s - PDFMagic"
  },
  description: "Merge, split, compress, convert, and edit PDFs with ease. Fast, secure, and completely free online PDF tools.",
  keywords: ["PDF", "merge PDF", "split PDF", "compress PDF", "convert PDF", "PDF editor", "free PDF tools"],
  authors: [{ name: "PDFMagic" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "PDFMagic - Free Online PDF Tools",
    description: "Merge, split, compress, convert, and edit PDFs with ease. Fast, secure, and completely free online PDF tools.",
    url: "https://pdfmagic.store",
    siteName: "PDFMagic",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFMagic - Free Online PDF Tools",
    description: "Merge, split, compress, convert, and edit PDFs with ease.",
  },
  other: {
    "google-adsense-account": "ca-pub-6819535548939423",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6819535548939423"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
