"use client";

import { RefreshCw, AlertCircle, WifiOff, FileX, FileWarning, FileType, Clock, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ErrorCode =
  | "network"
  | "server"
  | "validation"
  | "file"
  | "file_too_large"
  | "invalid_file_type"
  | "timeout"
  | "auth_required"
  | "rate_limit"
  | "processing_error"
  | "unknown";

export interface ErrorStateProps {
  type?: ErrorCode;
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
  className?: string;
}

interface ErrorConfig {
  icon: React.ComponentType<{ className?: string }>;
  defaultTitle: string;
  defaultMessage: string;
  showContactSupport?: boolean;
  showRetry?: boolean;
}

const errorConfig: Record<ErrorCode, ErrorConfig> = {
  network: {
    icon: WifiOff,
    defaultTitle: "Connection Error",
    defaultMessage: "Please check your internet connection and try again.",
    showRetry: true,
  },
  server: {
    icon: AlertCircle,
    defaultTitle: "Server Error",
    defaultMessage: "Something went wrong on our end. Please try again in a few minutes.",
    showRetry: true,
    showContactSupport: true,
  },
  validation: {
    icon: AlertCircle,
    defaultTitle: "Invalid Input",
    defaultMessage: "Please check your input and try again.",
    showRetry: true,
  },
  file: {
    icon: FileX,
    defaultTitle: "File Error",
    defaultMessage: "There was a problem with your file. Please try a different one.",
    showRetry: true,
  },
  file_too_large: {
    icon: FileWarning,
    defaultTitle: "File Too Large",
    defaultMessage: "Your file exceeds the 50MB limit. Please compress it or use a smaller file.",
    showRetry: true,
  },
  invalid_file_type: {
    icon: FileType,
    defaultTitle: "Unsupported File Type",
    defaultMessage: "This file type is not supported. Please upload a PDF file.",
    showRetry: true,
  },
  timeout: {
    icon: Clock,
    defaultTitle: "Processing Timeout",
    defaultMessage: "The operation took too long. Please try with a smaller file or fewer pages.",
    showRetry: true,
  },
  auth_required: {
    icon: Lock,
    defaultTitle: "Authentication Required",
    defaultMessage: "Please sign in to access this feature.",
    showRetry: false,
  },
  rate_limit: {
    icon: Clock,
    defaultTitle: "Rate Limit Exceeded",
    defaultMessage: "You've reached the daily limit. Please try again tomorrow or upgrade to Pro.",
    showContactSupport: true,
  },
  processing_error: {
    icon: AlertCircle,
    defaultTitle: "Processing Error",
    defaultMessage: "We couldn't process your file. Please try again or use a different file.",
    showRetry: true,
    showContactSupport: true,
  },
  unknown: {
    icon: AlertCircle,
    defaultTitle: "Something Went Wrong",
    defaultMessage: "An unexpected error occurred. Please try again.",
    showRetry: true,
    showContactSupport: true,
  },
};

export function ErrorState({
  type = "unknown",
  title,
  message,
  errorCode,
  onRetry,
  onContactSupport,
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
      <p className="text-sm text-muted-foreground max-w-sm mb-2">
        {message || config.defaultMessage}
      </p>
      {errorCode && (
        <p className="text-xs text-muted-foreground/60 mb-4 font-mono">
          Error code: {errorCode}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        {config.showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
        {config.showContactSupport && (
          <Button
            onClick={onContactSupport}
            variant="ghost"
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper function to map error messages to error types
export function getErrorTypeFromMessage(error: Error | string): ErrorCode {
  const message = typeof error === "string" ? error : error.message;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("file too large") || lowerMessage.includes("50mb") || lowerMessage.includes("size limit")) {
    return "file_too_large";
  }
  if (lowerMessage.includes("unsupported file type") || lowerMessage.includes("not a pdf") || lowerMessage.includes("invalid file")) {
    return "invalid_file_type";
  }
  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return "timeout";
  }
  if (lowerMessage.includes("auth") || lowerMessage.includes("sign in") || lowerMessage.includes("login")) {
    return "auth_required";
  }
  if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many requests") || lowerMessage.includes("daily limit")) {
    return "rate_limit";
  }
  if (lowerMessage.includes("network") || lowerMessage.includes("connection") || lowerMessage.includes("fetch")) {
    return "network";
  }
  if (lowerMessage.includes("server") || lowerMessage.includes("internal")) {
    return "server";
  }
  if (lowerMessage.includes("invalid") || lowerMessage.includes("validation")) {
    return "validation";
  }

  return "unknown";
}
