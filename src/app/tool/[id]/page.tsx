"use client";

import { useParams } from "next/navigation";
import { Header, Footer, ToolLayout } from "@/components/pdf";
import { getToolById } from "@/lib/tools-config";
import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect } from "react";
import ComingSoon from "@/components/ComingSoon";

// Tools that require server-side processing and show Coming Soon
const COMING_SOON_TOOLS: Record<string, string> = {
  "pdf-to-word": "Requires advanced document conversion engine",
  "pdf-to-excel": "Requires advanced data extraction engine",
  "pdf-to-ppt": "Requires advanced presentation conversion",
  "word-to-pdf": "Requires server-side document processing",
  "excel-to-pdf": "Requires server-side spreadsheet processing",
  "ppt-to-pdf": "Requires server-side presentation processing",
  "html-to-pdf": "Requires server-side HTML rendering",
  "ocr": "Requires AI text recognition engine",
  "compare": "Requires advanced document comparison",
  "summarize": "Requires AI summarization engine",
  "chat": "Requires AI chat processing",
  "unlock": "Requires advanced encryption handling",
  "sign": "Requires digital signature infrastructure",
  "redact": "Requires advanced content detection",
  "crop": "Requires server-side image processing",
  "organize": "Requires advanced page management",
};

export default function ToolPage() {
  const params = useParams();
  const toolId = params.id as string;
  const tool = getToolById(toolId);

  // Set document title dynamically
  useEffect(() => {
    if (tool) {
      document.title = `${tool.name} - PDFMagic`;
    } else {
      document.title = "Tool Not Found - PDFMagic";
    }
  }, [tool]);

  if (!tool) {
    return (
      <div className="min-h-screen relative overflow-hidden">
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

  // Show Coming Soon for tools that require server-side processing
  if (COMING_SOON_TOOLS[toolId]) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950" />
        </div>
        <Header />
        <ComingSoon toolName={tool.name} reason={COMING_SOON_TOOLS[toolId]} />
        <Footer />
      </div>
    );
  }

  return (
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
  );
}
