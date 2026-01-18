import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './custom-errors';
import { ErrorCode, ErrorResponse } from './error-codes';
import config from '../config';

/**
 * Determines if an error is operational (expected) or a programmer error
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Formats Zod validation errors into a readable structure
 */
const formatZodError = (error: ZodError) => {
  return error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
};

/**
 * Formats Supabase/PostgreSQL errors
 */
const formatDatabaseError = (error: any) => {
  const code = error.code || 'DATABASE_ERROR';
  const message = error.message || 'A database error occurred';

  // Common PostgreSQL error codes
  const errorMap: Record<string, string> = {
    '23505': 'Duplicate entry - this resource already exists',
    '23503': 'Referenced resource does not exist',
    '23502': 'Required field is missing',
    '42P01': 'Database table does not exist',
    '42703': 'Database column does not exist',
    '22P02': 'Invalid data format',
    PGRST116: 'No rows found',
  };

  return {
    code: ErrorCode.DATABASE_ERROR,
    message: errorMap[code] || message,
    originalCode: code,
  };
};

/**
 * Logs error with appropriate level and context
 */
const logError = (error: Error, req: Request) => {
  const isOperational = isOperationalError(error);
  const logLevel = isOperational ? 'warn' : 'error';

  const errorLog = {
    level: logLevel,
    message: error.message,
    stack: error.stack,
    name: error.name,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  };

  // In production, you would send this to a logging service
  // (e.g., Winston, Sentry, CloudWatch)
  if (config.isDevelopment) {
    console.error('Error occurred:', errorLog);
  } else {
    // Production: Send to logging service
    console.error(JSON.stringify(errorLog));
  }
};

/**
 * Builds standardized error response
 */
const buildErrorResponse = (
  error: Error,
  statusCode: number,
  errorCode: string,
  details?: unknown,
  path?: string
): ErrorResponse => {
  return {
    success: false,
    error: {
      code: errorCode,
      message: config.isProduction ? sanitizeErrorMessage(error.message) : error.message,
      statusCode,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      ...(path ? { path } : {}),
    },
  };
};

/**
 * Sanitizes error messages for production (don't leak sensitive info)
 */
const sanitizeErrorMessage = (message: string): string => {
  // In production, replace sensitive error messages with generic ones
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /credential/i,
    /database/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return 'An error occurred. Please contact support.';
    }
  }

  return message;
};

/**
 * Global error handling middleware
 * This should be the last middleware in the chain
 */
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logError(err, req);

  // Handle specific error types
  let statusCode = 500;
  let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
  let details: unknown;

  // AppError (our custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = (err.errorCode as ErrorCode) || ErrorCode.INTERNAL_SERVER_ERROR;
    details = err.details;
  }
  // Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 422;
    errorCode = ErrorCode.VALIDATION_ERROR;
    details = formatZodError(err);
  }
  // Supabase/Database errors
  else if (err.name === 'PostgrestError' || (err as any).code) {
    const dbError = formatDatabaseError(err);
    statusCode = 400;
    errorCode = dbError.code;
    details = { originalCode: dbError.originalCode };
  }
  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = ErrorCode.TOKEN_INVALID;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = ErrorCode.TOKEN_EXPIRED;
  }
  // Syntax errors (malformed JSON, etc.)
  else if (err instanceof SyntaxError) {
    statusCode = 400;
    errorCode = ErrorCode.INVALID_INPUT;
  }

  // Build and send error response
  const errorResponse = buildErrorResponse(err, statusCode, errorCode, details, req.path);

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Should be placed before the global error handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };

  res.status(404).json(errorResponse);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: router.get('/route', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Process unexpected errors and exit gracefully
 */
export const handleUncaughtErrors = (): void => {
  process.on('uncaughtException', (error: Error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(error.name, error.message);
    console.error(error.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(reason);
    process.exit(1);
  });
};
