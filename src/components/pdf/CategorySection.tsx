"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolCard } from "./ToolCard";
import type { Tool } from "@/lib/tools-config";

interface CategorySectionProps {
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  tools: Tool[];
}

export function CategorySection({
  name,
  description,
  icon: Icon,
  gradient,
  tools,
}: CategorySectionProps) {
  return (
    <section className="py-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4 mb-6"
      >
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
            gradient
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{name}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool, index) => (
          <ToolCard
            key={tool.id}
            {...tool}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
