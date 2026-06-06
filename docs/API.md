# MikMok API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All authenticated endpoints require a `Bearer` token in the `Authorization` header:
```
Authorization: Bearer <clerk_session_token>
```

---

## Endpoints

### Health Check
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Server health check |

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/sync` | Yes | Sync Clerk user to database |
| GET | `/auth/me` | Yes | Get current user profile |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/:username` | Optional | Get user profile |
| PATCH | `/users/profile` | Yes | Update own profile |
| GET | `/users/:username/videos` | Optional | Get user's videos |

### Videos
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/videos/upload` | Yes | Upload video (multipart) |
| GET | `/videos` | Optional | Get feed (?type=foryou\|following\|trending\|latest) |
| GET | `/videos/:id` | Optional | Get single video |
| PATCH | `/videos/:id/view` | No | Increment view count |
| DELETE | `/videos/:id` | Yes | Delete video (owner/admin) |

### Comments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/comments/videos/:videoId/comments` | Optional | Get video comments |
| GET | `/comments/:commentId/replies` | Optional | Get comment replies |
| POST | `/comments` | Yes | Add comment |
| DELETE | `/comments/:id` | Yes | Delete comment (owner/admin) |

### Likes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/likes` | Yes | Like video |
| DELETE | `/likes` | Yes | Unlike video |

### Follows
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/follows` | Yes | Follow user |
| DELETE | `/follows` | Yes | Unfollow user |
| GET | `/follows/:userId/followers` | No | Get followers |
| GET | `/follows/:userId/following` | No | Get following |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Yes | Get notifications |
| PATCH | `/notifications/read` | Yes | Mark as read |

### Search
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search` | Optional | Search (?q=...&type=all\|users\|videos\|hashtags) |
| GET | `/search/trending` | No | Get trending hashtags |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/stats` | Admin | Dashboard statistics |
| GET | `/admin/users` | Admin | List users |
| PATCH | `/admin/users/:id/ban` | Admin | Ban user |
| PATCH | `/admin/users/:id/restore` | Admin | Restore user |
| GET | `/admin/videos` | Admin | List videos |
| DELETE | `/admin/videos/:id` | Admin | Delete video |

---

## Pagination

Most list endpoints support cursor-based pagination:
- `?cursor=<lastItemId>` — Fetch next page
- `?limit=<number>` — Items per page (default: 20, max: 50)

Response format:
```json
{
  "data": [...],
  "nextCursor": "clxyz...",
  "hasMore": true
}
```

## Error Responses

```json
{
  "error": "Error message description"
}
```

Status codes: `400` (bad request), `401` (unauthorized), `403` (forbidden), `404` (not found), `409` (conflict), `500` (server error)
