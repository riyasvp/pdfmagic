"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Use refs to track state
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set client state on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Required for client-side rendering
    setIsClient(true);
  }, []);

  // Set up PWA event listeners
  useEffect(() => {
    if (!isClient) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);
      
      // Show prompt after a delay (to not be too intrusive)
      showTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };
  }, [isClient]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem("pwaInstallDismissed", "true");
    setTimeout(() => {
      localStorage.removeItem("pwaInstallDismissed");
    }, 7 * 24 * 60 * 60 * 1000);
  }, []);

  const handleLater = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Check if already installed or dismissed
  if (!isClient) {
    return null;
  }

  // Check standalone mode
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isInWebAppMode = (window.navigator as unknown as { standalone?: boolean }).standalone;
  const isInstalled = isStandalone || isInWebAppMode === true;
  
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  // Check if dismissed
  const isDismissed = localStorage.getItem("pwaInstallDismissed") === "true";
  if (isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
        >
          <div className="glass-card rounded-2xl p-4 md:p-6 shadow-2xl border border-violet-200 dark:border-violet-800">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">
                  Install PDFMagic App
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get quick access, offline mode, and a better experience on your device.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleInstall}
                    className="btn-gradient text-white rounded-lg flex items-center justify-center gap-2"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                    Install
                  </Button>
                  <Button
                    onClick={handleLater}
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: "📱", label: "Mobile Ready" },
                { icon: "⚡", label: "Offline Access" },
                { icon: "🔔", label: "Push Alerts" },
              ].map((feature) => (
                <div key={feature.label} className="text-xs">
                  <span className="text-lg">{feature.icon}</span>
                  <p className="text-muted-foreground mt-1">{feature.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manually trigger install prompt
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  // Check if already installed
  const isStandalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
  const isInWebAppMode = typeof window !== "undefined" && (window.navigator as unknown as { standalone?: boolean }).standalone;
  const isInstalled = isStandalone || isInWebAppMode === true;

  return { install, isInstallable, isInstalled };
}
