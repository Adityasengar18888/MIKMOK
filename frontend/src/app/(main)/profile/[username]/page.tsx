"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { useUserStore } from "@/stores/userStore";
import FollowButton from "@/components/social/FollowButton";
import { formatCount } from "@/lib/utils";
import { Grid3X3, Settings, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Video } from "@/types";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const currentUser = useUserStore((s) => s.user);
  const isOwnProfile = currentUser?.username === username;

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await usersApi.getProfile(username);
      return res.data.user;
    },
  });

  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ["userVideos", username],
    queryFn: async () => {
      const res = await usersApi.getUserVideos(username);
      return res.data;
    },
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#40E0D0] animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground">@{username} doesn&apos;t exist</p>
        </div>
      </div>
    );
  }

  const user = profileData;
  const videos: Video[] = videosData?.videos || [];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* Avatar */}
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-24 h-24 rounded-full border-4 border-border object-cover mb-4"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#40E0D0] to-[#00CED1] flex items-center justify-center text-black text-3xl font-black mb-4">
            {user.username[0]?.toUpperCase()}
          </div>
        )}

        <h1 className="text-xl font-bold">@{user.username}</h1>
        {user.name && (
          <p className="text-muted-foreground text-sm">{user.name}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-8 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold">{formatCount(user._count?.following || 0)}</div>
            <div className="text-xs text-muted-foreground">Following</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{formatCount(user._count?.followers || 0)}</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{formatCount(user._count?.videos || 0)}</div>
            <div className="text-xs text-muted-foreground">Videos</div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-4 text-sm text-foreground/80 max-w-sm leading-relaxed">
            {user.bio}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-5">
          {isOwnProfile ? (
            <Link
              href="/profile/edit"
              className="flex items-center gap-2 px-6 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </Link>
          ) : (
            <FollowButton
              userId={user.id}
              username={user.username}
              initialFollowing={user.isFollowing}
              size="md"
            />
          )}
        </div>
      </div>

      {/* Videos Grid */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
          <Grid3X3 className="w-4 h-4" />
          Videos
        </div>

        {videosLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[9/16] skeleton rounded-xl" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-muted-foreground font-medium">
              {isOwnProfile
                ? "Upload your first video!"
                : "No videos yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={`/feed?v=${video.id}`}
                className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black group shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.caption || ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <video
                    src={video.videoUrl}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    muted
                    preload="metadata"
                  />
                )}
                {/* View count overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-2 px-2">
                  <div className="flex items-center gap-1 text-white text-[11px] font-bold drop-shadow-md">
                    <span className="text-[10px]">▶</span> {formatCount(video.views)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
