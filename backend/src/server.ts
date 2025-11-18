import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import videoRoutes from './routes/videos.js';
import followRoutes from './routes/follows.js';
import commentRoutes from './routes/comments.js';
import playlistRoutes from './routes/playlists.js';
import playlistVideoRoutes from './routes/playlist-videos.js';
import playlistTagRoutes from './routes/playlist-tags.js';
import reportRoutes from './routes/reports.js';
import pushRoutes from './routes/push.js';
import videoLikesRoutes from './routes/video-likes.js';
import commentLikesRoutes from './routes/comment-likes.js';
import { globalLimiter, authLimiter, uploadLimiter, interactionLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply global rate limiter to all API routes
app.use('/api/', globalLimiter);

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Petflix API is running' });
});

// API routes with specific rate limiters
app.use('/api/v1/auth', authLimiter, authRoutes); // Strict rate limiting for auth
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/videos', videoRoutes); // Video routes (upload limiter applied per-route)
app.use('/api/v1/follows', interactionLimiter, followRoutes); // Rate limit follows
app.use('/api/v1/comments', interactionLimiter, commentRoutes); // Rate limit comments
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/playlists', playlistVideoRoutes);
app.use('/api/v1/playlists', playlistTagRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/push', pushRoutes);
app.use('/api/v1/video-likes', interactionLimiter, videoLikesRoutes); // Rate limit likes
app.use('/api/v1/comment-likes', interactionLimiter, commentLikesRoutes); // Rate limit likes

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({ 
      error: 'Validation failed',
      message: err.message
    });
    return;
  }

  // Default error response
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

