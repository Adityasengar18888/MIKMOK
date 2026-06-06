"use client";

import { create } from "zustand";
import type { User } from "@/types";

interface UserState {
  user: User | null;
  isLoaded: boolean;
  setUser: (user: User | null) => void;
  setLoaded: (loaded: boolean) => void;
  updateUser: (data: Partial<User>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoaded: false,
  setUser: (user) => set({ user, isLoaded: true }),
  setLoaded: (isLoaded) => set({ isLoaded }),
  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),
}));
