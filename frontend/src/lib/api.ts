const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

let authToken: string | null = null;

async function fetcher(endpoint: string, options: any = {}) {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  let url = API_BASE + endpoint;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error: any = new Error(errorData.error || `HTTP ${res.status}`);
    error.response = { status: res.status, data: errorData };
    throw error;
  }
  
  const data = await res.json().catch(() => null);
  return { data };
}

const api = {
  get: (endpoint: string, options?: any) => fetcher(endpoint, { method: "GET", params: options?.params, ...options }),
  post: (endpoint: string, data?: any, options?: any) => fetcher(endpoint, { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data), ...options }),
  patch: (endpoint: string, data?: any, options?: any) => fetcher(endpoint, { method: "PATCH", body: data instanceof FormData ? data : JSON.stringify(data), ...options }),
  delete: (endpoint: string, options?: any) => fetcher(endpoint, { method: "DELETE", body: options?.data ? JSON.stringify(options.data) : undefined, ...options }),
};

/**
 * Set the auth token for API requests.
 * Called from the frontend after Clerk provides a session token.
 */
export function setAuthToken(token: string | null) {
  authToken = token;
}

// ============ Auth ============
export const authApi = {
  sync: (data: { username: string; email: string; name?: string; avatar?: string }) =>
    api.post("/auth/sync", data),
  getMe: () => api.get("/auth/me"),
};

// ============ Users ============
export const usersApi = {
  getProfile: (username: string) => api.get(`/users/${username}`),
  updateProfile: (data: { name?: string; bio?: string; avatar?: string; username?: string }) =>
    api.patch("/users/profile", data),
  getUserVideos: (username: string, cursor?: string) =>
    api.get(`/users/${username}/videos`, { params: { cursor } }),
};

// ============ Videos ============
export const videosApi = {
  upload: (formData: FormData) =>
    api.post("/videos/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // 2 min timeout for uploads
    }),
  getFeed: (type: string = "latest", cursor?: string, limit?: number) =>
    api.get("/videos", { params: { type, cursor, limit } }),
  getById: (id: string) => api.get(`/videos/${id}`),
  incrementView: (id: string) => api.patch(`/videos/${id}/view`),
  delete: (id: string) => api.delete(`/videos/${id}`),
};

// ============ Comments ============
export const commentsApi = {
  getVideoComments: (videoId: string, cursor?: string) =>
    api.get(`/comments/videos/${videoId}/comments`, { params: { cursor } }),
  getReplies: (commentId: string) => api.get(`/comments/${commentId}/replies`),
  create: (data: { videoId: string; content: string; parentId?: string }) =>
    api.post("/comments", data),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// ============ Likes ============
export const likesApi = {
  like: (videoId: string) => api.post("/likes", { videoId }),
  unlike: (videoId: string) => api.delete("/likes", { data: { videoId } }),
};

// ============ Follows ============
export const followsApi = {
  follow: (followingId: string) => api.post("/follows", { followingId }),
  unfollow: (followingId: string) => api.delete("/follows", { data: { followingId } }),
  getFollowers: (userId: string, cursor?: string) =>
    api.get(`/follows/${userId}/followers`, { params: { cursor } }),
  getFollowing: (userId: string, cursor?: string) =>
    api.get(`/follows/${userId}/following`, { params: { cursor } }),
};

// ============ Notifications ============
export const notificationsApi = {
  getAll: (cursor?: string) => api.get("/notifications", { params: { cursor } }),
  markRead: (ids?: string[]) => api.patch("/notifications/read", { ids }),
};

// ============ Search ============
export const searchApi = {
  search: (q: string, type?: string) => api.get("/search", { params: { q, type } }),
  getTrending: () => api.get("/search/trending"),
};

// ============ Admin ============
export const adminApi = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (page?: number, search?: string, filter?: string) =>
    api.get("/admin/users", { params: { page, search, filter } }),
  banUser: (id: string) => api.patch(`/admin/users/${id}/ban`),
  restoreUser: (id: string) => api.patch(`/admin/users/${id}/restore`),
  getVideos: (page?: number, search?: string) =>
    api.get("/admin/videos", { params: { page, search } }),
  deleteVideo: (id: string) => api.delete(`/admin/videos/${id}`),
};

export default api;
