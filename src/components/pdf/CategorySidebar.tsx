"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryItems } from "@/lib/tools-config";
import Link from "next/link";

interface CategorySidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function CategorySidebar({ className, collapsed = false, onToggle }: CategorySidebarProps) {
  const categories = getCategoryItems();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.name))
  );

  const toggleCategory = useCallback((name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  if (collapsed) {
    return (
      <div className={cn("p-4", className)}>
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          Tools
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {categories.map((category) => (
        <div key={category.name} className="rounded-lg overflow-hidden">
          <button
            onClick={() => toggleCategory(category.name)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                  category.gradient
                )}
              >
                <category.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">{category.name}</div>
                <div className="text-xs text-muted-foreground">
                  {category.toolCount} tools
                </div>
              </div>
            </div>
            {expandedCategories.has(category.name) ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {expandedCategories.has(category.name) && (
            <div className="pl-4 pr-2 pb-2 space-y-1">
              {category.tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tool/${tool.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <tool.icon
                    className={cn(
                      "w-4 h-4 bg-gradient-to-br text-white rounded",
                      tool.gradient
                    )}
                  />
                  <span className="text-sm">{tool.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
