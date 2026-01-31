import { z } from 'zod';

/**
 * Staffing Buffer schema
 * Defines extra staff buffer percentages to handle surges and absences
 */

export const createStaffingBufferSchema = z.object({
  name: z.string().min(1, 'Buffer name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  buffer_percentage: z.number().min(0, 'Must be >= 0').max(100, 'Must be <= 100'),
  buffer_minimum_count: z.number().int().min(0, 'Must be non-negative').optional(),
  day_of_week: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format').optional(),
  effective_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
  is_active: z.boolean().default(true),
  organization_id: z.string().uuid('Invalid organization ID'),
  department_id: z.string().uuid('Invalid department ID').optional(),
});

export const updateStaffingBufferSchema = createStaffingBufferSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const staffingBufferQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  effectiveDate: z.string().optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateStaffingBufferInput = z.infer<typeof createStaffingBufferSchema>;
export type UpdateStaffingBufferInput = z.infer<typeof updateStaffingBufferSchema>;
export type StaffingBufferQueryInput = z.infer<typeof staffingBufferQuerySchema>;
