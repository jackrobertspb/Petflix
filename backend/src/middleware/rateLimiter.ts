import rateLimit from 'express-rate-limit';

// Global rate limiter - 500 requests per 15 minutes per IP
// Higher limit for SPAs that make frequent API calls (video feeds, notifications, etc.)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for auth endpoints - 20 requests per 15 minutes
// (Allows account locking to trigger at 5 failed attempts before rate limit hits)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many authentication attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
});

// Video upload rate limiter - 10 uploads per hour (only for POST requests)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: 'Too many video uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'POST', // Only apply to POST requests (uploads)
});

// Comment/interaction rate limiter - 30 per 15 minutes
export const interactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 interactions per windowMs
  message: 'You\'re doing that too quickly. Please wait a moment and try again soon.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for GET requests (read-only operations)
    // Only rate limit POST, PUT, PATCH, DELETE (write operations)
    return req.method === 'GET';
  },
});

