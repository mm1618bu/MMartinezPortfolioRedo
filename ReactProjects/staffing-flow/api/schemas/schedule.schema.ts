import { z } from 'zod';

export const createScheduleSchema = z.object({
  employee_id: z.string().uuid('Invalid employee ID'),
  shift_template_id: z.string().uuid('Invalid shift template ID'),
  shift_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM or HH:MM:SS)'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM or HH:MM:SS)'),
  status: z
    .enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
    .default('scheduled'),
  department_id: z.string().uuid('Invalid department ID'),
  organization_id: z.string().uuid('Invalid organization ID'),
  notes: z.string().optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export const scheduleQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  startDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid start date format',
    })
    .optional(),
  endDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid end date format',
    })
    .optional(),
  employeeId: z.string().uuid().optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
});

export const assignShiftSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  shiftTemplateId: z.string().uuid('Invalid shift template ID'),
  shiftDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
});

export const bulkAssignSchema = z.object({
  assignments: z.array(assignShiftSchema).min(1, 'At least one assignment is required'),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;
export type AssignShiftInput = z.infer<typeof assignShiftSchema>;
export type BulkAssignInput = z.infer<typeof bulkAssignSchema>;
