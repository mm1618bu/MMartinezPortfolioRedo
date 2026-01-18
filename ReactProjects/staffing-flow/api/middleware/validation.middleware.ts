import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      // Pass Zod errors to global error handler
      next(error);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = (await schema.parseAsync(req.query)) as any;
      next();
    } catch (error) {
      // Pass Zod errors to global error handler
      next(error);
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = (await schema.parseAsync(req.params)) as any;
      next();
    } catch (error) {
      // Pass Zod errors to global error handler
      next(error);
    }
  };
};

// Validate UUID parameter (common use case)
export const validateUuidParam = (paramName: string = 'id') => {
  const schema = z.object({
    [paramName]: z.string().uuid(`Invalid ${paramName} format`),
  });

  return validateParams(schema);
};
