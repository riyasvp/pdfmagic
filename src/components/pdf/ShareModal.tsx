"use client";

import { useState } from "react";
import { Share2, Copy, Check, Link2, Mail, Twitter, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  downloadUrl?: string;
  fileName?: string;
  className?: string;
}

export function ShareModal({ downloadUrl, fileName, className }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = downloadUrl ? `${typeof window !== "undefined" ? window.location.origin : ""}${downloadUrl}` : "";

  const copyToClipboard = async () => {
    if (fullUrl) {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToTwitter = () => {
    if (typeof window !== "undefined") {
      window.open(
        `https://twitter.com/intent/tweet?text=Check+out+this+file&url=${encodeURIComponent(fullUrl)}`,
        "_blank"
      );
    }
  };

  const shareToFacebook = () => {
    if (typeof window !== "undefined") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
        "_blank"
      );
    }
  };

  const shareViaEmail = () => {
    if (typeof window !== "undefined") {
      window.location.href = `mailto:?subject=Check+out+this+file&body=I+found+this+file+you+may+like:+${encodeURIComponent(fullUrl)}`;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share file</DialogTitle>
          <DialogDescription>
            Share this download link with others
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* File name */}
          {fileName && (
            <div className="text-sm text-muted-foreground">
              File: {fileName}
            </div>
          )}

          {/* URL input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={fullUrl}
                readOnly
                className="pl-10 pr-10"
              />
            </div>
            <Button onClick={copyToClipboard} size="icon">
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Social share buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={shareToTwitter}
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={shareToFacebook}
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={shareViaEmail}
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
