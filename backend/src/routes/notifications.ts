import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * GET /api/notifications
 * Get the current user's notifications.
 */
router.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.dbUser) {
      res.status(401).json({ error: "User not registered" });
      return;
    }

    const { cursor, limit = "20" } = req.query;
    const take = Math.min(parseInt(limit as string), 50);

    const notifications = await prisma.notification.findMany({
      where: { userId: req.dbUser.id },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
    });

    const hasMore = notifications.length > take;
    const data = hasMore ? notifications.slice(0, take) : notifications;

    const unreadCount = await prisma.notification.count({
      where: { userId: req.dbUser.id, read: false },
    });

    res.json({
      notifications: data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

/**
 * PATCH /api/notifications/read
 * Mark notifications as read.
 */
router.patch("/read", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.dbUser) {
      res.status(401).json({ error: "User not registered" });
      return;
    }

    const { ids } = req.body; // Optional: specific notification IDs

    if (ids && Array.isArray(ids)) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: req.dbUser.id },
        data: { read: true },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: req.dbUser.id, read: false },
        data: { read: true },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

export default router;
