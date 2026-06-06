"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { followsApi } from "@/lib/api";
import { useApiToken } from "@/hooks/useAuthSync";
import { useUserStore } from "@/stores/userStore";

interface FollowButtonProps {
  userId: string;
  username: string;
  initialFollowing?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function FollowButton({
  userId,
  username,
  initialFollowing = false,
  size = "sm",
  className,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const getToken = useApiToken();
  const currentUser = useUserStore((s) => s.user);

  const handleFollow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setIsLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);

    try {
      await getToken();
      if (wasFollowing) {
        await followsApi.unfollow(userId);
      } else {
        await followsApi.follow(userId);
      }
    } catch {
      setIsFollowing(wasFollowing);
    } finally {
      setIsLoading(false);
    }
  }, [isFollowing, isSignedIn, userId, router, getToken]);

  // Don't show follow button for own profile
  if (currentUser?.username === username) return null;

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center justify-center font-bold rounded-lg transition-all",
        size === "sm"
          ? "text-xs px-3 py-1"
          : "text-sm px-5 py-2",
        isFollowing
          ? "bg-muted text-muted-foreground border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          : "bg-[#40E0D0] text-black hover:opacity-90",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
