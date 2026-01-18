/**
 * Standard error codes used across the application
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_FAILED = 'QUERY_FAILED',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // External service errors
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // General errors
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
    timestamp: string;
    path?: string;
    requestId?: string;
  };
}

/**
 * Success response structure (for consistency)
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}
