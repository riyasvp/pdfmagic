"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  popular?: boolean;
  index?: number;
}

export function ToolCard({
  id,
  name,
  description,
  icon: Icon,
  gradient,
  popular,
  index = 0,
}: ToolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative group"
    >
      <Link href={`/tool/${id}`}>
        <div className="tool-card relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 p-6 h-full cursor-pointer">
          {/* Gradient background on hover */}
          <div
            className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
              `bg-gradient-to-br ${gradient}`
            )}
          />

          {/* Popular badge */}
          {popular && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                Popular
              </span>
            </div>
          )}

          {/* Icon */}
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg",
              gradient
            )}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {description}
          </p>

          {/* Action */}
          <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
            Get started
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>

          {/* Shimmer effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
