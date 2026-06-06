import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import prisma from "../lib/prisma";
import cloudinary from "../lib/cloudinary";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { getTrendingVideos, getForYouFeed } from "../services/recommendation";

const router = Router();

// Configure multer for temporary file storage
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
      "image/jpeg", "image/png", "image/webp", "image/jpg"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only MP4, WebM, MOV, and common image formats are allowed"));
    }
  },
});

/**
 * POST /api/videos/upload
 * Upload media (video or photo) to Cloudinary and store metadata.
 */
router.post(
  "/upload",
  requireAuth,
  upload.single("video"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.dbUser) {
        res.status(401).json({ error: "User not registered" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No media file provided" });
        return;
      }

      const { caption, hashtags } = req.body;
      const hashtagArray = hashtags
        ? (typeof hashtags === "string" ? JSON.parse(hashtags) : hashtags)
        : [];

      const isImage = req.file.mimetype.startsWith("image/");
      const resourceType = isImage ? "image" : "video";

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: resourceType,
        folder: isImage ? "mikmok/photos" : "mikmok/videos",
        ...(isImage 
          ? { transformation: [{ quality: "auto", fetch_format: "auto" }] }
          : { transformation: [{ quality: "auto", fetch_format: "mp4" }] }
        ),
      });

      // Generate thumbnail
      let thumbnailUrl = result.secure_url;
      if (!isImage) {
        thumbnailUrl = cloudinary.url(result.public_id, {
          resource_type: "video",
          format: "jpg",
          transformation: [
            { width: 400, height: 710, crop: "fill", gravity: "auto" },
            { start_offset: "1" },
          ],
        });
      }

      // Clean up temporary file
      fs.unlinkSync(req.file.path);

      // Store in database
      const video = await prisma.video.create({
        data: {
          userId: req.dbUser.id,
          mediaType: isImage ? "photo" : "video",
          caption: caption || "",
          videoUrl: result.secure_url,
          thumbnailUrl,
          hashtags: hashtagArray,
          duration: result.duration || null,
        },
        include: {
          user: {
            select: { id: true, username: true, name: true, avatar: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      });

      res.status(201).json({ video });
    } catch (error) {
      // Clean up temp file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  }
);

/**
 * GET /api/videos
 * Get video feed with pagination. Supports ?type=foryou|following|trending|latest
 */
router.get("/", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = "latest", cursor, limit = "10" } = req.query;
    const take = Math.min(parseInt(limit as string), 30);

    let videoIds: string[] | null = null;

    if (type === "trending") {
      const trending = await getTrendingVideos(take);
      videoIds = trending.map((t) => t.videoId);
    } else if (type === "foryou" && req.dbUser) {
      videoIds = await getForYouFeed(req.dbUser.id, take, cursor as string);
    } else if (type === "following" && req.dbUser) {
      // Get videos from followed users
      const following = await prisma.follow.findMany({
        where: { followerId: req.dbUser.id },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);

      if (followingIds.length === 0) {
        res.json({ videos: [], nextCursor: null, hasMore: false });
        return;
      }

      const videos = await prisma.video.findMany({
        where: { userId: { in: followingIds } },
        include: {
          user: { select: { id: true, username: true, name: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
      });

      const hasMore = videos.length > take;
      const data = hasMore ? videos.slice(0, take) : videos;

      // Add isLiked status
      let videosWithLikeStatus = data;
      if (req.dbUser) {
        const likes = await prisma.like.findMany({
          where: {
            userId: req.dbUser.id,
            videoId: { in: data.map((v) => v.id) },
          },
        });
        const likedIds = new Set(likes.map((l) => l.videoId));
        videosWithLikeStatus = data.map((v) => ({
          ...v,
          isLiked: likedIds.has(v.id),
        }));
      }

      res.json({
        videos: videosWithLikeStatus,
        nextCursor: hasMore ? data[data.length - 1].id : null,
        hasMore,
      });
      return;
    }

    // For trending/foryou with IDs, or default latest
    let videos;
    if (videoIds && videoIds.length > 0) {
      videos = await prisma.video.findMany({
        where: { id: { in: videoIds } },
        include: {
          user: { select: { id: true, username: true, name: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });
      // Preserve ranking order
      const orderMap = new Map(videoIds.map((id, i) => [id, i]));
      videos.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
    } else {
      videos = await prisma.video.findMany({
        include: {
          user: { select: { id: true, username: true, name: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        ...(cursor && { cursor: { id: cursor as string }, skip: 1 }),
      });
    }

    const hasMore = !videoIds && videos.length > take;
    const data = hasMore ? videos.slice(0, take) : videos;

    // Add isLiked status
    let videosWithLikeStatus = data;
    if (req.dbUser) {
      const likes = await prisma.like.findMany({
        where: {
          userId: req.dbUser.id,
          videoId: { in: data.map((v) => v.id) },
        },
      });
      const likedIds = new Set(likes.map((l) => l.videoId));
      videosWithLikeStatus = data.map((v) => ({
        ...v,
        isLiked: likedIds.has(v.id),
      }));
    }

    res.json({
      videos: videosWithLikeStatus,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    console.error("Get videos error:", error);
    res.status(500).json({ error: "Failed to get videos" });
  }
});

/**
 * GET /api/videos/:id
 * Get a single video by ID.
 */
router.get("/:id", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    let isLiked = false;
    if (req.dbUser) {
      const like = await prisma.like.findUnique({
        where: { userId_videoId: { userId: req.dbUser.id, videoId: video.id } },
      });
      isLiked = !!like;
    }

    res.json({ video: { ...video, isLiked } });
  } catch (error) {
    console.error("Get video error:", error);
    res.status(500).json({ error: "Failed to get video" });
  }
});

/**
 * PATCH /api/videos/:id/view
 * Increment view count.
 */
router.patch("/:id/view", async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.video.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update view" });
  }
});

/**
 * DELETE /api/videos/:id
 * Delete a video. Only the owner or admin can delete.
 */
router.delete("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
    });

    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    if (video.userId !== req.dbUser?.id && req.dbUser?.role !== "admin") {
      res.status(403).json({ error: "Not authorized to delete this video" });
      return;
    }

    // Delete from Cloudinary
    try {
      const publicId = video.videoUrl.split("/").slice(-2).join("/").replace(/\.[^/.]+$/, "");
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    } catch {
      console.warn("Failed to delete video from Cloudinary");
    }

    await prisma.video.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete video error:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
});

export default router;
