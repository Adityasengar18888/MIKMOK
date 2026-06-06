import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Get dashboard statistics.
 */
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalVideos,
      totalComments,
      totalLikes,
      newUsersToday,
      newVideosToday,
      newUsersWeek,
      newVideosWeek,
      bannedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.video.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.video.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.user.count({ where: { banned: true } }),
    ]);

    // Get top creators by follower count
    const topCreators = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        _count: { select: { followers: true, videos: true } },
      },
      orderBy: { followers: { _count: "desc" } },
      take: 10,
    });

    res.json({
      stats: {
        totalUsers,
        totalVideos,
        totalComments,
        totalLikes,
        newUsersToday,
        newVideosToday,
        newUsersWeek,
        newVideosWeek,
        bannedUsers,
      },
      topCreators,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

/**
 * GET /api/admin/users
 * List all users with pagination.
 */
router.get("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = "1", limit = "20", search, filter } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = Math.min(parseInt(limit as string), 100);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
        { name: { contains: search as string, mode: "insensitive" } },
      ];
    }
    if (filter === "banned") where.banned = true;
    if (filter === "admin") where.role = "admin";

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          clerkId: true,
          username: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          banned: true,
          createdAt: true,
          _count: { select: { videos: true, followers: true, following: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

/**
 * PATCH /api/admin/users/:id/ban
 * Ban a user.
 */
router.patch("/users/:id/ban", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { banned: true },
    });
    res.json({ user, message: "User banned successfully" });
  } catch (error) {
    console.error("Ban user error:", error);
    res.status(500).json({ error: "Failed to ban user" });
  }
});

/**
 * PATCH /api/admin/users/:id/restore
 * Restore (unban) a user.
 */
router.patch("/users/:id/restore", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { banned: false },
    });
    res.json({ user, message: "User restored successfully" });
  } catch (error) {
    console.error("Restore user error:", error);
    res.status(500).json({ error: "Failed to restore user" });
  }
});

/**
 * GET /api/admin/videos
 * List all videos for moderation.
 */
router.get("/videos", async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = "1", limit = "20", search } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = Math.min(parseInt(limit as string), 100);

    const where: Record<string, unknown> = {};
    if (search) {
      where.caption = { contains: search as string, mode: "insensitive" };
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, name: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.video.count({ where }),
    ]);

    res.json({
      videos,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("Admin videos error:", error);
    res.status(500).json({ error: "Failed to get videos" });
  }
});

/**
 * DELETE /api/admin/videos/:id
 * Delete any video (admin power).
 */
router.delete("/videos/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.video.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: "Video deleted" });
  } catch (error) {
    console.error("Admin delete video error:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
});

export default router;
