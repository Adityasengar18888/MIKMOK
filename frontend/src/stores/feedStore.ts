"use client";

import { create } from "zustand";
import type { FeedType } from "@/types";

interface FeedState {
  feedType: FeedType;
  isMuted: boolean;
  currentIndex: number;
  setFeedType: (type: FeedType) => void;
  toggleMute: () => void;
  setCurrentIndex: (index: number) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  feedType: "foryou",
  isMuted: true, // Start muted like TikTok
  currentIndex: 0,
  setFeedType: (feedType) => set({ feedType, currentIndex: 0 }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
}));
