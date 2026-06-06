import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { createNotification } from "../services/notification";

const router = Router();

/**
 * POST /api/follows
 * Follow a user.
 */
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.dbUser) {
      res.status(401).json({ error: "User not registered" });
      return;
    }

    const { followingId } = req.body;

    if (!followingId) {
      res.status(400).json({ error: "Following ID is required" });
      return;
    }

    if (followingId === req.dbUser.id) {
      res.status(400).json({ error: "Cannot follow yourself" });
      return;
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.dbUser.id,
          followingId,
        },
      },
    });

    if (existingFollow) {
      res.status(409).json({ error: "Already following" });
      return;
    }

    await prisma.follow.create({
      data: {
        followerId: req.dbUser.id,
        followingId,
      },
    });

    // Create notification
    await createNotification({
      userId: followingId,
      type: "follow",
      message: `${req.dbUser.username} started following you`,
      metadata: { followerId: req.dbUser.id },
    });

    const followerCount = await prisma.follow.count({
      where: { followingId },
    });

    res.status(201).json({ followingId: true, followerCount });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

/**
 * DELETE /api/follows
 * Unfollow a user.
 */
router.delete("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.dbUser) {
      res.status(401).json({ error: "User not registered" });
      return;
    }

    const { followingId } = req.body;

    if (!followingId) {
      res.status(400).json({ error: "Following ID is required" });
      return;
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: req.dbUser.id,
          followingId,
        },
      },
    });

    const followerCount = await prisma.follow.count({
      where: { followingId },
    });

    res.json({ followingId: false, followerCount });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

/**
 * GET /api/follows/:userId/followers
 * Get a user's followers.
 */
router.get("/:userId/followers", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const { cursor, limit = "20" } = req.query;
    const take = Math.min(parseInt(limit as string), 50);

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
    });

    const hasMore = followers.length > take;
    const data = hasMore ? followers.slice(0, take) : followers;

    res.json({
      followers: data.map((f) => f.follower),
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ error: "Failed to get followers" });
  }
});

/**
 * GET /api/follows/:userId/following
 * Get users that a user follows.
 */
router.get("/:userId/following", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const { cursor, limit = "20" } = req.query;
    const take = Math.min(parseInt(limit as string), 50);

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
    });

    const hasMore = following.length > take;
    const data = hasMore ? following.slice(0, take) : following;

    res.json({
      following: data.map((f) => f.following),
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ error: "Failed to get following" });
  }
});

export default router;
