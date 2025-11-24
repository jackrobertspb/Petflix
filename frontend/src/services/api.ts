import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// Users API
export const usersAPI = {
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  updateProfile: (userId: string, data: { bio?: string; profile_picture_url?: string }) =>
    api.patch(`/users/${userId}`, data),
  updateEmail: (userId: string, email: string) =>
    api.patch(`/users/${userId}/email`, { email }),
  changePassword: (userId: string, data: { currentPassword: string; newPassword: string }) =>
    api.patch(`/users/${userId}/password`, data),
  deleteAccount: (userId: string) =>
    api.delete(`/users/${userId}`),
};

// Videos API
export const videosAPI = {
  shareVideo: (data: { youtubeUrl: string; title?: string; description?: string }) =>
    api.post('/videos', data),
  getVideo: (videoId: string) => api.get(`/videos/${videoId}`),
  updateVideo: (videoId: string, data: { title?: string; description?: string }) =>
    api.patch(`/videos/${videoId}`, data),
  deleteVideo: (videoId: string) => api.delete(`/videos/${videoId}`),
  searchYouTube: (query: string, maxResults = 10, pageToken?: string) =>
    api.get('/videos/search/youtube', { params: { q: query, maxResults, pageToken } }),
  getUserVideos: (userId: string) => api.get(`/videos/user/${userId}`),
};

// Follows API
export const followsAPI = {
  follow: (userId: string) => api.post(`/follows/${userId}`),
  unfollow: (userId: string) => api.delete(`/follows/${userId}`),
  getFollowers: (userId: string) => api.get(`/follows/${userId}/followers`),
  getFollowing: (userId: string) => api.get(`/follows/${userId}/following`),
  getFeed: (userId: string) => api.get(`/follows/${userId}/feed`),
};

// Comments API
export const commentsAPI = {
  createComment: (data: { video_id: string; text: string; parent_comment_id?: string }) =>
    api.post('/comments', data),
  getVideoComments: (videoId: string) => api.get(`/comments/video/${videoId}`),
  updateComment: (commentId: string, text: string) =>
    api.patch(`/comments/${commentId}`, { text }),
  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),
};

// Playlists API
export const playlistsAPI = {
  createPlaylist: (data: { name: string; description?: string; visibility?: 'public' | 'private' }) =>
    api.post('/playlists', data),
  getPlaylist: (playlistId: string) => api.get(`/playlists/${playlistId}`),
  getUserPlaylists: (userId: string) => api.get(`/playlists/user/${userId}`),
  updatePlaylist: (playlistId: string, data: { name?: string; description?: string; visibility?: string }) =>
    api.patch(`/playlists/${playlistId}`, data),
  deletePlaylist: (playlistId: string) => api.delete(`/playlists/${playlistId}`),
  addVideo: (playlistId: string, videoId: string) =>
    api.post(`/playlists/${playlistId}/videos`, { video_id: videoId }),
  removeVideo: (playlistId: string, videoId: string) =>
    api.delete(`/playlists/${playlistId}/videos/${videoId}`),
  getPlaylistVideos: (playlistId: string) => api.get(`/playlists/${playlistId}/videos`),
  addTag: (playlistId: string, videoId: string, tagName: string) =>
    api.post(`/playlists/${playlistId}/videos/${videoId}/tags`, { tag_name: tagName }),
  removeTag: (playlistId: string, videoId: string, tagName: string) =>
    api.delete(`/playlists/${playlistId}/videos/${videoId}/tags/${tagName}`),
  getPlaylistTags: (playlistId: string) => api.get(`/playlists/${playlistId}/tags`),
  filterByTag: (playlistId: string, tag: string) =>
    api.get(`/playlists/${playlistId}/videos/filter`, { params: { tag } }),
};

// Reports API
export const reportsAPI = {
  reportVideo: (data: { video_id: string; reason: string; details?: string }) =>
    api.post('/reports', data),
  getReports: (status = 'pending', page = 1, limit = 20) =>
    api.get('/reports', { params: { status, page, limit } }),
  approveReport: (reportId: string) => api.patch(`/reports/${reportId}/approve`),
  rejectReport: (reportId: string) => api.patch(`/reports/${reportId}/reject`),
  getReportReasons: () => api.get('/reports/reasons'),
};

// Video Likes API
export const videoLikesAPI = {
  like: (videoId: string) => api.post(`/video-likes/${videoId}`),
  unlike: (videoId: string) => api.delete(`/video-likes/${videoId}`),
  getStatus: (videoId: string) => api.get(`/video-likes/${videoId}`),
};

// Comment Likes API
export const commentLikesAPI = {
  like: (commentId: string) => api.post(`/comment-likes/${commentId}`),
  unlike: (commentId: string) => api.delete(`/comment-likes/${commentId}`),
  getStatus: (commentId: string) => api.get(`/comment-likes/${commentId}`),
  getBatchForVideo: (videoId: string) => api.get(`/comment-likes/video/${videoId}/batch`),
};

export { api };
export default api;

