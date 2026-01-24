import { z } from 'zod';

/**
 * Shift Templates schema
 * Shift templates define reusable shift patterns
 */

export const createShiftTemplateSchema = z.object({
  name: z.string().min(1, 'Shift template name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, 'Invalid time format (HH:MM:SS)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, 'Invalid time format (HH:MM:SS)'),
  duration_hours: z.number().positive('Duration must be positive').max(24, 'Duration cannot exceed 24 hours'),
  break_duration_minutes: z.number().min(0, 'Break duration cannot be negative').default(0),
  shift_type: z.enum(['morning', 'afternoon', 'evening', 'night', 'split']).optional(),
  required_skills: z.array(z.string().uuid('Invalid skill ID')).optional(),
  required_certifications: z.array(z.string().uuid('Invalid certification ID')).optional(),
  min_employees: z.number().int().positive('Minimum employees must be positive').default(1),
  max_employees: z.number().int().positive('Maximum employees must be positive').optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
  is_active: z.boolean().default(true),
  organization_id: z.string().uuid('Invalid organization ID'),
}).refine(
  (data) => !data.max_employees || data.max_employees >= data.min_employees,
  {
    message: 'Maximum employees must be greater than or equal to minimum employees',
    path: ['max_employees'],
  }
);

export const updateShiftTemplateSchema = createShiftTemplateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const shiftTemplateQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  shiftType: z.enum(['morning', 'afternoon', 'evening', 'night', 'split']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateShiftTemplateInput = z.infer<typeof createShiftTemplateSchema>;
export type UpdateShiftTemplateInput = z.infer<typeof updateShiftTemplateSchema>;
export type ShiftTemplateQueryInput = z.infer<typeof shiftTemplateQuerySchema>;
