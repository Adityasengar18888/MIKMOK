import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";
import { verifyToken } from "@clerk/backend";
import prisma from "../lib/prisma";

// Extend Express Request to include auth info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      dbUser?: {
        id: string;
        clerkId: string;
        username: string;
        email: string;
        name: string | null;
        avatar: string | null;
        bio: string | null;
        role: string;
        banned: boolean;
      };
    }
  }
}

/**
 * Middleware to verify Clerk JWT and attach user info to request.
 * Sets req.userId (Clerk ID) and req.dbUser (database user record).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Verify the token with Clerk
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const clerkUserId = verifiedToken.sub;
    if (!clerkUserId) {
      res.status(401).json({ error: "Unauthorized: Invalid token" });
      return;
    }

    req.userId = clerkUserId;

    // Find the user in our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (dbUser) {
      if (dbUser.banned) {
        res.status(403).json({ error: "Account has been suspended" });
        return;
      }
      req.dbUser = dbUser;
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Unauthorized: Token verification failed" });
  }
}

/**
 * Optional auth – does not reject unauthenticated requests,
 * but attaches user info if a valid token is present.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.split(" ")[1];
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const clerkUserId = verifiedToken.sub;
    if (clerkUserId) {
      req.userId = clerkUserId;
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });
      if (dbUser && !dbUser.banned) {
        req.dbUser = dbUser;
      }
    }
  } catch {
    // Silently continue without auth
  }
  next();
}

/**
 * Middleware to require admin role.
 * Must be used after requireAuth.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.dbUser || req.dbUser.role !== "admin") {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }
  next();
}
