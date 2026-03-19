"use client";

import { FileSearch, Inbox, FolderOpen, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Specific empty states
export function NoFilesEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No files uploaded"
      description="Upload a PDF file to get started with this tool"
      className={className}
    />
  );
}

export function NoSearchResultsEmptyState({ query, className }: { query?: string; className?: string }) {
  return (
    <EmptyState
      icon={FileSearch}
      title="No results found"
      description={query ? `No tools matching "${query}"` : "Try a different search term"}
      className={className}
    />
  );
}

export function ErrorEmptyState({ 
  message, 
  onRetry, 
  className 
}: { 
  message?: string; 
  onRetry?: () => void; 
  className?: string 
}) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Something went wrong"
      description={message || "An error occurred while processing your request"}
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
      className={className}
    />
  );
}
