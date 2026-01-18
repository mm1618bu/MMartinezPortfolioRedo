/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', true, details);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED', true);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden - Authenticated but insufficient permissions
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN', true);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', true);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict - Resource already exists or conflict with current state
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT', true);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 503 Service Unavailable - External service or database unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string = 'Service') {
    super(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE', true);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Database-specific errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: unknown) {
    super(message, 500, 'DATABASE_ERROR', false, details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * External API errors
 */
export class ExternalAPIError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(`${service} API error: ${message}`, 502, 'EXTERNAL_API_ERROR', true, details);
    Object.setPrototypeOf(this, ExternalAPIError.prototype);
  }
}
