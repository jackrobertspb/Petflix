/**
 * Centralized logging service using Winston
 * Provides structured logging with levels, timestamps, and optional file rotation
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { supabase } from '../config/supabase.js';

// Log levels: error, warn, info, http, verbose, debug, silly
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'warn';
};

// Console format (colorized for development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// File/DB format (JSON for structured data)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [
  // Console transport (always active)
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// File transport (only in production or if explicitly enabled)
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  // Daily rotate file for all logs
  transports.push(
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    })
  );

  // Separate file for errors only
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: fileFormat,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

/**
 * Log error to database for admin dashboard
 */
export async function logErrorToDatabase(error: {
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
}) {
  try {
    const { error: dbError } = await supabase.from('error_logs').insert({
      level: error.level,
      message: error.message,
      stack: error.stack || null,
      context: error.context || null,
      user_id: error.userId || null,
      endpoint: error.endpoint || null,
      method: error.method || null,
      status_code: error.statusCode || null,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      // Don't throw - just log to console
      logger.warn('Failed to log error to database:', dbError.message);
    }
  } catch (err) {
    logger.warn('Error logging to database:', err);
  }
}

/**
 * Express error middleware
 * Logs all errors and sends them to database
 */
export function errorLoggerMiddleware(
  err: any,
  req: any,
  res: any,
  next: any
) {
  const errorDetails = {
    level: 'error' as const,
    message: err.message || 'Unknown error',
    stack: err.stack,
    context: {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    userId: req.userId || null,
    endpoint: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
  };

  // Log to Winston
  logger.error(err.message, {
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Log to database (async, don't wait)
  logErrorToDatabase(errorDetails).catch(() => {
    // Silently fail - don't break request
  });

  next(err);
}

/**
 * Helper functions for common logging patterns
 */

export function logInfo(message: string, meta?: Record<string, any>) {
  logger.info(message, meta);
}

export function logWarn(message: string, meta?: Record<string, any>) {
  logger.warn(message, meta);
}

export function logError(
  message: string,
  error?: Error,
  meta?: Record<string, any>
) {
  const errorDetails = {
    ...meta,
    stack: error?.stack,
    name: error?.name,
  };

  logger.error(message, errorDetails);

  // Also log to database if this is a significant error
  if (error) {
    logErrorToDatabase({
      level: 'error',
      message,
      stack: error.stack,
      context: meta,
    }).catch(() => {
      // Silently fail
    });
  }
}

export function logDebug(message: string, meta?: Record<string, any>) {
  logger.debug(message, meta);
}

export default logger;

