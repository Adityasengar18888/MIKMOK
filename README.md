# 🎬 MikMok

> **Short Videos. Big Impact.** ⚡

MikMok is a next-generation short-video social platform that enables creators to upload, discover, and engage with vertical video content through a fast, personalized, and community-driven experience.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + TypeScript |
| UI | Tailwind CSS + Shadcn UI |
| Authentication | Clerk |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma |
| Storage | Cloudinary |
| State | Zustand + React Query |

## Getting Started

### Prerequisites
- Node.js 20.9+
- PostgreSQL database (Neon recommended)
- Clerk account
- Cloudinary account

### Setup

1. **Clone & install:**
```bash
cd frontend && npm install
cd ../backend && npm install
```

2. **Configure environment:**
```bash
# Copy and fill in both .env files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

3. **Initialize database:**
```bash
cd backend && npx prisma migrate dev --name init
```

4. **Start development:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Features

- 🔐 Authentication (Email, Google OAuth via Clerk)
- 🎥 Video upload with Cloudinary
- 📱 TikTok-style vertical video feed
- ❤️ Like, comment, and share
- 👥 Follow creators
- 🔔 In-app notifications
- 🔍 Search users, videos, hashtags
- 📊 Admin dashboard
- 🌙 Dark mode
- 📱 Mobile-responsive

## License

MIT
