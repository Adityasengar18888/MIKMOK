"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { likesApi } from "@/lib/api";
import { formatCount, cn } from "@/lib/utils";
import { useApiToken } from "@/hooks/useAuthSync";

interface LikeButtonProps {
  videoId: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function LikeButton({ videoId, initialLiked, initialCount }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const getToken = useApiToken();

  const handleLike = useCallback(async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));

    if (!wasLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }

    try {
      await getToken();
      if (wasLiked) {
        await likesApi.unlike(videoId);
      } else {
        await likesApi.like(videoId);
      }
    } catch {
      // Revert on error
      setIsLiked(wasLiked);
      setCount((c) => c + (wasLiked ? 1 : -1));
    }
  }, [isLiked, isSignedIn, videoId, router, getToken]);

  return (
    <button
      onClick={handleLike}
      className="flex flex-col items-center gap-1 group"
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full glass-dark flex items-center justify-center transition-all hover:bg-white/10",
          isLiked && "bg-[#40E0D0]/20 border-[#40E0D0]/30",
          isAnimating && "animate-heart-burst"
        )}
      >
        <Heart
          className={cn(
            "w-6 h-6 transition-colors drop-shadow-md",
            isLiked ? "text-[#40E0D0] fill-[#40E0D0]" : "text-white"
          )}
        />
      </div>
      <span className="text-white text-xs font-bold drop-shadow-md">
        {formatCount(count)}
      </span>
    </button>
  );
}
