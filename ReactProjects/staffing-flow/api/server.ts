import express, { Request, Response } from 'express';
import cors from 'cors';
import config from './config';

const app = express();

// Middleware
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Staffing Flow API is running',
    environment: config.env,
  });
});

app.get('/api/staff', (req: Request, res: Response) => {
  // Sample data - replace with actual database queries
  res.json([
    { id: 1, name: 'John Doe', role: 'Developer', status: 'active' },
    { id: 2, name: 'Jane Smith', role: 'Designer', status: 'active' },
  ]);
});

// Start server
app.listen(config.server.port, () => {
  console.log(`API server running on http://${config.server.host}:${config.server.port}`);
  console.log(`Environment: ${config.env}`);
});
