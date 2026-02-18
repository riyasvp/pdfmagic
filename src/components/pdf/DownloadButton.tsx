"use client";

import { motion } from "framer-motion";
import { Download, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DownloadButtonProps {
  downloadUrl: string;
  fileName: string;
  onReset?: () => void;
}

export function DownloadButton({
  downloadUrl,
  fileName,
  onReset,
}: DownloadButtonProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row gap-3 justify-center"
    >
      <Button
        onClick={handleDownload}
        size="lg"
        className="btn-gradient text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30"
      >
        <Download className="w-5 h-5 mr-2" />
        Download File
      </Button>

      {onReset && (
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="rounded-full px-6 py-6"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Process Another File
        </Button>
      )}

      <Link href="/">
        <Button
          variant="ghost"
          size="lg"
          className="rounded-full px-6 py-6 w-full sm:w-auto"
        >
          <Home className="w-5 h-5 mr-2" />
          Back to Home
        </Button>
      </Link>
    </motion.div>
  );
}
