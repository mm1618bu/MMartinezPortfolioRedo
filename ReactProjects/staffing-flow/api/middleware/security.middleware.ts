import helmet from 'helmet';
import { RequestHandler } from 'express';

/**
 * Security headers configuration using Helmet
 * Helmet helps secure Express apps by setting various HTTP headers
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Main security headers middleware
 * Includes all recommended security headers
 */
export const securityHeaders: RequestHandler = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: !isDevelopment,

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: { policy: 'same-origin' },

  // Referrer Policy
  referrerPolicy: { policy: 'no-referrer' },

  // Strict-Transport-Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: { allow: false },

  // X-Download-Options
  ieNoOpen: true,

  // X-Frame-Options
  frameguard: { action: 'deny' },

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // X-XSS-Protection (legacy but still useful)
  xssFilter: true,
});

/**
 * Relaxed security headers for development
 * Less restrictive CSP for hot reloading and development tools
 */
export const developmentSecurityHeaders: RequestHandler = helmet({
  contentSecurityPolicy: false, // Disable CSP in development for easier debugging
  crossOriginEmbedderPolicy: false,
  hsts: false, // No HTTPS enforcement in development
  hidePoweredBy: true,
  noSniff: true,
  xssFilter: true,
});

/**
 * Additional custom security headers
 */
export const additionalSecurityHeaders: RequestHandler = (_req, res, next) => {
  // Permissions Policy (formerly Feature-Policy)
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Cache-Control for API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};

/**
 * CORS security headers
 * Additional headers to enhance CORS security
 */
export const corsSecurityHeaders: RequestHandler = (req, res, next) => {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
};

/**
 * Security headers for file uploads
 */
export const uploadSecurityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'attachment');
  next();
};

/**
 * API-specific security headers
 */
export const apiSecurityHeaders: RequestHandler = (_req, res, next) => {
  // Indicate this is a JSON API
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // API version header
  res.setHeader('X-API-Version', '1.0.0');
  
  next();
};

/**
 * Get the appropriate security middleware based on environment
 */
export const getSecurityMiddleware = (): RequestHandler[] => {
  if (isDevelopment) {
    return [developmentSecurityHeaders, additionalSecurityHeaders];
  }
  return [securityHeaders, additionalSecurityHeaders];
};
