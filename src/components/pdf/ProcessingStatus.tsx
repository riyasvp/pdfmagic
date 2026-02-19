"use client";

import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Status = "idle" | "uploading" | "processing" | "success" | "error";

interface ProcessingStatusProps {
  status: Status;
  progress: number;
  message?: string;
  errorMessage?: string;
}

const statusConfig = {
  idle: {
    icon: Sparkles,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    title: "Ready to process",
  },
  uploading: {
    icon: Loader2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    title: "Uploading files...",
  },
  processing: {
    icon: Loader2,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    title: "Processing your PDF...",
  },
  success: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    title: "Processing complete!",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    title: "An error occurred",
  },
};

export function ProcessingStatus({
  status,
  progress,
  message,
  errorMessage,
}: ProcessingStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        config.bgColor
      )}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={cn("relative", status !== "idle" && "animate-pulse-glow")}>
          <Icon
            className={cn(
              "w-8 h-8",
              config.color,
              status === "uploading" || status === "processing"
                ? "animate-spin"
                : ""
            )}
          />
        </div>
        <div>
          <h3 className={cn("font-semibold", config.color)}>{config.title}</h3>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {status === "error" && errorMessage && (
            <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
          )}
        </div>
      </div>

      {(status === "uploading" || status === "processing") && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {status === "uploading" ? "Uploading..." : "Processing..."}
            </span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {status === "success" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-green-600 dark:text-green-400"
        >
          Your file is ready for download!
        </motion.div>
      )}
    </motion.div>
  );
}
