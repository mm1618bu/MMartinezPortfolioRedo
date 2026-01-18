import express from 'express';
import cors from 'cors';
import config from './config';
import routes from './routes';
import { globalErrorHandler, notFoundHandler, handleUncaughtErrors } from './errors';
import { requestLogger } from './middleware/logging.middleware';

// Handle uncaught errors
handleUncaughtErrors();

const app = express();

// Middleware
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging (in development)
if (config.isDevelopment) {
  app.use(requestLogger);
}

// API Routes
app.use('/api', routes);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server
const server = app.listen(config.server.port, () => {
  console.log(`API server running on http://${config.server.host}:${config.server.port}`);
  console.log(`Environment: ${config.env}`);
  console.log(`CORS enabled for: ${config.cors.origins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
