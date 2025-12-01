import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
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
import adminRoutes from './routes/admin.js';
import { globalLimiter, authLimiter, uploadLimiter, interactionLimiter } from './middleware/rateLimiter.js';
import { startNotificationProcessor } from './services/notificationGrouping.js';
import { errorLoggerMiddleware, logger } from './services/logger.js';
import { startAnomalyDetection } from './services/anomalyDetection.js';
import { startStorageMonitoring } from './services/storageMonitoring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Security headers middleware
// Helmet adds various security headers including HSTS, X-Content-Type-Options, etc.
app.use(helmet({
  // Configure HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  // Content Security Policy - relaxed for development, tighten in production
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // X-Frame-Options: prevent clickjacking
  frameguard: { action: 'deny' },
  // X-Content-Type-Options: prevent MIME sniffing
  noSniff: true,
  // X-XSS-Protection: enable XSS filter
  xssFilter: true,
  // Referrer-Policy: control referrer information
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// HTTPS redirect middleware (production only)
// Note: Most hosting providers (Vercel, Netlify, Heroku) handle HTTPS automatically
// This is a fallback for self-hosted deployments
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is not HTTPS
    const forwardedProto = req.header('x-forwarded-proto');
    const isHttps = req.secure || forwardedProto === 'https';
    
    if (!isHttps) {
      // Redirect to HTTPS
      const httpsUrl = `https://${req.header('host')}${req.url}`;
      console.log(`🔒 Redirecting HTTP to HTTPS: ${httpsUrl}`);
      return res.redirect(301, httpsUrl);
    }
    next();
  });
}

// Middleware
// Configure CORS to allow requests from frontend
// IMPORTANT: CORS must be configured BEFORE other middleware
try {
  const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
  
  // Normalize origins - remove trailing slashes and handle variations
  const normalizeOrigin = (origin: string): string => {
    return origin.trim().replace(/\/$/, ''); // Remove trailing slash
  };
  
  // Support comma-separated origins for multiple frontend deployments
  let allowedOrigins: string[] | boolean | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
  
  if (!corsOrigin) {
    // No CORS_ORIGIN set - allow all origins (development fallback)
    allowedOrigins = true;
    if (process.env.NODE_ENV === 'production') {
      logger.warn('⚠️ CORS_ORIGIN not set in production! Allowing all origins. Set CORS_ORIGIN in Vercel environment variables.');
    }
  } else if (corsOrigin === '*') {
    allowedOrigins = true; // Allow all origins
  } else if (corsOrigin.includes(',')) {
    // Multiple origins (comma-separated) - normalize each
    allowedOrigins = corsOrigin.split(',').map(origin => normalizeOrigin(origin)).filter(Boolean);
  } else {
    // Single origin - normalize it
    allowedOrigins = normalizeOrigin(corsOrigin);
  }
  
  // Use a function for origin checking to handle trailing slashes, case-insensitive matching, and Vercel preview URLs
  const originChecker = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // If allowedOrigins is true, allow all
    if (allowedOrigins === true) {
      return callback(null, true);
    }
    
    // Normalize the incoming origin
    const normalizedIncoming = normalizeOrigin(origin);
    
    // Helper to check if origin is a Vercel preview URL matching the production domain
    const isVercelPreviewUrl = (originUrl: string, productionUrl: string): boolean => {
      try {
        const originHost = new URL(originUrl).hostname;
        const productionHost = new URL(productionUrl).hostname;
        
        // Extract project name (e.g., "petflix-frontend" from "petflix-frontend.vercel.app")
        // Vercel URLs: production = "project-name.vercel.app"
        //              preview = "project-name-hash-account.vercel.app"
        const productionParts = productionHost.split('.');
        if (productionParts.length < 2 || !productionHost.endsWith('.vercel.app')) {
          return false;
        }
        
        const projectName = productionParts[0]; // e.g., "petflix-frontend"
        
        // Check if origin is a Vercel preview URL that starts with the same project name
        // Pattern: "petflix-frontend-{hash}-{account}.vercel.app"
        if (originHost.endsWith('.vercel.app') && originHost.startsWith(projectName + '-')) {
          return true;
        }
        
        return false;
      } catch {
        return false;
      }
    };
    
    // Check if origin matches exactly
    if (typeof allowedOrigins === 'string') {
      const normalizedAllowed = normalizeOrigin(allowedOrigins);
      if (normalizedIncoming === normalizedAllowed || origin === allowedOrigins) {
        return callback(null, true);
      }
      // Also allow Vercel preview URLs for the production domain
      if (isVercelPreviewUrl(origin, allowedOrigins)) {
        return callback(null, true);
      }
    } else if (Array.isArray(allowedOrigins)) {
      // Check exact matches
      if (allowedOrigins.includes(normalizedIncoming) || allowedOrigins.some(allowed => origin === allowed || normalizedIncoming === allowed)) {
        return callback(null, true);
      }
      // Check Vercel preview URLs for any of the allowed production domains
      if (allowedOrigins.some(allowed => isVercelPreviewUrl(origin, allowed))) {
        return callback(null, true);
      }
    }
    
    // Log blocked origin for debugging
    console.log(`🚫 CORS blocked: ${origin} (allowed: ${typeof allowedOrigins === 'string' ? allowedOrigins : Array.isArray(allowedOrigins) ? allowedOrigins.join(', ') : 'all'})`);
    callback(new Error('Not allowed by CORS'));
  };
  
  const corsOptions = {
    origin: originChecker,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  };
  
  app.use(cors(corsOptions));
  
  // Log CORS configuration (always log in production for debugging)
  const originDisplay = allowedOrigins === true 
    ? 'all origins' 
    : typeof allowedOrigins === 'string'
      ? allowedOrigins
      : Array.isArray(allowedOrigins) 
        ? allowedOrigins.join(', ') 
        : 'unknown';
  console.log(`🌐 CORS configured for: ${originDisplay}`);
  logger.info(`🌐 CORS configured for: ${originDisplay}`);
} catch (error) {
  console.error('CORS configuration error:', error);
  // Fallback to allow all origins if CORS config fails
  app.use(cors());
  logger.warn('⚠️ CORS fallback: allowing all origins due to configuration error');
}
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
app.use('/api/v1/admin', adminRoutes); // Admin routes

// Error logging middleware (logs to console, file, and database)
app.use(errorLoggerMiddleware);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Error is already logged by errorLoggerMiddleware
  
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
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Logging level: ${logger.level}`);
  
  if (process.env.LOG_TO_FILE === 'true' || process.env.NODE_ENV === 'production') {
    logger.info('📁 File logging: enabled (logs/ directory)');
  }
  
  // Start notification grouping processor
  startNotificationProcessor();
  
  // Start anomaly detection monitoring
  startAnomalyDetection();
  
  // Start storage monitoring
  startStorageMonitoring();
});

