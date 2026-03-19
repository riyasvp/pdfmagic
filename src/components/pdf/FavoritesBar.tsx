"use client";

import { useState, useEffect } from "react";
import { Star, StarOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/tools-config";

const FAVORITES_KEY = "pdfmagic_favorites";

interface FavoritesBarProps {
  className?: string;
  onToolSelect?: (toolId: string) => void;
}

// Helper to load favorites from localStorage
function loadFavorites(): Tool[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(FAVORITES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

export function FavoritesBar({ className, onToolSelect }: FavoritesBarProps) {
  const [favorites, setFavorites] = useState<Tool[]>(() => loadFavorites());

  const removeFavorite = (toolId: string) => {
    const updated = favorites.filter((t) => t.id !== toolId);
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2", className)}>
      <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
        <Star className="w-4 h-4 text-amber-500" />
        Favorites
      </div>
      {favorites.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolSelect?.(tool.id)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors whitespace-nowrap group"
        >
          <tool.icon className={cn("w-4 h-4 bg-gradient-to-br", tool.gradient, "text-white rounded")} />
          <span className="text-sm">{tool.name}</span>
          <StarOff
            className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              removeFavorite(tool.id);
            }}
          />
        </button>
      ))}
    </div>
  );
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Tool[]>(() => loadFavorites());

  const addFavorite = (tool: Tool) => {
    if (!favorites.some((t) => t.id === tool.id)) {
      const updated = [...favorites, tool];
      setFavorites(updated);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    }
  };

  const removeFavorite = (toolId: string) => {
    const updated = favorites.filter((t) => t.id !== toolId);
    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  };

  const isFavorite = (toolId: string) => {
    return favorites.some((t) => t.id === toolId);
  };

  const toggleFavorite = (tool: Tool) => {
    if (isFavorite(tool.id)) {
      removeFavorite(tool.id);
    } else {
      addFavorite(tool);
    }
  };

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
}
