"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useApiToken } from "@/hooks/useAuthSync";
import { useUserStore } from "@/stores/userStore";
import { useRouter } from "next/navigation";
import { formatCount } from "@/lib/utils";
import {
  Users,
  Film,
  Heart,
  MessageCircle,
  TrendingUp,
  Shield,
  Loader2,
  UserX,
  UserCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const user = useUserStore((s) => s.user);
  const router = useRouter();
  const getToken = useApiToken();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<"overview" | "users" | "videos">("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Check admin access
  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Admin privileges required</p>
        </div>
      </div>
    );
  }

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      await getToken();
      const res = await adminApi.getStats();
      return res.data;
    },
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", searchQuery],
    queryFn: async () => {
      await getToken();
      const res = await adminApi.getUsers(1, searchQuery || undefined);
      return res.data;
    },
    enabled: activeView === "users" || activeView === "overview",
  });

  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: async () => {
      await getToken();
      const res = await adminApi.getVideos();
      return res.data;
    },
    enabled: activeView === "videos",
  });

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      await getToken();
      return adminApi.banUser(userId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const restoreMutation = useMutation({
    mutationFn: async (userId: string) => {
      await getToken();
      return adminApi.restoreUser(userId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await getToken();
      return adminApi.deleteVideo(videoId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-videos"] }),
  });

  const stats = statsData?.stats;

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-400 bg-blue-400/10" },
    { label: "Total Videos", value: stats?.totalVideos || 0, icon: Film, color: "text-purple-400 bg-purple-400/10" },
    { label: "Total Likes", value: stats?.totalLikes || 0, icon: Heart, color: "text-[#40E0D0] bg-[#40E0D0]/10" },
    { label: "Total Comments", value: stats?.totalComments || 0, icon: MessageCircle, color: "text-green-400 bg-green-400/10" },
    { label: "New Users (Today)", value: stats?.newUsersToday || 0, icon: TrendingUp, color: "text-cyan-400 bg-cyan-400/10" },
    { label: "Banned Users", value: stats?.bannedUsers || 0, icon: UserX, color: "text-red-400 bg-red-400/10" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#40E0D0] to-[#00CED1] flex items-center justify-center">
          <Shield className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your platform</p>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "overview" as const, label: "Overview" },
          { key: "users" as const, label: "Users" },
          { key: "videos" as const, label: "Videos" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === tab.key
                ? "bg-[#40E0D0] text-black"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView === "overview" && (
        <div className="animate-fade-in">
          {statsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#40E0D0] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-2xl bg-card border border-border hover:border-[#40E0D0]/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{formatCount(stat.value)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Top Creators */}
          {statsData?.topCreators && (
            <div>
              <h3 className="font-bold mb-3">Top Creators</h3>
              <div className="space-y-2">
                {statsData.topCreators.map((creator: any, i: number) => (
                  <Link
                    key={creator.id}
                    href={`/profile/${creator.username}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#40E0D0] to-[#00CED1] flex items-center justify-center text-black text-xs font-bold">
                      {creator.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">@{creator.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCount(creator._count.followers)} followers · {formatCount(creator._count.videos)} videos
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Management */}
      {activeView === "users" && (
        <div className="animate-fade-in">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/30"
          />

          {usersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#40E0D0] animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {usersData?.users?.map((u: any) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#40E0D0] to-[#00CED1] flex items-center justify-center text-black font-bold text-sm">
                    {u.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">@{u.username}</p>
                      {u.role === "admin" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#00CED1]/20 text-[#00CED1] rounded font-bold">
                          ADMIN
                        </span>
                      )}
                      {u.banned && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded font-bold">
                          BANNED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {u.banned ? (
                      <button
                        onClick={() => restoreMutation.mutate(u.id)}
                        className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/20"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => banMutation.mutate(u.id)}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Videos Management */}
      {activeView === "videos" && (
        <div className="animate-fade-in">
          {videosLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#40E0D0] animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {videosData?.videos?.map((video: any) => (
                <div
                  key={video.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-6 h-6 text-muted-foreground m-auto mt-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{video.caption || "No caption"}</p>
                    <p className="text-xs text-muted-foreground">
                      @{video.user.username} · {formatCount(video.views)} views · {formatCount(video._count.likes)} likes
                    </p>
                  </div>
                  <button
                    onClick={() => deleteVideoMutation.mutate(video.id)}
                    className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
