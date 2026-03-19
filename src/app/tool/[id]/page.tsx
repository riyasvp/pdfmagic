"use client";

import { useParams } from "next/navigation";
import { Header, Footer, ToolLayout } from "@/components/pdf";
import { getToolById, getCategoryForTool } from "@/lib/tools-config";
import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect } from "react";
import Head from "next/head";

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

      <div className="min-h-screen relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950" />
          <div className="absolute inset-0 bg-grid-pattern opacity-50" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <Header />
        <ToolLayout tool={tool} />
        <Footer />
      </div>
    </>
  );
}
