import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

/**
 * GET /api/users/:username
 * Get a user's public profile by username.
 */
router.get("/:username", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const username = String(req.params.username);

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            videos: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if current user follows this profile
    let isFollowing = false;
    if (req.dbUser) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.dbUser.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    res.json({ user: { ...user, isFollowing } });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/**
 * PATCH /api/users/profile
 * Update current user's profile.
 */
router.patch("/profile", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, bio, avatar, username } = req.body;
    const clerkId = req.userId!;

    // If changing username, check uniqueness
    if (username) {
      const existing = await prisma.user.findFirst({
        where: {
          username,
          clerkId: { not: clerkId },
        },
      });
      if (existing) {
        res.status(409).json({ error: "Username already taken" });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { clerkId },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(username !== undefined && { username }),
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * GET /api/users/:username/videos
 * Get videos uploaded by a specific user.
 */
router.get("/:username/videos", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const username = String(req.params.username);
    const { cursor, limit = "12" } = req.query;
    const take = Math.min(parseInt(limit as string), 50);

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const videos = await prisma.video.findMany({
      where: { userId: user.id },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatar: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
    });

    const hasMore = videos.length > take;
    const data = hasMore ? videos.slice(0, take) : videos;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    res.json({ videos: data, nextCursor, hasMore });
  } catch (error) {
    console.error("Get user videos error:", error);
    res.status(500).json({ error: "Failed to get videos" });
  }
});

export default router;
