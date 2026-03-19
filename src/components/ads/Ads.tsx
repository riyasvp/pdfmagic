"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom hook for localStorage sync
function useLocalStorage(key: string, initialValue: boolean) {
  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") return () => {};
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  };

  const getSnapshot = () => {
    if (typeof window === "undefined") return initialValue;
    try {
      return localStorage.getItem(key) === "true";
    } catch {
      return initialValue;
    }
  };

  const getServerSnapshot = () => initialValue;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

interface AdBannerProps {
  className?: string;
  size?: "banner" | "leaderboard" | "medium" | "large";
  id?: string;
}

export function AdBanner({ className, size = "banner", id = "ca-pub-6819535548939423" }: AdBannerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const isDismissed = useLocalStorage(`ad-dismissed-${id}`, false);

  const heightClasses = {
    banner: "h-16 md:h-14",
    leaderboard: "h-20 md:h-16",
    medium: "h-24 md:h-20",
    large: "h-32 md:h-28",
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`ad-dismissed-${id}`, "true");
      } catch {
        // localStorage not available
      }
      // Force re-render by dispatching storage event
      window.dispatchEvent(new Event("storage"));
    }
  };

  if (isDismissed) return null;

  return (
    <div className={cn("relative w-full", heightClasses[size], className)}>
      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 w-6 h-6 md:w-8 md:h-8 bg-background/80 rounded-full z-10"
        onClick={handleDismiss}
      >
        <X className="w-3 h-3 md:w-4 md:h-4" />
      </Button>

      {/* Google AdSense placeholder */}
      <div
        className={cn(
          "ads-container w-full h-full bg-muted/50 rounded-lg border border-border flex items-center justify-center",
          !isLoaded && "animate-pulse"
        )}
      >
        <span className="text-xs text-muted-foreground">Advertisement</span>
      </div>
    </div>
  );
}

interface AdSidebarProps {
  className?: string;
}

export function AdSidebar({ className }: AdSidebarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="bg-muted/50 rounded-lg border border-border p-4 flex flex-col items-center justify-center min-h-[250px]">
        <span className="text-xs text-muted-foreground mb-2">Advertisement</span>
        <div className="w-[300px] h-[250px] bg-muted/30 rounded flex items-center justify-center">
          <span className="text-xs text-muted-foreground">300 x 250</span>
        </div>
      </div>
    </div>
  );
}

interface AdInArticleProps {
  className?: string;
}

export function AdInArticle({ className }: AdInArticleProps) {
  return (
    <div className={cn("w-full my-4 md:my-6", className)}>
      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground mb-2">Advertisement</span>
          <div className="w-full max-w-[320px] h-[100px] md:h-[90px] bg-muted/30 rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">In-Article Ad</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StickyHeaderAdProps {
  className?: string;
}

export function StickyHeaderAd({ className }: StickyHeaderAdProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isDismissed = useLocalStorage("sticky-ad-dismissed", false);

  useEffect(() => {
    // Show after scrolling past the header
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sticky-ad-dismissed", "true");
        window.dispatchEvent(new Event("storage"));
      } catch {
        // localStorage not available
      }
    }
  };

  if (isDismissed) return null;

  return (
    <div
      className={cn(
        "fixed top-16 md:top-14 left-0 right-0 z-40 transition-transform duration-300",
        isVisible ? "translate-y-0" : "-translate-y-full",
        className
      )}
    >
      <div className="bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto">
          <div className="h-14 md:h-12 bg-muted/50 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Advertisement - 728 x 90</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 w-6 h-6"
          onClick={handleDismiss}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

interface AdResponsiveProps {
  className?: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
}

export function AdResponsive({ className }: AdResponsiveProps) {
  return (
    <div className={cn("w-full min-h-[100px] md:min-h-[90px]", className)}>
      <div className="w-full h-[100px] md:h-[90px] bg-muted/50 rounded-lg border border-border flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Responsive Ad</span>
      </div>
    </div>
  );
}

// Ad slot component for tool pages
interface ToolPageAdProps {
  className?: string;
  position: "top" | "bottom" | "sidebar";
}

export function ToolPageAd({ className, position }: ToolPageAdProps) {
  const adSizes = {
    top: "h-24 md:h-20",
    bottom: "h-20 md:h-16",
    sidebar: "min-h-[250px] w-[300px]",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "bg-muted/50 rounded-lg border border-border p-3",
        position === "sidebar" ? "flex flex-col items-center" : "flex items-center justify-center"
      )}>
        <span className="text-xs text-muted-foreground mb-1">Advertisement</span>
        <div className={cn(
          "bg-muted/30 rounded flex items-center justify-center",
          adSizes[position]
        )}>
          <span className="text-xs text-muted-foreground">
            {position === "sidebar" ? "300 x 250" : "Responsive Ad"}
          </span>
        </div>
      </div>
    </div>
  );
}
