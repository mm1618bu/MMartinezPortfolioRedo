import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');

export const paginationSchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const dateRangeSchema = z
  .object({
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid start date format',
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid end date format',
    }),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: 'Start date must be before or equal to end date',
    }
  );

export const emailSchema = z.string().email('Invalid email format');

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format')
  .optional();

export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
