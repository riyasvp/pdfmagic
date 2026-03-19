"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  type?: "card" | "list" | "detail" | "upload";
  count?: number;
  className?: string;
}

export function SkeletonLoader({
  type = "card",
  count = 1,
  className,
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === "card") {
    return (
      <div className={cn("grid gap-4", className)}>
        {items.map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={cn("space-y-3", className)}>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "detail") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    );
  }

  if (type === "upload") {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="flex justify-center gap-2">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
    );
  }

  return null;
}

// Tool card skeleton
export function ToolCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 p-6", className)}>
      <Skeleton className="h-14 w-14 rounded-xl mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

// Processing skeleton with steps
export function ProcessingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
