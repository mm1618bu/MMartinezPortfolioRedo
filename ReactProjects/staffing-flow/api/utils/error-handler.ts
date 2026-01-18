import { Response } from 'express';

export const handleError = (res: Response, error: any): void => {
  console.error('Error:', error);

  // Supabase/PostgreSQL errors
  if (error.code) {
    res.status(400).json({
      error: error.message || 'Database error',
      code: error.code,
    });
    return;
  }

  // Custom errors with status
  if (error.status) {
    res.status(error.status).json({
      error: error.message,
    });
    return;
  }

  // Default error
  res.status(500).json({
    error: error.message || 'Internal server error',
  });
};

export class AppError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}
