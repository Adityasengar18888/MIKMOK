"use client";

import { useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { setAuthToken, authApi } from "@/lib/api";
import { useUserStore } from "@/stores/userStore";

/**
 * Hook to sync Clerk auth state with our API client and database.
 * Should be called once in the app layout.
 */
export function useAuthSync() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const { setUser, setLoaded } = useUserStore();

  const syncUser = useCallback(async () => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setAuthToken(null);
      setUser(null);
      return;
    }

    try {
      const token = await getToken();
      setAuthToken(token);

      try {
        const { data } = await authApi.getMe();
        setUser(data.user);
      } catch (error: any) {
        // If the user is not found in the DB (e.g., first login after DB reset), sync them
        if (error.response?.status === 404 && clerkUser) {
          const { data } = await authApi.sync({
            username: clerkUser.username || clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            name: clerkUser.fullName || undefined,
            avatar: clerkUser.imageUrl,
          });
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error("Failed to sync user:", error);
    } finally {
      setLoaded(true);
    }
  }, [isSignedIn, isLoaded, getToken, clerkUser, setUser, setLoaded]);

  useEffect(() => {
    syncUser();
  }, [syncUser]);
}

/**
 * Hook to get a fresh auth token for API calls.
 */
export function useApiToken() {
  const { getToken } = useAuth();

  return useCallback(async () => {
    const token = await getToken();
    setAuthToken(token);
    return token;
  }, [getToken]);
}
