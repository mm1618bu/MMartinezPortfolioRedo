import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error:', err);

  // Supabase errors
  if (err.code) {
    res.status(400).json({
      error: err.message || 'Database error',
      code: err.code,
    });
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
    return;
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
};
