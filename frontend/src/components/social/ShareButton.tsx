"use client";

import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { formatCount } from "@/lib/utils";

interface ShareButtonProps {
  videoId: string;
}

export default function ShareButton({ videoId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/feed?v=${videoId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Check out this video on MikMok", url });
        return;
      } catch {
        // Fallback to copy
      }
    }

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail
    }
  }, [videoId]);

  return (
    <button
      onClick={handleShare}
      className="flex flex-col items-center gap-1 group"
    >
      <div className="w-12 h-12 rounded-full glass-dark flex items-center justify-center transition-all group-hover:bg-white/10">
        {copied ? (
          <Check className="w-6 h-6 text-[#40E0D0] drop-shadow-md" />
        ) : (
          <Share2 className="w-6 h-6 text-white drop-shadow-md" />
        )}
      </div>
      <span className="text-white text-xs font-bold drop-shadow-md">
        {copied ? "Copied" : "Share"}
      </span>
    </button>
  );
}
