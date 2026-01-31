import { z } from 'zod';

/**
 * Shift Templates schema
 * Shift templates define reusable shift patterns with time and day configurations
 */

const baseShiftTemplateObject = z.object({
  name: z.string().min(1, 'Shift template name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  days_of_week: z.array(z.string()).optional(),
  is_full_day: z.boolean().default(false),
  is_active: z.boolean().default(true),
  organization_id: z.string().uuid('Invalid organization ID'),
});

export const createShiftTemplateSchema = baseShiftTemplateObject.refine(
  (data) => {
    if (data.is_full_day) return true;
    // If not a full day shift, end time should be greater than start time
    return data.end_time > data.start_time;
  },
  {
    message: 'End time must be after start time',
    path: ['end_time'],
  }
);

export const updateShiftTemplateSchema = baseShiftTemplateObject
  .omit({ organization_id: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const shiftTemplateQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  shiftType: z.enum(['morning', 'afternoon', 'evening', 'night', 'split']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateShiftTemplateInput = z.infer<typeof createShiftTemplateSchema>;
export type UpdateShiftTemplateInput = z.infer<typeof updateShiftTemplateSchema>;
export type ShiftTemplateQueryInput = z.infer<typeof shiftTemplateQuerySchema>;
