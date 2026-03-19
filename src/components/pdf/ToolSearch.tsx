"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToolCard } from "./ToolCard";
import { searchTools, getAllTools } from "@/lib/tools-config";
import { cn } from "@/lib/utils";

interface ToolSearchProps {
  className?: string;
}

export function ToolSearch({ className }: ToolSearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    if (query.trim()) {
      return searchTools(query);
    }
    return getAllTools().slice(0, 8);
  }, [query]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setShowResults(false);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tools..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(e.target.value.length > 0);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-lg max-h-[400px] overflow-y-auto z-50">
          <div className="p-2">
            <div className="text-xs text-muted-foreground px-3 py-2">
              {results.length} tool{results.length !== 1 ? "s" : ""} found
            </div>
            <div className="grid gap-2">
              {results.slice(0, 8).map((tool) => (
                <div
                  key={tool.id}
                  className="p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => {
                    window.location.href = `/tool/${tool.id}`;
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                        tool.gradient
                      )}
                    >
                      <tool.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{tool.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {tool.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {results.length > 8 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    // Could navigate to a full search results page
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  View all {results.length} results
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
