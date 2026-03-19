"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/tools-config";
import Link from "next/link";

const RECENT_KEY = "pdfmagic_recent";

interface RecentToolsProps {
  className?: string;
  maxItems?: number;
}

// Helper to load recent tools from localStorage
function loadRecentTools(): { id: string; name: string; icon: string; gradient: string }[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(RECENT_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

export function RecentTools({ className, maxItems = 5 }: RecentToolsProps) {
  const [recentTools] = useState<{ id: string; name: string; icon: string; gradient: string }[]>(() => loadRecentTools());

  if (recentTools.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        Recent
      </div>
      <div className="flex flex-wrap gap-2">
        {recentTools.slice(0, maxItems).map((tool) => (
          <Link
            key={tool.id}
            href={`/tool/${tool.id}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-gradient-to-br" style={{ background: getGradientBg(tool.gradient) }} />
            {tool.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function getGradientBg(gradient: string): string {
  const gradientMap: Record<string, string> = {
    "from-orange-400 to-pink-500": "#f97316 to #ec4899",
    "from-red-400 to-rose-500": "#f87171 to #f43f5e",
    "from-green-400 to-emerald-500": "#4ade80 to #10b981",
    "from-blue-400 to-indigo-500": "#60a5fa to #6366f1",
    "from-purple-400 to-violet-500": "#c084fc to #8b5cf6",
  };
  return gradientMap[gradient] || "#888";
}

export function useRecentTools() {
  const [recentTools, setRecentTools] = useState<{ id: string; name: string; icon: string; gradient: string }[]>(() => loadRecentTools());

  const addRecentTool = (tool: Tool) => {
    const toolData = {
      id: tool.id,
      name: tool.name,
      icon: tool.id,
      gradient: tool.gradient,
    };

    const updated = [toolData, ...recentTools.filter((t) => t.id !== tool.id)].slice(0, 20);
    setRecentTools(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  return { recentTools, addRecentTool };
}
