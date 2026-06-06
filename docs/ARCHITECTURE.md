# MikMok Architecture

## System Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│  (Next.js)   │     │  (Express)   │     │   (Neon)    │
│  Port 3000   │     │  Port 3001   │     │             │
└──────┬───────┘     └──────┬───────┘     └─────────────┘
       │                    │
       │                    ▼
       │              ┌─────────────┐
       │              │ Cloudinary  │
       │              │  (Videos)   │
       │              └─────────────┘
       │
       ▼
┌─────────────┐
│    Clerk     │
│   (Auth)    │
└─────────────┘
```

## Frontend Architecture

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Custom Design System
- **State**: Zustand (client state) + React Query (server state)
- **Auth**: Clerk (@clerk/nextjs)

### Route Structure
```
/(auth)      → Sign-in, Sign-up (public)
/(main)      → App shell with sidebar
  /feed      → Video feed (For You, Following, Trending)
  /upload    → Video upload
  /profile   → User profiles
  /search    → Search & discovery
  /notifications → In-app notifications
  /admin     → Admin dashboard (role-gated)
```

## Backend Architecture

- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Auth**: Clerk JWT verification
- **Upload**: Multer → Cloudinary

### Middleware Chain
```
Request → CORS → JSON Parser → Auth (optional/required) → Route Handler → Error Handler
```

## Database Schema (6 Models)

- **User** — Clerk-synced user profiles with role/ban status
- **Video** — Video metadata with Cloudinary URLs
- **Comment** — Threaded comments (parent-child)
- **Like** — One-per-user video likes
- **Follow** — Follower/following relationships
- **Notification** — In-app notification records

## Recommendation Engine

```
Score = (likes × 3) + (comments × 5) + (shares × 10) + views
```

For You feed combines:
1. Videos from followed creators (+50 boost)
2. Videos matching engaged hashtags (+30 boost)
3. Popular content (fallback)

## Security

- Clerk JWT validation on all authenticated routes
- CORS restricted to frontend origin
- Input validation with Zod
- SQL injection prevention via Prisma
- File type/size validation on uploads
- Admin role checking middleware
