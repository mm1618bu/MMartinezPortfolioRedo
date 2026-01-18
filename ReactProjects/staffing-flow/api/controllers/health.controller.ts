import { Request, Response } from 'express';
import config from '../config';

export const healthController = {
  check: async (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      message: 'Staffing Flow API is running',
      environment: config.env,
      timestamp: new Date().toISOString(),
    });
  },
};
