// TypeScript type definitions for MikMok

export interface User {
  id: string;
  clerkId?: string;
  username: string;
  email?: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  role?: string;
  banned?: boolean;
  createdAt: string;
  isFollowing?: boolean;
  _count?: {
    videos: number;
    followers: number;
    following: number;
  };
}

export interface Video {
  id: string;
  userId: string;
  mediaType: "video" | "photo";
  caption: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  hashtags: string[];
  views: number;
  duration: number | null;
  createdAt: string;
  user: Pick<User, "id" | "username" | "name" | "avatar">;
  isLiked?: boolean;
  _count: {
    likes: number;
    comments: number;
  };
}

export interface Comment {
  id: string;
  userId: string;
  videoId: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: Pick<User, "id" | "username" | "name" | "avatar">;
  _count?: {
    replies: number;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: "follow" | "like" | "comment";
  message: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface VideoFeedResponse {
  videos: Video[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SearchResults {
  users?: (User & { _count: { followers: number; videos: number } })[];
  videos?: Video[];
  hashtags?: { tag: string; count: number }[];
}

export interface AdminStats {
  totalUsers: number;
  totalVideos: number;
  totalComments: number;
  totalLikes: number;
  newUsersToday: number;
  newVideosToday: number;
  newUsersWeek: number;
  newVideosWeek: number;
  bannedUsers: number;
}

export type FeedType = "foryou" | "following" | "trending" | "latest";
