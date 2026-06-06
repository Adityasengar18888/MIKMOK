import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

/**
 * GET /api/stats
 * Get public statistics for the landing page.
 */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalVideos, totalViewsData] = await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.video.aggregate({
        _sum: {
          views: true,
        },
      }),
    ]);

    res.json({
      creators: totalUsers,
      videos: totalVideos,
      views: totalViewsData._sum.views || 0,
    });
  } catch (error) {
    console.error("Public stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
