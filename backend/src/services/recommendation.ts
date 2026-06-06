import prisma from "../lib/prisma";

interface VideoScore {
  videoId: string;
  score: number;
}

/**
 * Calculate recommendation score for a video.
 * Score = (likes × 3) + (comments × 5) + (shares × 10) + views
 */
export async function calculateVideoScore(videoId: string): Promise<number> {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!video) return 0;

  const likesScore = video._count.likes * 3;
  const commentsScore = video._count.comments * 5;
  const viewsScore = video.views;

  return likesScore + commentsScore + viewsScore;
}

/**
 * Get trending videos ranked by engagement score.
 * Optionally filter by time window.
 */
export async function getTrendingVideos(
  limit: number = 20,
  hoursAgo: number = 168 // 7 days default
): Promise<VideoScore[]> {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  const videos = await prisma.video.findMany({
    where: {
      createdAt: { gte: since },
    },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200, // Get a pool to score
  });

  const scored: VideoScore[] = videos.map((video) => ({
    videoId: video.id,
    score:
      video._count.likes * 3 +
      video._count.comments * 5 +
      video.views,
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/**
 * Get personalized "For You" feed based on user's engagement history.
 * Considers videos liked by users they follow, and popular content
 * in hashtags they've engaged with.
 */
export async function getForYouFeed(
  userId: string,
  limit: number = 20,
  cursor?: string
): Promise<string[]> {
  // Get users this person follows
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  // Get hashtags from videos the user has liked
  const likedVideos = await prisma.like.findMany({
    where: { userId },
    include: {
      video: { select: { hashtags: true } },
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  });
  const engagedHashtags = Array.from(
    new Set(likedVideos.flatMap((l) => l.video.hashtags))
  );

  // Get videos from followed users + trending + hashtag-matched
  const videos = await prisma.video.findMany({
    where: {
      AND: [
        { userId: { not: userId } }, // Exclude own videos
        ...(cursor ? [{ id: { lt: cursor } }] : []),
      ],
      OR: [
        // Videos from followed users
        ...(followingIds.length > 0 ? [{ userId: { in: followingIds } }] : []),
        // Videos with matching hashtags
        ...(engagedHashtags.length > 0
          ? [{ hashtags: { hasSome: engagedHashtags } }]
          : []),
        // Recent popular videos (fallback)
        { views: { gte: 1 } },
      ],
    },
    include: {
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Score and rank
  const scored = videos.map((video) => ({
    id: video.id,
    score:
      video._count.likes * 3 +
      video._count.comments * 5 +
      video.views +
      // Boost followed creators
      (followingIds.includes(video.userId) ? 50 : 0) +
      // Boost matching hashtags
      (video.hashtags.some((h) => engagedHashtags.includes(h)) ? 30 : 0),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((v) => v.id);
}
