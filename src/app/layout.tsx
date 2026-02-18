import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    template: "%s | PDFMagic",
  },
  description: "Free online PDF tools - merge, split, compress, convert, and edit PDFs. Fast, secure, and easy to use. No signup required!",
  keywords: ["PDF", "merge PDF", "split PDF", "compress PDF", "PDF converter", "free PDF tools", "edit PDF", "PDF to Word"],
  authors: [{ name: "PDFMagic" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "PDFMagic - Free Online PDF Tools",
    description: "Merge, split, compress, convert, and edit PDFs for free. No signup required!",
    url: "https://pdfmagic.store",
    siteName: "PDFMagic",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFMagic - Free Online PDF Tools",
    description: "Merge, split, compress, convert, and edit PDFs for free. No signup required!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
