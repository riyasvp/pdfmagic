"use client";

import { useParams } from "next/navigation";
import { Header, Footer, ToolLayout } from "@/components/pdf";
import { AdBanner, AdSidebar, AdInArticle, ToolPageAd } from "@/components/ads/Ads";
import { getToolById, getCategoryForTool } from "@/lib/tools-config";
import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect } from "react";

const BASE_URL = "https://pdfmagic.store";

export default function ToolPage() {
  // Get params using useParams hook
  const params = useParams();
  const toolId = params.id as string;
  const tool = getToolById(toolId);
  const category = tool ? getCategoryForTool(tool.id) : undefined;

  // Generate SEO metadata
  const getSEOMetadata = () => {
    if (!tool) {
      return {
        title: "Tool Not Found - PDFMagic",
        description: "The requested PDF tool could not be found.",
      };
    }

    const title = `${tool.name} - Free Online PDF Tool | PDFMagic`;
    const description = `${tool.description}. Use our free online ${tool.name} tool to ${tool.description.toLowerCase()}. No signup required, fast processing, secure and private.`;
    const keywords = [
      tool.name,
      `free ${tool.name}`,
      `online ${tool.name}`,
      tool.id.replace("-", " "),
      "PDF tools",
      "PDFMagic",
      ...(category ? [category.name] : []),
    ];

    return { title, description, keywords };
  };

  const seo = getSEOMetadata();
  const canonicalUrl = `${BASE_URL}/tool/${toolId}`;

  // Set document title dynamically
  useEffect(() => {
    if (tool) {
      document.title = `${tool.name} - PDFMagic`;
    } else {
      document.title = "Tool Not Found - PDFMagic";
    }
  }, [tool]);

  // Structured data for SEO (JSON-LD)
  const structuredData = tool
    ? {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: tool.name,
        description: tool.description,
        url: canonicalUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: BASE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: category?.name || "Tools",
              item: BASE_URL,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: tool.name,
              item: canonicalUrl,
            },
          ],
        },
      }
    : null;

  if (!tool) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <Head>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          <link rel="canonical" href={canonicalUrl} />
        </Head>
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950" />
        </div>
        <Header />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-6">
              <FileQuestion className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Tool Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The tool you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/">
              <Button className="btn-gradient text-white rounded-full px-8">
                Back to Home
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords.join(", ")} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:site_name" content="PDFMagic" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />

        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="PDFMagic" />

        {/* JSON-LD Structured Data */}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </Head>

      <div className="min-h-screen relative overflow-hidden pb-20 md:pb-0">
        {/* Animated gradient background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950" />
          <div className="absolute inset-0 bg-grid-pattern opacity-50" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>

        {/* Sticky header ad */}
        <AdBanner className="hidden md:block" />

        <Header />

        {/* Main content with sidebar ad on desktop */}
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
            {/* Main tool area */}
            <div className="flex-1 min-w-0">
              {/* Top ad */}
              <AdInArticle className="mb-4 md:mb-6 lg:hidden" />
              
              <ToolLayout tool={tool} />
              
              {/* Bottom ad */}
              <AdInArticle className="mt-6 md:mt-8 lg:hidden" />
            </div>

            {/* Sidebar ad on desktop */}
            <div className="hidden lg:block w-[300px] flex-shrink-0">
              <div className="sticky top-32">
                <AdSidebar className="mb-6" />
                
                {/* Related tools ad placeholder */}
                <div className="bg-muted/50 rounded-lg border border-border p-4">
                  <h3 className="font-semibold mb-3">Popular Tools</h3>
                  <div className="space-y-2">
                    <Link href="/tool/merge" className="block text-sm text-muted-foreground hover:text-primary">
                      Merge PDF
                    </Link>
                    <Link href="/tool/compress" className="block text-sm text-muted-foreground hover:text-primary">
                      Compress PDF
                    </Link>
                    <Link href="/tool/split" className="block text-sm text-muted-foreground hover:text-primary">
                      Split PDF
                    </Link>
                    <Link href="/tool/pdf-to-word" className="block text-sm text-muted-foreground hover:text-primary">
                      PDF to Word
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

// Need to import Head for the not found page
import Head from "next/head";
