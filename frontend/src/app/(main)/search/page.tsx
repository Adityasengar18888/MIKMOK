"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/api";
import { Search as SearchIcon, TrendingUp, Hash, User, Film, Loader2 } from "lucide-react";
import { formatCount } from "@/lib/utils";
import Link from "next/link";
import type { SearchResults } from "@/types";

const tabOptions = [
  { key: "all", label: "All", icon: SearchIcon },
  { key: "users", label: "Users", icon: User },
  { key: "videos", label: "Videos", icon: Film },
  { key: "hashtags", label: "Tags", icon: Hash },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    // Simple debounce
    const timer = setTimeout(() => setDebouncedQuery(value), 300);
    return () => clearTimeout(timer);
  }, []);

  const { data: results, isLoading } = useQuery<SearchResults>({
    queryKey: ["search", debouncedQuery, activeTab],
    queryFn: async () => {
      const res = await searchApi.search(debouncedQuery, activeTab);
      return res.data;
    },
    enabled: debouncedQuery.length > 0,
  });

  const { data: trendingData } = useQuery({
    queryKey: ["trending-hashtags"],
    queryFn: async () => {
      const res = await searchApi.getTrending();
      return res.data;
    },
  });

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Search Input */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users, videos, hashtags..."
          className="w-full bg-input border border-border rounded-2xl pl-12 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/30"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {tabOptions.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-[#40E0D0] text-black"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#40E0D0] animate-spin" />
        </div>
      ) : debouncedQuery && results ? (
        <div className="space-y-6 animate-fade-in">
          {/* Users */}
          {results.users && results.users.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">
                Users
              </h3>
              <div className="space-y-2">
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#40E0D0] to-[#00CED1] flex items-center justify-center text-black font-bold">
                        {user.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">@{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.name} · {formatCount(user._count.followers)} followers
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {results.videos && results.videos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">
                Videos
              </h3>
              <div className="grid grid-cols-3 gap-1">
                {results.videos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/feed?v=${video.id}`}
                    className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted group"
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.caption || ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <video src={video.videoUrl} className="w-full h-full object-cover" muted preload="metadata" />
                    )}
                    <div className="absolute bottom-1 left-1 text-black text-[10px] font-medium drop-shadow-lg">
                      ▶ {formatCount(video.views)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags */}
          {results.hashtags && results.hashtags.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">
                Hashtags
              </h3>
              <div className="space-y-2">
                {results.hashtags.map((tag) => (
                  <button
                    key={tag.tag}
                    onClick={() => {
                      setQuery(tag.tag);
                      setDebouncedQuery(tag.tag);
                      setActiveTab("videos");
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors w-full text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                      <Hash className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">#{tag.tag}</p>
                      <p className="text-xs text-muted-foreground">{formatCount(tag.count)} videos</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {!results.users?.length && !results.videos?.length && !results.hashtags?.length && (
            <div className="text-center py-12">
              <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No results found for &ldquo;{debouncedQuery}&rdquo;</p>
            </div>
          )}
        </div>
      ) : (
        /* Trending when no search */
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#40E0D0]" />
            <h2 className="font-bold">Trending Hashtags</h2>
          </div>
          <div className="space-y-2">
            {trendingData?.trending?.map((tag: { tag: string; count: number }, i: number) => (
              <button
                key={tag.tag}
                onClick={() => {
                  setQuery(tag.tag);
                  setDebouncedQuery(tag.tag);
                  setActiveTab("videos");
                }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors w-full text-left"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">#{tag.tag}</p>
                  <p className="text-xs text-muted-foreground">{formatCount(tag.count)} videos</p>
                </div>
              </button>
            )) || (
              <p className="text-muted-foreground text-center py-8">No trending hashtags yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
