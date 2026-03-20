"use client";

import { useState } from "react";
import { Twitter, Linkedin, Facebook, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ShareButtons({
  url,
  title,
  description,
  className,
  size = "md",
  showLabel = false,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || "");

  const shareLinks = [
    {
      name: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "hover:bg-[#1DA1F2] hover:text-white",
      label: "Share on Twitter",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "hover:bg-[#0A66C2] hover:text-white",
      label: "Share on LinkedIn",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-[#1877F2] hover:text-white",
      label: "Share on Facebook",
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const sizeClasses = {
    sm: "p-2",
    md: "p-2.5",
    lg: "p-3",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {shareLinks.map((platform) => (
        <a
          key={platform.name}
          href={platform.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={platform.label}
          className={cn(
            "p-2 rounded-lg bg-muted hover:bg-primary transition-all duration-200",
            platform.color,
            sizeClasses[size]
          )}
        >
          <platform.icon className={iconSizes[size]} />
          {showLabel && (
            <span className="ml-2 hidden sm:inline">{platform.name}</span>
          )}
        </a>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className={cn(
          "rounded-lg bg-muted hover:bg-primary hover:text-white transition-all duration-200",
          sizeClasses[size],
          copied && "bg-green-500 text-white hover:bg-green-600"
        )}
      >
        {copied ? (
          <>
            <Check className={iconSizes[size]} />
            {showLabel && <span className="ml-2 hidden sm:inline">Copied!</span>}
          </>
        ) : (
          <>
            <Link2 className={iconSizes[size]} />
            {showLabel && <span className="ml-2 hidden sm:inline">Copy Link</span>}
          </>
        )}
      </Button>
    </div>
  );
}

// Floating share bar for blog posts
export function FloatingShareBar({ url, title }: { url: string; title: string }) {
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2">
      <div className="glass-card rounded-xl p-2 flex flex-col gap-2">
        <span className="text-xs text-muted-foreground text-center mb-1">Share</span>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Twitter"
          className="p-2 rounded-lg bg-muted hover:bg-[#1DA1F2] hover:text-white transition-all duration-200"
        >
          <Twitter className="w-4 h-4" />
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
          className="p-2 rounded-lg bg-muted hover:bg-[#0A66C2] hover:text-white transition-all duration-200"
        >
          <Linkedin className="w-4 h-4" />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
          className="p-2 rounded-lg bg-muted hover:bg-[#1877F2] hover:text-white transition-all duration-200"
        >
          <Facebook className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
