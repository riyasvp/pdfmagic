import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { I18nProvider } from "@/components/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://pdfmagic.store";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "PDFMagic - Free Online PDF Tools",
    template: "%s | PDFMagic",
    absolute: "PDFMagic - Free Online PDF Tools",
  },
  description: "Merge, split, compress, convert, and edit PDFs with ease. 60+ free online PDF tools. Fast, secure, and completely free. No signup required.",
  keywords: [
    "PDF tools",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "convert PDF to Word",
    "convert PDF to Excel",
    "PDF to Image",
    "PDF editor",
    "free PDF tools",
    "online PDF tools",
    "PDF merger",
    "PDF splitter",
    "PDF compressor",
    "OCR PDF",
    "watermark PDF",
    "rotate PDF",
    "delete PDF pages",
    "protect PDF",
    "PDF to text",
    "PDF to Markdown",
  ],
  authors: [{ name: "PDFMagic", url: BASE_URL }],
  creator: "PDFMagic",
  publisher: "PDFMagic",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icons/icon-192x192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "PDFMagic",
    title: "PDFMagic - Free Online PDF Tools",
    description: "Merge, split, compress, convert, and edit PDFs with ease. 60+ free online PDF tools. Fast, secure, and completely free.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PDFMagic - Free Online PDF Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@pdfmagic",
    creator: "@pdfmagic",
    title: "PDFMagic - Free Online PDF Tools",
    description: "60+ free online PDF tools. Merge, split, compress, convert, and edit PDFs instantly.",
    images: ["/og-image.png"],
  },
  other: {
    "google-adsense-account": "ca-pub-6819535548939423",
    "theme-color": "#7c3aed",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "PDFMagic",
    "application-name": "PDFMagic",
    "msapplication-TileColor": "#7c3aed",
    "msapplication-tap-highlight": "no",
  },
};

// JSON-LD Structured Data for the homepage
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PDFMagic",
  url: BASE_URL,
  description: "Free online PDF tools. Merge, split, compress, convert, and edit PDFs with ease.",
  publisher: {
    "@type": "Organization",
    name: "PDFMagic",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/favicon.svg`,
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to use all PDF tools",
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
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6819535548939423"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Google Analytics 4 */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-PDFMAGICID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PDFMAGICID');
          `}
        </Script>

        {/* PWA: Register Service Worker */}
        <Script id="pwa-register" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered:', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('SW registration failed:', error);
                  });
              });
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <I18nProvider>
            {children}
            <Toaster />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
