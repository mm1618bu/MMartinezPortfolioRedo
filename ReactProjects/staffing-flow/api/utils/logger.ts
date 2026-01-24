import winston from 'winston';
import path from 'path';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_DIR = process.env.LOG_DIR || 'logs';

/**
 * Custom log format for console output
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add correlation ID if present
    if (meta.correlationId) {
      msg = `${timestamp} [${level}] [${meta.correlationId}]: ${message}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      const metaStr = JSON.stringify(meta, null, 2);
      msg += `\n${metaStr}`;
    }
    
    return msg;
  })
);

/**
 * JSON format for file output
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create transports based on environment
 */
const createTransports = () => {
  const transports: winston.transport[] = [];

  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL,
    })
  );

  // File transports (production and staging)
  if (NODE_ENV !== 'development') {
    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(LOG_DIR, 'combined.log'),
        format: fileFormat,
        level: 'info',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      })
    );

    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(LOG_DIR, 'error.log'),
        format: fileFormat,
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      })
    );

    // Warning log file
    transports.push(
      new winston.transports.File({
        filename: path.join(LOG_DIR, 'warn.log'),
        format: fileFormat,
        level: 'warn',
        maxsize: 5242880, // 5MB
        maxFiles: 3,
      })
    );
  }

  return transports;
};

/**
 * Main logger instance
 */
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports: createTransports(),
  exitOnError: false,
  silent: NODE_ENV === 'test',
});

/**
 * Request logger - specialized for HTTP requests
 */
export const requestLogger = logger.child({ component: 'http' });

/**
 * Database logger - specialized for database operations
 */
export const dbLogger = logger.child({ component: 'database' });

/**
 * Auth logger - specialized for authentication
 */
export const authLogger = logger.child({ component: 'auth' });

/**
 * Security logger - specialized for security events
 */
export const securityLogger = logger.child({ component: 'security' });

/**
 * Helper function to log with correlation ID
 */
export const logWithCorrelation = (
  level: string,
  message: string,
  correlationId?: string,
  meta?: any
) => {
  logger.log(level, message, { correlationId, ...meta });
};

/**
 * Log levels:
 * error: 0
 * warn: 1
 * info: 2
 * http: 3
 * verbose: 4
 * debug: 5
 * silly: 6
 */

/**
 * Convenience methods
 */
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
};

/**
 * Create a child logger with specific context
 */
export const createLogger = (context: string, meta?: any) => {
  return logger.child({ context, ...meta });
};

/**
 * Log performance metrics
 */
export const logPerformance = (
  operation: string,
  duration: number,
  meta?: any
) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...meta,
  });
};

/**
 * Log security events
 */
export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: any
) => {
  securityLogger.warn(`Security Event: ${event}`, {
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

/**
 * Log database queries (in development)
 */
export const logQuery = (query: string, duration: number, params?: any) => {
  if (NODE_ENV === 'development') {
    dbLogger.debug('Database Query', {
      query,
      duration: `${duration}ms`,
      params,
    });
  }
};

/**
 * Log authentication events
 */
export const logAuthEvent = (
  event: string,
  userId?: string,
  success?: boolean,
  meta?: any
) => {
  authLogger.info(`Auth Event: ${event}`, {
    event,
    userId,
    success,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Log startup information
logger.info('Logger initialized', {
  level: LOG_LEVEL,
  environment: NODE_ENV,
  logDir: LOG_DIR,
});

export default logger;
