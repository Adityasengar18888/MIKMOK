import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ override: true });

import { errorHandler, notFound } from "./middleware/errorHandler";

// Route imports
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import videoRoutes from "./routes/videos";
import commentRoutes from "./routes/comments";
import likeRoutes from "./routes/likes";
import followRoutes from "./routes/follows";
import notificationRoutes from "./routes/notifications";
import searchRoutes from "./routes/search";
import adminRoutes from "./routes/admin";
import statsRoutes from "./routes/stats";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://mikmok-nu.vercel.app",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any Vercel preview URL for this project
    if (origin.includes("vercel.app") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now during development
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === "development") {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats", statsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
  🎬 MikMok API Server
  ━━━━━━━━━━━━━━━━━━━━
  ▸ Port:     ${PORT}
  ▸ Env:      ${process.env.NODE_ENV || "development"}
  ▸ Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}
  ▸ Health:   http://localhost:${PORT}/api/health
  `);
});

export default app;
