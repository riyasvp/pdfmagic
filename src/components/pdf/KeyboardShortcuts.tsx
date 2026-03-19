"use client";

import { useEffect, useCallback } from "react";
import {
  Keyboard,
  Search,
  Upload,
  Download,
  Settings,
  Home,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ["G", "H"], description: "Go to Home", category: "Navigation" },
  { keys: ["G", "S"], description: "Go to Search", category: "Navigation" },
  { keys: ["Escape"], description: "Close modal/dialog", category: "Navigation" },

  // Actions
  { keys: ["Ctrl", "O"], description: "Open file picker", category: "Actions" },
  { keys: ["Ctrl", "S"], description: "Start processing", category: "Actions" },
  { keys: ["Ctrl", "D"], description: "Download result", category: "Actions" },
  { keys: ["Ctrl", "Z"], description: "Undo", category: "Actions" },
  { keys: ["Ctrl", "Shift", "Z"], description: "Redo", category: "Actions" },

  // Tools
  { keys: ["Ctrl", "M"], description: "Merge PDFs", category: "Quick Tools" },
  { keys: ["Ctrl", "P"], description: "Compress PDF", category: "Quick Tools" },
  { keys: ["Ctrl", "R"], description: "Rotate PDF", category: "Quick Tools" },
  { keys: ["Ctrl", "W"], description: "Add Watermark", category: "Quick Tools" },
  { keys: ["Ctrl", "Shift", "S"], description: "Split PDF", category: "Quick Tools" },

  // View
  { keys: ["Ctrl", "+"], description: "Zoom in", category: "View" },
  { keys: ["Ctrl", "-"], description: "Zoom out", category: "View" },
  { keys: ["Ctrl", "0"], description: "Reset zoom", category: "View" },
  { keys: ["Ctrl", "F"], description: "Search in page", category: "View" },

  // Settings
  { keys: ["Ctrl", ","], description: "Open settings", category: "Settings" },
  { keys: ["Ctrl", "?"], description: "Show keyboard shortcuts", category: "Settings" },
];

interface KeyboardShortcutsProps {
  className?: string;
}

export function KeyboardShortcuts({ className }: KeyboardShortcutsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
          <Keyboard className="w-4 h-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 max-h-[400px] overflow-y-auto">
          {["Navigation", "Actions", "Quick Tools", "View", "Settings"].map(
            (category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, j) => (
                            <kbd
                              key={j}
                              className="px-2 py-1 text-xs font-medium bg-muted rounded border"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to handle keyboard shortcuts
export function useKeyboardShortcuts(
  handlers: Partial<{
    goHome: () => void;
    goSearch: () => void;
    openFile: () => void;
    startProcess: () => void;
    download: () => void;
    closeModal: () => void;
  }>
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "o":
            e.preventDefault();
            handlers.openFile?.();
            break;
          case "s":
            e.preventDefault();
            handlers.startProcess?.();
            break;
          case "d":
            e.preventDefault();
            handlers.download?.();
            break;
        }
      }

      // Escape to close
      if (e.key === "Escape") {
        handlers.closeModal?.();
      }

      // G + H for home
      if (e.key === "g" && !e.ctrlKey && !e.metaKey) {
        // Could implement g + h sequence detection
      }
    },
    [handlers]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Helper component for kbd display
export function KbdKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-2 py-1 text-xs font-medium bg-muted rounded border">
      {children}
    </kbd>
  );
}
