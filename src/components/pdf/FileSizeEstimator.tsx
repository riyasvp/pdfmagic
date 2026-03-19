"use client";

import { useMemo } from "react";
import { FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileSizeEstimatorProps {
  file: File | { size: number };
  outputFormat?: "pdf" | "image" | "text" | "compressed";
  compressionLevel?: "low" | "medium" | "high";
  className?: string;
}

const ESTIMATION_RATIOS = {
  pdf: 1,
  image: 1.2,
  text: 0.1,
  compressed: {
    low: 0.3,
    medium: 0.15,
    high: 0.05,
  },
};

export function FileSizeEstimator({
  file,
  outputFormat = "pdf",
  compressionLevel = "medium",
  className,
}: FileSizeEstimatorProps) {
  const estimatedSize = useMemo(() => {
    const fileSize = "size" in file ? file.size : 0;

    if (outputFormat === "compressed") {
      return fileSize * (ESTIMATION_RATIOS.compressed as Record<string, number>)[compressionLevel];
    }

    return fileSize * ESTIMATION_RATIOS[outputFormat];
  }, [file, outputFormat, compressionLevel]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const actualSize = "size" in file ? file.size : 0;
  const reduction = ((actualSize - estimatedSize) / actualSize) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Estimated output:</span>
        <span className="font-medium">{formatSize(estimatedSize)}</span>
      </div>
      {outputFormat === "compressed" && actualSize > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estimated reduction:</span>
          <span className="font-medium text-green-600">
            ~{reduction.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Quick size display
export function FileSizeDisplay({
  bytes,
  label,
  className,
}: {
  bytes: number;
  label?: string;
  className?: string;
}) {
  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className="text-sm font-medium">{formatSize(bytes)}</span>
    </div>
  );
}

// Comparison display
export function SizeComparison({
  original,
  compressed,
  className,
}: {
  original: number;
  compressed: number;
  className?: string;
}) {
  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  const reduction = ((original - compressed) / original) * 100;
  const saved = original - compressed;

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="p-4 rounded-lg bg-muted/50">
        <div className="text-xs text-muted-foreground mb-1">Original</div>
        <div className="text-lg font-semibold">{formatSize(original)}</div>
      </div>
      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
        <div className="text-xs text-green-600 mb-1">After</div>
        <div className="text-lg font-semibold text-green-600">
          {formatSize(compressed)}
        </div>
        {reduction > 0 && (
          <div className="text-xs text-green-600 mt-1">
            -{reduction.toFixed(0)}% ({formatSize(saved)} saved)
          </div>
        )}
      </div>
    </div>
  );
}
