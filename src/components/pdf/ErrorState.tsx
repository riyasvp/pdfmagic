"use client";

import { RefreshCw, AlertCircle, WifiOff, FileX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ErrorType = "network" | "server" | "validation" | "file" | "unknown";

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const errorConfig: Record<ErrorType, { icon: React.ComponentType<{ className?: string }>; defaultTitle: string; defaultMessage: string }> = {
  network: {
    icon: WifiOff,
    defaultTitle: "Connection Error",
    defaultMessage: "Please check your internet connection and try again",
  },
  server: {
    icon: AlertCircle,
    defaultTitle: "Server Error",
    defaultMessage: "Something went wrong on our end. Please try again later",
  },
  validation: {
    icon: AlertCircle,
    defaultTitle: "Invalid Input",
    defaultMessage: "Please check your input and try again",
  },
  file: {
    icon: FileX,
    defaultTitle: "File Error",
    defaultMessage: "There was a problem with your file. Please try a different one",
  },
  unknown: {
    icon: AlertCircle,
    defaultTitle: "Something went wrong",
    defaultMessage: "An unexpected error occurred. Please try again",
  },
};

export function ErrorState({
  type = "unknown",
  title,
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title || config.defaultTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {message || config.defaultMessage}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
