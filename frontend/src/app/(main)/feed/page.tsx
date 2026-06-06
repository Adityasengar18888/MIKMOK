"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { videosApi } from "@/lib/api";
import { useFeedStore } from "@/stores/feedStore";
import VideoCard from "@/components/video/VideoCard";
import { Loader2 } from "lucide-react";
import type { Video, FeedType } from "@/types";

const feedTabs: { key: FeedType; label: string }[] = [
  { key: "foryou", label: "For You" },
  { key: "following", label: "Following" },
  { key: "trending", label: "Trending" },
];

export default function FeedPage() {
  const { feedType, setFeedType, currentIndex, setCurrentIndex } = useFeedStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["feed", feedType],
    queryFn: async ({ pageParam }) => {
      const res = await videosApi.getFeed(feedType, pageParam, 5);
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  const allVideos: Video[] = data?.pages.flatMap((page) => page.videos) || [];

  // Intersection Observer for infinite scroll
  const lastVideoRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Track which video is currently in view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute("data-index") || "0");
            setCurrentIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    container.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [allVideos.length, setCurrentIndex]);

  return (
    <div className="h-screen flex flex-col">
      {/* Feed Type Tabs */}
      <div className="sticky top-0 z-30 glass">
        <div className="flex items-center justify-center gap-6 py-3">
          {feedTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFeedType(tab.key)}
              className={`text-sm font-bold transition-colors relative pb-1 ${
                feedType === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {tab.label}
              {feedType === tab.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#40E0D0] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Video Feed */}
      <div
        ref={scrollRef}
        className="flex-1 feed-scroll no-scrollbar"
      >
        {isLoading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#40E0D0] animate-spin" />
              <p className="text-sm text-muted-foreground">Loading feed...</p>
            </div>
          </div>
        ) : allVideos.length === 0 ? (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-xl font-bold mb-2">No videos yet</h2>
              <p className="text-muted-foreground text-sm">
                {feedType === "following"
                  ? "Follow some creators to see their videos here"
                  : "Be the first to upload a video!"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {allVideos.map((video, index) => (
              <div
                key={video.id}
                data-index={index}
                ref={index === allVideos.length - 1 ? lastVideoRef : undefined}
                className="h-[calc(100vh-52px)] snap-start"
              >
                <VideoCard
                  video={video}
                  isActive={index === currentIndex}
                />
              </div>
            ))}

            {isFetchingNextPage && (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#40E0D0] animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
