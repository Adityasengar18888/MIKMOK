import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";

const router = Router();

/**
 * GET /api/search?q=...&type=users|videos|hashtags
 * Search for users, videos, or hashtags.
 */
router.get("/", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, type = "all", limit = "20" } = req.query;
    const take = Math.min(parseInt(limit as string), 50);

    if (!q || typeof q !== "string" || q.trim().length === 0) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const query = q.trim();
    const results: Record<string, unknown> = {};

    // Search users
    if (type === "all" || type === "users") {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
          banned: false,
        },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          _count: { select: { followers: true, videos: true } },
        },
        take,
        orderBy: { followers: { _count: "desc" } },
      });
      results.users = users;
    }

    // Search videos
    if (type === "all" || type === "videos") {
      const videos = await prisma.video.findMany({
        where: {
          OR: [
            { caption: { contains: query, mode: "insensitive" } },
            { hashtags: { has: query.toLowerCase().replace("#", "") } },
          ],
        },
        include: {
          user: { select: { id: true, username: true, name: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
        },
        take,
        orderBy: { createdAt: "desc" },
      });
      results.videos = videos;
    }

    // Search hashtags (aggregate from videos)
    if (type === "all" || type === "hashtags") {
      // Get all unique hashtags matching the query
      const videosWithHashtags = await prisma.video.findMany({
        where: {
          hashtags: { has: query.toLowerCase().replace("#", "") },
        },
        select: { hashtags: true },
        take: 100,
      });

      // Count hashtag occurrences
      const hashtagCounts = new Map<string, number>();
      videosWithHashtags.forEach((v) => {
        v.hashtags.forEach((tag) => {
          if (tag.toLowerCase().includes(query.toLowerCase().replace("#", ""))) {
            hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
          }
        });
      });

      const hashtags = Array.from(hashtagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, take);

      results.hashtags = hashtags;
    }

    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * GET /api/search/trending
 * Get trending hashtags.
 */
router.get("/trending", async (_req: Request, res: Response): Promise<void> => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const recentVideos = await prisma.video.findMany({
      where: { createdAt: { gte: since } },
      select: { hashtags: true },
      take: 500,
    });

    const hashtagCounts = new Map<string, number>();
    recentVideos.forEach((v) => {
      v.hashtags.forEach((tag) => {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      });
    });

    const trending = Array.from(hashtagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    res.json({ trending });
  } catch (error) {
    console.error("Trending error:", error);
    res.status(500).json({ error: "Failed to get trending" });
  }
});

export default router;
