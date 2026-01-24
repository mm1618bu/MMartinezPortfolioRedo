import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { requestLogger as winstonRequestLogger } from '../utils/logger';
import { getCorrelationId, getRequestContext } from './tracing.middleware';

/**
 * Morgan stream to Winston
 * Redirects Morgan output to Winston logger
 */
const morganStream = {
  write: (message: string) => {
    winstonRequestLogger.http(message.trim());
  },
};

/**
 * Custom Morgan token for correlation ID
 */
morgan.token('correlation-id', (req: Request) => {
  return req.correlationId || getCorrelationId() || '-';
});

/**
 * Custom Morgan token for user ID
 */
morgan.token('user-id', (req: Request) => {
  return req.user?.id || '-';
});

/**
 * Custom Morgan token for response time in ms
 */
morgan.token('response-time-ms', (req: Request, _res: Response) => {
  if (!req.startTime) return '-';
  return `${Date.now() - req.startTime}ms`;
});

/**
 * Morgan HTTP request logger
 * Uses Winston as output stream
 */
export const httpLogger = morgan(
  process.env.NODE_ENV === 'production' 
    ? ':method :url :status :response-time-ms :res[content-length] :correlation-id :user-id :remote-addr'
    : ':method :url :status :response-time-ms - :res[content-length] [:correlation-id] [:user-id]',
  {
    stream: morganStream,
    skip: (req): boolean => {
      // Health check endpoints to skip
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
      
      // Skip health checks in all environments
      if (healthEndpoints.includes(req.url ?? '')) {
        return true;
      }
      
      // Skip static assets in production
      if (process.env.NODE_ENV === 'production') {
        return req.url?.startsWith('/static') ?? false;
      }
      
      return false;
    },
  }
);

/**
 * Enhanced request logger with structured logging
 * Logs request details with correlation ID and context
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request start
  winstonRequestLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    correlationId: req.correlationId,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const context = getRequestContext();
    
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      correlationId: req.correlationId,
      userId: req.user?.id,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      ...context,
    };

    // Log level based on status code
    if (res.statusCode >= 500) {
      winstonRequestLogger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      winstonRequestLogger.warn('Request error', logData);
    } else {
      winstonRequestLogger.info('Request completed', logData);
    }
  });

  next();
};

/**
 * Slow request logger
 * Logs warnings for requests that take too long
 */
export const slowRequestLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > threshold) {
        winstonRequestLogger.warn('Slow request detected', {
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          correlationId: req.correlationId,
          userId: req.user?.id,
        });
      }
    });

    next();
  };
};

/**
 * Error logger middleware
 * Logs errors with full context
 */
export const errorLogger = (err: any, req: Request, _res: Response, next: NextFunction): void => {
  winstonRequestLogger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    correlationId: req.correlationId,
    userId: req.user?.id,
    ...getRequestContext(),
  });

  next(err);
};

/**
 * Request size logger
 * Logs warnings for large request bodies
 */
export const requestSizeLogger = (threshold: number = 1024 * 1024) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    
    if (contentLength > threshold) {
      winstonRequestLogger.warn('Large request body', {
        method: req.method,
        path: req.path,
        contentLength: `${(contentLength / 1024 / 1024).toFixed(2)}MB`,
        threshold: `${(threshold / 1024 / 1024).toFixed(2)}MB`,
        correlationId: req.correlationId,
      });
    }

    next();
  };
};

