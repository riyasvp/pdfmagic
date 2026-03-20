"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEMO_CONFIG,
} from "@/lib/demo-utils";
import { cn } from "@/lib/utils";

export function DemoModeIndicator() {
  const [isVisible, setIsVisible] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetIn: number;
  } | null>(null);

  useEffect(() => {
    // Check if we're in demo mode by checking the environment
    const isDemo = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || 
       window.location.hostname === "127.0.0.1");

    // Set visibility using a ref to avoid cascading renders
    if (isDemo) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      
      // Update rate limit info periodically
      const interval = setInterval(() => {
        const stored = sessionStorage.getItem("demo_rate_limit");
        if (stored) {
          try {
            const info = JSON.parse(stored);
            setRateLimitInfo(info);
          } catch {
            // Ignore parse errors
          }
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm",
        "bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800",
        "rounded-xl p-4 shadow-lg"
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Demo Mode
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            You&apos;re using the demo version. Files are limited to{" "}
            <strong>{DEMO_CONFIG.maxFileSize / (1024 * 1024)} MB</strong> and
            processing is limited to{" "}
            <strong>{DEMO_CONFIG.maxRequestsPerMinute} requests/minute</strong>.
          </p>
          {rateLimitInfo && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              Requests remaining: {rateLimitInfo.remaining} | Resets in:{" "}
              {Math.ceil(rateLimitInfo.resetIn / 1000)}s
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
