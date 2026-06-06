import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { createNotification } from "../services/notification";

const router = Router();

/**
 * POST /api/likes
 * Like a video.
 */
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.dbUser) {
      res.status(401).json({ error: "User not registered" });
      return;
    }

    const { videoId } = req.body;

    if (!videoId) {
      res.status(400).json({ error: "Video ID is required" });
      return;
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { userId: true },
    });

    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: { userId_videoId: { userId: req.dbUser.id, videoId } },
    });

    if (existingLike) {
      res.status(409).json({ error: "Already liked" });
      return;
    }

    await prisma.like.create({
      data: { userId: req.dbUser.id, videoId },
    });

    const likeCount = await prisma.like.count({ where: { videoId } });

    // Create notification for video owner (if not self)
    if (video.userId !== req.dbUser.id) {
      await createNotification({
        userId: video.userId,
        type: "like",
        message: `${req.dbUser.username} liked your video`,
        metadata: { videoId },
      });
    }

    res.status(201).json({ liked: true, likeCount });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ error: "Failed to like video" });
  }
});

/**
 * DELETE /api/likes
 * Unlike a video.
 */
router.delete("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.dbUser) {
      res.status(401).json({ error: "User not registered" });
      return;
    }

    const { videoId } = req.body;

    if (!videoId) {
      res.status(400).json({ error: "Video ID is required" });
      return;
    }

    await prisma.like.delete({
      where: { userId_videoId: { userId: req.dbUser.id, videoId } },
    });

    const likeCount = await prisma.like.count({ where: { videoId } });

    res.json({ liked: false, likeCount });
  } catch (error) {
    console.error("Unlike error:", error);
    res.status(500).json({ error: "Failed to unlike video" });
  }
});

export default router;
