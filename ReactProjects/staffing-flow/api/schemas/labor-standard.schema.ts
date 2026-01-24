import { z } from 'zod';

/**
 * Labor Standards schema
 * Labor standards define productivity/performance metrics and benchmarks
 */

export const createLaborStandardSchema = z.object({
  name: z.string().min(1, 'Labor standard name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  task_type: z.string().min(1, 'Task type is required').max(100, 'Task type too long'),
  standard_units_per_hour: z.number().positive('Must be positive').optional(),
  standard_hours_per_unit: z.number().positive('Must be positive').optional(),
  quality_threshold_percentage: z.number().min(0).max(100, 'Must be between 0 and 100').optional(),
  effective_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }).optional(),
  is_active: z.boolean().default(true),
  organization_id: z.string().uuid('Invalid organization ID'),
});

export const updateLaborStandardSchema = createLaborStandardSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const laborStandardQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  taskType: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  effectiveDate: z.string().optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateLaborStandardInput = z.infer<typeof createLaborStandardSchema>;
export type UpdateLaborStandardInput = z.infer<typeof updateLaborStandardSchema>;
export type LaborStandardQueryInput = z.infer<typeof laborStandardQuerySchema>;
