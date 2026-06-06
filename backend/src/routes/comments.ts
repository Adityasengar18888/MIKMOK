import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { createNotification } from "../services/notification";

const router = Router();

/**
 * GET /api/videos/:videoId/comments
 * Get comments for a video (top-level, with reply counts).
 */
router.get("/videos/:videoId/comments", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const videoId = String(req.params.videoId);
    const { cursor, limit = "20" } = req.query;
    const take = Math.min(parseInt(limit as string), 50);

    const comments = await prisma.comment.findMany({
      where: {
        videoId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatar: true },
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
    });

    const hasMore = comments.length > take;
    const data = hasMore ? comments.slice(0, take) : comments;

    res.json({
      comments: data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Failed to get comments" });
  }
});

/**
 * GET /api/comments/:commentId/replies
 * Get replies to a comment.
 */
router.get("/:commentId/replies", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const commentId = String(req.params.commentId);

    const replies = await prisma.comment.findMany({
      where: { parentId: commentId },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ replies });
  } catch (error) {
    console.error("Get replies error:", error);
    res.status(500).json({ error: "Failed to get replies" });
  }
});

/**
 * POST /api/comments
 * Add a comment to a video.
 */
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.dbUser) {
      res.status(401).json({ error: "User not registered" });
      return;
    }

    const { videoId, content, parentId } = req.body;

    if (!videoId || !content || content.trim().length === 0) {
      res.status(400).json({ error: "Video ID and content are required" });
      return;
    }

    // Basic profanity filter (extensible)
    const profanityList = ["badword1", "badword2"]; // Extend as needed
    const containsProfanity = profanityList.some((word) =>
      content.toLowerCase().includes(word)
    );
    if (containsProfanity) {
      res.status(400).json({ error: "Comment contains inappropriate language" });
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

    const comment = await prisma.comment.create({
      data: {
        userId: req.dbUser.id,
        videoId,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatar: true },
        },
        _count: { select: { replies: true } },
      },
    });

    // Create notification for video owner (if not self)
    if (video.userId !== req.dbUser.id) {
      await createNotification({
        userId: video.userId,
        type: "comment",
        message: `${req.dbUser.username} commented on your video`,
        metadata: { videoId, commentId: comment.id },
      });
    }

    res.status(201).json({ comment });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

/**
 * DELETE /api/comments/:id
 * Delete a comment (owner or admin).
 */
router.delete("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    if (comment.userId !== req.dbUser?.id && req.dbUser?.role !== "admin") {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    await prisma.comment.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
