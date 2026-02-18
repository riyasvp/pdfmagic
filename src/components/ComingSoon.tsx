"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, CheckCircle } from "lucide-react";

interface ComingSoonProps {
  toolName: string;
  reason?: string;
}

export default function ComingSoon({
  toolName,
  reason = "This tool requires advanced server-side processing",
}: ComingSoonProps) {
  const workingTools = [
    { name: "Merge PDF", desc: "Combine multiple PDFs" },
    { name: "Split PDF", desc: "Extract pages or split files" },
    { name: "Compress PDF", desc: "Reduce file size" },
    { name: "Rotate PDF", desc: "Rotate pages any angle" },
    { name: "PDF to Image", desc: "Convert pages to images" },
    { name: "Image to PDF", desc: "Create PDF from images" },
    { name: "Add Watermark", desc: "Protect your documents" },
    { name: "Delete Pages", desc: "Remove unwanted pages" },
    { name: "Add Page Numbers", desc: "Number your pages" },
    { name: "Protect PDF", desc: "Add password protection" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 md:p-10 max-w-lg w-full text-center"
      >
        {/* Rocket Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="text-6xl mb-4"
        >
          🚀
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {toolName}
        </h1>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-semibold px-4 py-1 rounded-full mb-4">
          <Sparkles className="w-3 h-3" />
          Coming Soon
        </div>

        {/* Reason */}
        <p className="text-gray-600 dark:text-gray-400 mb-2">{reason}</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
          We&apos;re working hard to bring you this feature. Check back soon!
        </p>

        {/* Working Tools */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-3 uppercase tracking-wide">
            Meanwhile, Try These Free Tools:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {workingTools.slice(0, 6).map((tool) => (
              <div
                key={tool.name}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{tool.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <Link href="/">
          <Button
            variant="default"
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl py-3 font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Tools
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
