import { z } from 'zod';

/**
 * SLA Windows schema
 * Service Level Agreement definitions for specific time periods
 */

export const createSLAWindowSchema = z.object({
  name: z.string().min(1, 'SLA name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  day_of_week: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  required_coverage_percentage: z.number().min(0, 'Must be >= 0').max(100, 'Must be <= 100'),
  minimum_staff_count: z.number().int().min(0, 'Must be non-negative').optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  effective_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
  is_active: z.boolean().default(true),
  organization_id: z.string().uuid('Invalid organization ID'),
  department_id: z.string().uuid('Invalid department ID').optional(),
}).refine(
  (data) => data.end_time > data.start_time,
  { message: 'End time must be after start time', path: ['end_time'] }
);

export const updateSLAWindowSchema = createSLAWindowSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const slaWindowQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateSLAWindowInput = z.infer<typeof createSLAWindowSchema>;
export type UpdateSLAWindowInput = z.infer<typeof updateSLAWindowSchema>;
export type SLAWindowQueryInput = z.infer<typeof slaWindowQuerySchema>;
