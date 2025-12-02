import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

export const videoLikesAPI = {
  like: (videoId: string) => api.post(`/videos/${videoId}/likes`),
  unlike: (videoId: string) => api.delete(`/videos/${videoId}/likes`),
  getLikes: (videoId: string) => api.get(`/videos/${videoId}/likes`),
};

export const commentLikesAPI = {
  like: (commentId: string) => api.post(`/comments/${commentId}/likes`),
  unlike: (commentId: string) => api.delete(`/comments/${commentId}/likes`),
  getLikes: (commentId: string) => api.get(`/comments/${commentId}/likes`),
};

export const commentsAPI = {
  create: (videoId: string, content: string, parentId?: string) => 
    api.post(`/videos/${videoId}/comments`, { content, parent_id: parentId }),
  update: (commentId: string, content: string) => 
    api.put(`/comments/${commentId}`, { content }),
  delete: (commentId: string) => api.delete(`/comments/${commentId}`),
  getByVideo: (videoId: string) => api.get(`/videos/${videoId}/comments`),
};

export default api;

