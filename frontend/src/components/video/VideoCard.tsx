"use client";

import Link from "next/link";
import VideoPlayer from "./VideoPlayer";
import LikeButton from "../social/LikeButton";
import CommentSheet from "../social/CommentSheet";
import ShareButton from "../social/ShareButton";
import FollowButton from "../social/FollowButton";
import { formatCount, cn } from "@/lib/utils";
import { Music } from "lucide-react";
import type { Video } from "@/types";

interface VideoCardProps {
  video: Video;
  isActive: boolean;
}

export default function VideoCard({ video, isActive }: VideoCardProps) {
  return (
    <div className="relative w-full h-[calc(100vh-88px)] lg:h-screen max-w-[520px] mx-auto flex items-center">
      <div className="relative w-full h-full max-h-[88vh] overflow-hidden rounded-[2rem] bg-slate-950 shadow-soft">
        {video.mediaType === "photo" ? (
          <img
            src={video.videoUrl}
            alt={video.caption || "Photo post"}
            className="w-full h-full object-cover"
          />
        ) : (
          <VideoPlayer videoUrl={video.videoUrl} videoId={video.id} isActive={isActive} />
        )}

        <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

        <div className="absolute bottom-6 left-4 right-24 z-20">
          <div className="flex items-center gap-3 mb-4 rounded-full bg-white/10 px-3 py-2 backdrop-blur-xl shadow-soft border border-white/10">
            <Link href={`/profile/${video.user.username}`} className="group inline-flex items-center gap-3">
              {video.user.avatar ? (
                <img
                  src={video.user.avatar}
                  alt={video.user.username}
                  className="h-12 w-12 rounded-full border border-white/20 object-cover shadow-lg transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#06b6d4] to-[#14b8a6] text-black font-bold shadow-lg transition-transform duration-200 group-hover:scale-105">
                  {video.user.username[0]?.toUpperCase()}
                </div>
              )}
            </Link>

            <div className="min-w-0">
              <Link
                href={`/profile/${video.user.username}`}
                className="block truncate text-base font-semibold text-white hover:underline"
              >
                @{video.user.username}
              </Link>
              <FollowButton
                userId={video.user.id}
                username={video.user.username}
                size="sm"
                className="mt-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/25"
              />
            </div>
          </div>

          {video.caption && (
            <p className="mb-3 text-sm leading-6 text-white/95 line-clamp-2">
              {video.caption}
            </p>
          )}

          {video.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {video.hashtags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}&type=hashtags`}
                  className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-medium text-white/75">
            <Music className={cn("w-3.5 h-3.5", video.mediaType !== "photo" && "animate-spin-slow")} />
            <span className="truncate">
              {video.mediaType === "photo"
                ? "Photo post"
                : `Original audio – @${video.user.username}`}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute right-4 bottom-20 z-20 flex flex-col items-center gap-5 rounded-[2rem] bg-slate-950/70 p-4 shadow-soft backdrop-blur-xl border border-white/10">
        <LikeButton videoId={video.id} initialLiked={video.isLiked || false} initialCount={video._count.likes} />
        <CommentSheet videoId={video.id} commentCount={video._count.comments} />
        <ShareButton videoId={video.id} />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
          <Music className={cn("w-5 h-5 text-white", video.mediaType !== "photo" && "animate-spin-slow")} />
        </div>
      </div>
    </div>
  );
}
