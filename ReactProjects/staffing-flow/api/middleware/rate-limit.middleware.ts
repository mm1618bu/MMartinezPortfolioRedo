import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response } from 'express';
import { RateLimitError } from '../errors';

/**
 * Configuration for rate limiting
 */
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const AUTH_RATE_LIMIT_WINDOW_MS = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const AUTH_RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10);

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (_req: Request, _res: Response) => {
  throw new RateLimitError('Too many requests, please try again later');
};

/**
 * Skip rate limiting for certain conditions
 */
const skipRateLimit = (req: Request): boolean => {
  // Skip for health check endpoints
  const healthEndpoints = [
    '/api/health',
    '/api/live',
    '/api/liveness',
    '/api/ready',
    '/api/readiness',
    '/api/startup',
    '/api/health/detailed',
    '/api/status',
  ];
  if (healthEndpoints.includes(req.path)) {
    return true;
  }
  
  // Skip for trusted IPs in production (if configured)
  const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
  const clientIP = req.ip || req.socket.remoteAddress || '';
  if (trustedIPs.includes(clientIP)) {
    return true;
  }
  
  return false;
};

/**
 * General API rate limiter
 * Limits all requests to 100 per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: skipRateLimit,
  handler: rateLimitHandler,
  // Store in memory (consider Redis for production clusters)
  // store: new RedisStore({ client: redisClient }),
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits to 5 login attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count both successful and failed attempts
  skipFailedRequests: false,
  handler: rateLimitHandler,
});

/**
 * Signup rate limiter
 * Even stricter than login (3 attempts per 15 minutes)
 */
export const signupRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: 3,
  message: 'Too many signup attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Password reset rate limiter
 * Prevent abuse of password reset functionality
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 3,
  message: 'Too many password reset requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Speed limiter - slows down requests instead of blocking
 * Adds delay to responses after threshold is reached
 */
export const speedLimiter = slowDown({
  windowMs: RATE_LIMIT_WINDOW_MS,
  delayAfter: Math.floor(RATE_LIMIT_MAX_REQUESTS * 0.5), // Start slowing after 50% of limit
  delayMs: (hits) => hits * 100, // Add 100ms per request over the threshold
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  skip: skipRateLimit,
});

/**
 * Create a custom rate limiter with specific options
 */
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || RATE_LIMIT_WINDOW_MS,
    max: options.max || RATE_LIMIT_MAX_REQUESTS,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: rateLimitHandler,
  });
};

/**
 * Rate limiter for file uploads
 * More restrictive due to resource usage
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 20,
  message: 'Too many upload requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Rate limiter for search/query endpoints
 * Moderate limits to prevent database overload
 */
export const searchRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 30,
  message: 'Too many search requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
