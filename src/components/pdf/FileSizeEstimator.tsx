"use client";

import { useMemo } from "react";
import { FileImage, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/tools-config";

interface FileSizeEstimatorProps {
  files: File[] | { size: number }[];
  tool?: Tool;
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

interface SizeEstimate {
  min: number;
  max: number;
  reason: string;
}

export function FileSizeEstimator({
  files,
  tool,
  outputFormat = "pdf",
  compressionLevel = "medium",
  className,
}: FileSizeEstimatorProps) {
  const estimate = useMemo<SizeEstimate | null>(() => {
    const fileArray = Array.isArray(files) ? files : [files];
    const totalSize = fileArray.reduce((acc, f) => acc + ("size" in f ? f.size : 0), 0);

    if (totalSize === 0) return null;

    // Use tool-specific estimation if available
    if (tool) {
      switch (tool.id) {
        case "compress":
          return {
            min: Math.round(totalSize * 0.1), // Maximum compression: 90% reduction
            max: Math.round(totalSize * 0.5), // Minimum compression: 50% reduction
            reason: "Based on typical compression ratios",
          };
        case "merge":
          return {
            min: totalSize,
            max: Math.round(totalSize * 1.1),
            reason: "Merged PDF size",
          };
        case "split":
          return {
            min: Math.round(totalSize * 0.3),
            max: Math.round(totalSize * 0.7),
            reason: "Split files are smaller portions",
          };
        case "pdf-to-image":
          return {
            min: Math.round(totalSize * 0.5),
            max: Math.round(totalSize * 2),
            reason: "Image output varies by quality",
          };
        case "ocr":
        case "pdf-to-text":
        case "pdf-to-markdown":
          return {
            min: Math.round(totalSize * 0.02),
            max: Math.round(totalSize * 0.2),
            reason: "Text extraction is much smaller",
          };
        default:
          return {
            min: Math.round(totalSize * 0.5),
            max: Math.round(totalSize * 1.2),
            reason: "Estimated based on operation type",
          };
      }
    }

    // Default estimation
    if (outputFormat === "compressed") {
      const ratio = (ESTIMATION_RATIOS.compressed as Record<string, number>)[compressionLevel];
      return {
        min: Math.round(totalSize * ratio * 0.7),
        max: Math.round(totalSize * ratio * 1.3),
        reason: "Estimated compression output",
      };
    }

    const ratio = ESTIMATION_RATIOS[outputFormat];
    return {
      min: Math.round(totalSize * ratio * 0.8),
      max: Math.round(totalSize * ratio * 1.2),
      reason: "Estimated output",
    };
  }, [files, tool, outputFormat, compressionLevel]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getWarningLevel = (): "none" | "warning" | "danger" => {
    if (!estimate) return "none";
    if (estimate.max > 50 * 1024 * 1024) return "danger";
    if (estimate.max > 30 * 1024 * 1024) return "warning";
    return "none";
  };

  const warningLevel = getWarningLevel();
  const totalSize = Array.isArray(files) ? files.reduce((acc, f) => acc + ("size" in f ? f.size : 0), 0) : 0;

  if (!estimate) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <FileImage className="w-4 h-4 text-muted-foreground" />
        <span>Estimated Output</span>
      </div>

      <div
        className={cn(
          "p-4 rounded-xl border",
          warningLevel === "danger" && "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
          warningLevel === "warning" && "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
          warningLevel === "none" && "bg-muted/50 border-border"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl font-bold">
            {formatSize(estimate.min)} - {formatSize(estimate.max)}
          </span>
          {warningLevel === "danger" && (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
        </div>

        {totalSize > 0 && (
          <div className="text-xs text-muted-foreground mb-2">
            Original: {formatSize(totalSize)}
          </div>
        )}

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" />
          {estimate.reason}
        </p>
      </div>

      {warningLevel === "danger" && (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Large file:</strong> Output may exceed 50MB. Consider using a smaller file.
          </p>
        </div>
      )}
    </div>
  );
}

// Legacy support for single file
export function SingleFileSizeEstimator({
  file,
  outputFormat = "pdf",
  compressionLevel = "medium",
  className,
}: Omit<FileSizeEstimatorProps, "files"> & { file: File | { size: number } }) {
  return (
    <FileSizeEstimator
      files={[file]}
      outputFormat={outputFormat}
      compressionLevel={compressionLevel}
      className={className}
    />
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
