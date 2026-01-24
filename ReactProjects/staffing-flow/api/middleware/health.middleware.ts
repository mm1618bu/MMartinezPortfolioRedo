import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import config from '../config';
import { logger } from '../utils/logger';

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version?: string;
  checks?: {
    [key: string]: {
      status: 'pass' | 'fail';
      message?: string;
      responseTime?: number;
    };
  };
}

/**
 * Liveness probe - checks if the application is running
 * This endpoint should always return 200 if the process is alive
 * Used by container orchestration to know when to restart the container
 */
export const livenessProbe = (_req: Request, res: Response) => {
  const response: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
  };

  logger.debug('Liveness probe check', { status: response.status });
  res.status(200).json(response);
};

/**
 * Readiness probe - checks if the application is ready to accept traffic
 * Returns 200 if ready, 503 if not ready
 * Used by load balancers to know when to route traffic to this instance
 */
export const readinessProbe = async (_req: Request, res: Response) => {
  const checks: HealthCheckResponse['checks'] = {};
  let isReady = true;

  // Check database connectivity
  const dbCheckStart = Date.now();
  try {
    // Simple query to check if Supabase is reachable and responsive
    const { data: _data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();

    const responseTime = Date.now() - dbCheckStart;

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is acceptable - it means DB is working
      checks.database = {
        status: 'fail',
        message: `Database error: ${error.message}`,
        responseTime,
      };
      isReady = false;
      logger.warn('Readiness check: Database check failed', { error: error.message, responseTime });
    } else {
      checks.database = {
        status: 'pass',
        message: 'Database connection successful',
        responseTime,
      };
      logger.debug('Readiness check: Database check passed', { responseTime });
    }
  } catch (error: any) {
    const responseTime = Date.now() - dbCheckStart;
    checks.database = {
      status: 'fail',
      message: `Database connection failed: ${error.message}`,
      responseTime,
    };
    isReady = false;
    logger.error('Readiness check: Database check error', { error: error.message, responseTime });
  }

  // Check environment variables
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
  ];

  const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    checks.environment = {
      status: 'fail',
      message: `Missing required environment variables: ${missingEnvVars.join(', ')}`,
    };
    isReady = false;
    logger.warn('Readiness check: Missing environment variables', { missingEnvVars });
  } else {
    checks.environment = {
      status: 'pass',
      message: 'All required environment variables present',
    };
  }

  // Check memory usage (warn if > 90% of available memory)
  const memoryUsage = process.memoryUsage();
  const heapUsedPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  if (heapUsedPercentage > 90) {
    checks.memory = {
      status: 'fail',
      message: `High memory usage: ${heapUsedPercentage.toFixed(2)}%`,
    };
    logger.warn('Readiness check: High memory usage', {
      heapUsedPercentage,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
    });
    // Note: We don't set isReady = false for memory warnings
    // The container should still serve traffic but may need investigation
  } else {
    checks.memory = {
      status: 'pass',
      message: `Memory usage: ${heapUsedPercentage.toFixed(2)}%`,
    };
  }

  const response: HealthCheckResponse = {
    status: isReady ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };

  const statusCode = isReady ? 200 : 503;
  logger.info('Readiness probe check', {
    status: response.status,
    statusCode,
    checksCount: Object.keys(checks).length,
  });

  res.status(statusCode).json(response);
};

/**
 * Detailed health check with all diagnostics
 * Should not be exposed publicly - use for internal monitoring/debugging
 */
export const detailedHealthCheck = async (_req: Request, res: Response) => {
  const checks: HealthCheckResponse['checks'] = {};
  let isHealthy = true;

  // Database check (same as readiness)
  const dbCheckStart = Date.now();
  try {
    const { data: _data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();

    const responseTime = Date.now() - dbCheckStart;

    if (error && error.code !== 'PGRST116') {
      checks.database = {
        status: 'fail',
        message: `Database error: ${error.message}`,
        responseTime,
      };
      isHealthy = false;
    } else {
      checks.database = {
        status: 'pass',
        message: 'Database connection successful',
        responseTime,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - dbCheckStart;
    checks.database = {
      status: 'fail',
      message: `Database connection failed: ${error.message}`,
      responseTime,
    };
    isHealthy = false;
  }

  // Environment check
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
  ];

  const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    checks.environment = {
      status: 'fail',
      message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
    };
    isHealthy = false;
  } else {
    checks.environment = {
      status: 'pass',
      message: 'All required environment variables present',
    };
  }

  // Memory usage details
  const memoryUsage = process.memoryUsage();
  const heapUsedPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  checks.memory = {
    status: heapUsedPercentage > 90 ? 'fail' : 'pass',
    message: `Heap: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(
      memoryUsage.heapTotal /
      1024 /
      1024
    ).toFixed(2)}MB (${heapUsedPercentage.toFixed(2)}%), RSS: ${(
      memoryUsage.rss /
      1024 /
      1024
    ).toFixed(2)}MB`,
  };

  // CPU usage (if available via process.cpuUsage())
  const cpuUsage = process.cpuUsage();
  checks.cpu = {
    status: 'pass',
    message: `User: ${(cpuUsage.user / 1000000).toFixed(2)}s, System: ${(
      cpuUsage.system / 1000000
    ).toFixed(2)}s`,
  };

  // Event loop lag (check if Node.js event loop is blocked)
  const eventLoopStart = Date.now();
  await new Promise((resolve) => setImmediate(resolve));
  const eventLoopLag = Date.now() - eventLoopStart;

  checks.eventLoop = {
    status: eventLoopLag > 100 ? 'fail' : 'pass',
    message: `Event loop lag: ${eventLoopLag}ms`,
    responseTime: eventLoopLag,
  };

  if (eventLoopLag > 100) {
    isHealthy = false;
  }

  const response: HealthCheckResponse = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };

  logger.info('Detailed health check', {
    status: response.status,
    checksCount: Object.keys(checks).length,
  });

  res.status(isHealthy ? 200 : 503).json(response);
};

/**
 * Startup probe - checks if the application has finished starting up
 * Used by Kubernetes to know when the container is ready to receive liveness/readiness probes
 * For most Node.js apps, this is similar to readiness probe
 */
export const startupProbe = async (_req: Request, res: Response) => {
  // For now, use same logic as readiness probe
  // In a more complex app, you might check if migrations have run,
  // caches are populated, etc.
  return readinessProbe(_req, res);
};

/**
 * Middleware to skip health check endpoints from logging
 * Add this before your logger middleware
 */
export const skipHealthCheckLogging = (req: Request, _res: Response, next: NextFunction) => {
  const healthEndpoints = ['/api/health', '/api/ready', '/api/readiness', '/api/startup'];

  if (healthEndpoints.includes(req.path)) {
    // Set a flag to skip logging
    (req as any).skipLogging = true;
  }

  next();
};
