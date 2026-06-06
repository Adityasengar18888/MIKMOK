"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { notificationsApi } from "@/lib/api";
import { useApiToken } from "@/hooks/useAuthSync";
import { formatTimeAgo, cn } from "@/lib/utils";
import { Bell, Heart, MessageCircle, UserPlus, Check, Loader2 } from "lucide-react";
import type { Notification } from "@/types";

const typeIcons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
};

const typeColors = {
  like: "text-[#40E0D0] bg-[#40E0D0]/10",
  comment: "text-blue-400 bg-blue-400/10",
  follow: "text-[#00CED1] bg-[#00CED1]/10",
};

export default function NotificationsPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const getToken = useApiToken();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      await getToken();
      const res = await notificationsApi.getAll();
      return res.data;
    },
    enabled: isSignedIn === true,
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      await getToken();
      return notificationsApi.markRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to see notifications</h2>
          <button
            onClick={() => router.push("/sign-in")}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-[#40E0D0] to-[#00CED1] text-black font-bold rounded-xl"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount: number = data?.unreadCount || 0;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={() => markReadMutation.mutate()}
            disabled={markReadMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-[#40E0D0] font-medium hover:opacity-80"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#40E0D0] animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-1">No notifications yet</h2>
          <p className="text-sm text-muted-foreground">
            When someone interacts with your content, you&apos;ll see it here
          </p>
        </div>
      ) : (
        <div className="space-y-1 animate-fade-in">
          {notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            const colorClass = typeColors[notif.type] || "text-muted-foreground bg-muted";

            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl transition-colors",
                  !notif.read ? "bg-card border border-border" : "hover:bg-muted/50"
                )}
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTimeAgo(notif.createdAt)}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-[#40E0D0] flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
