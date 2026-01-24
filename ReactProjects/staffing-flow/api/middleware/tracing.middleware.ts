import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createNamespace, getNamespace } from 'cls-hooked';

// Create a namespace for async context
const requestContext = createNamespace('request');

// Extend Express Request type to include correlation ID
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      startTime?: number;
    }
  }
}

/**
 * Request correlation ID middleware
 * Adds a unique correlation ID to each request for tracing
 */
export const correlationId = (req: Request, res: Response, next: NextFunction): void => {
  // Get correlation ID from header or generate new one
  const correlationId = 
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    uuidv4();

  // Attach to request
  req.correlationId = correlationId;

  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Run the rest of the middleware chain in the context
  requestContext.run(() => {
    requestContext.set('correlationId', correlationId);
    next();
  });
};

/**
 * Get the current correlation ID from async context
 */
export const getCorrelationId = (): string | undefined => {
  const namespace = getNamespace('request');
  return namespace?.get('correlationId');
};

/**
 * Request timing middleware
 * Tracks request start time for performance monitoring
 */
export const requestTiming = (req: Request, _res: Response, next: NextFunction): void => {
  req.startTime = Date.now();
  next();
};

/**
 * User context middleware
 * Adds user information to async context for logging
 */
export const userContext = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user) {
    requestContext.set('userId', req.user.id);
    requestContext.set('userEmail', req.user.email);
    requestContext.set('userRole', req.user.role);
  }
  next();
};

/**
 * Get user context from async context
 */
export const getUserContext = (): {
  userId?: string;
  userEmail?: string;
  userRole?: string;
} => {
  const namespace = getNamespace('request');
  if (!namespace) return {};
  
  return {
    userId: namespace.get('userId'),
    userEmail: namespace.get('userEmail'),
    userRole: namespace.get('userRole'),
  };
};

/**
 * Request metadata middleware
 * Adds common request metadata to async context
 */
export const requestMetadata = (req: Request, _res: Response, next: NextFunction): void => {
  requestContext.set('method', req.method);
  requestContext.set('path', req.path);
  requestContext.set('ip', req.ip || req.socket.remoteAddress);
  requestContext.set('userAgent', req.get('user-agent'));
  next();
};

/**
 * Get request metadata from async context
 */
export const getRequestMetadata = (): {
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
} => {
  const namespace = getNamespace('request');
  if (!namespace) return {};
  
  return {
    method: namespace.get('method'),
    path: namespace.get('path'),
    ip: namespace.get('ip'),
    userAgent: namespace.get('userAgent'),
  };
};

/**
 * Get full request context
 */
export const getRequestContext = (): {
  correlationId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
} => {
  return {
    correlationId: getCorrelationId(),
    ...getUserContext(),
    ...getRequestMetadata(),
  };
};

/**
 * Trace ID middleware (alias for correlation ID)
 * Some systems prefer "trace ID" terminology
 */
export const traceId = correlationId;

/**
 * Combined tracing middleware
 * Applies all tracing middleware in one call
 */
export const requestTracing = [
  correlationId,
  requestTiming,
  requestMetadata,
];
