import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

type NotificationType = "follow" | "like" | "comment";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service to create in-app notifications.
 * Called by route handlers when social events occur.
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, message, metadata } = params;

  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Don't throw – notifications are non-critical
  }
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}
