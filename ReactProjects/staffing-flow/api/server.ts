import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import config from './config';
import routes from './routes';
import { globalErrorHandler, notFoundHandler, handleUncaughtErrors } from './errors';
import { httpLogger, requestLogger, slowRequestLogger, errorLogger } from './middleware/logging.middleware';
import { requestTracing, userContext } from './middleware/tracing.middleware';
import { apiRateLimiter, speedLimiter } from './middleware/rate-limit.middleware';
import { getSecurityMiddleware } from './middleware/security.middleware';
import { logger } from './utils/logger';
import { webSocketService } from './services/websocket.service';
import {
  livenessProbe,
  readinessProbe,
  detailedHealthCheck,
  startupProbe,
} from './middleware/health.middleware';

// Handle uncaught errors
handleUncaughtErrors();

const app = express();

// Trust proxy (important for rate limiting and IP logging behind reverse proxy)
app.set('trust proxy', 1);

// Request tracing (must be first to track all requests)
app.use(requestTracing);

// Security headers (must be early in middleware chain)
const securityMiddleware = getSecurityMiddleware();
securityMiddleware.forEach((middleware) => app.use(middleware));

// CORS
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints (before rate limiting to ensure they always work)
// Liveness probe - checks if app is running (Kubernetes liveness probe)
app.get('/api/health', livenessProbe);
app.get('/api/live', livenessProbe);
app.get('/api/liveness', livenessProbe);

// Readiness probe - checks if app is ready to accept traffic (Kubernetes readiness probe)
app.get('/api/ready', readinessProbe);
app.get('/api/readiness', readinessProbe);

// Startup probe - checks if app has finished starting (Kubernetes startup probe)
app.get('/api/startup', startupProbe);

// Detailed health check - internal use only, includes all diagnostics
app.get('/api/health/detailed', detailedHealthCheck);

// Rate limiting (after parsing, before routes)
app.use(apiRateLimiter);
app.use(speedLimiter);

// HTTP request logging with Morgan + Winston
app.use(httpLogger);

// Slow request monitoring (warn if request takes > 1s)
app.use(slowRequestLogger(1000));

// User context tracking (after auth middleware would set req.user)
app.use(userContext);

// Enhanced request logging (development only)
if (config.isDevelopment) {
  app.use(requestLogger);
}

// API Routes
app.use('/api', routes);

// Error logging middleware (before error handler)
app.use(errorLogger);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Create HTTP server (needed for WebSocket)
const httpServer = createServer(app);

// Initialize WebSocket server
webSocketService.initialize(httpServer);
logger.info('WebSocket server initialized');

// Start server
const server = httpServer.listen(config.server.port, () => {
  logger.info(`API server started`, {
    host: config.server.host,
    port: config.server.port,
    environment: config.env,
  
  // Shutdown WebSocket server first
  webSocketService.shutdown();
  logger.info('WebSocket server shut down');
  
  // Then close HTTP server
  server.close(() => {
    logger.info('HTTP sabled',
    websocket_path: '/ws',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
