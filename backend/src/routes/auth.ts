import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * POST /api/auth/sync
 * Sync Clerk user data to our database.
 * Called from the frontend after sign-up/sign-in.
 */
router.post("/sync", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, name, avatar } = req.body;
    const clerkId = req.userId!;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { clerkId },
        data: {
          ...(name && { name }),
          ...(avatar && { avatar }),
        },
      });
    } else {
      // Create new user
      if (!username || !email) {
        res.status(400).json({ error: "Username and email are required" });
        return;
      }

      // Check username uniqueness
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        res.status(409).json({ error: "Username already taken" });
        return;
      }

      user = await prisma.user.create({
        data: {
          clerkId,
          username,
          email,
          name: name || username,
          avatar,
        },
      });
    }

    res.json({ user });
  } catch (error) {
    console.error("Auth sync error:", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
});

/**
 * GET /api/auth/me
 * Get the current authenticated user's profile.
 */
router.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: req.userId! },
      include: {
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
      res.status(404).json({ error: "User not found. Please complete registration." });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
