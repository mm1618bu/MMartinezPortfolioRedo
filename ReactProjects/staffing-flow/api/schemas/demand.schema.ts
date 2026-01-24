import { z } from 'zod';

/**
 * Demand Upload Schemas
 * Handles CSV uploads for workforce demand forecasting
 */

// Individual demand record from CSV
export const demandRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  department_id: z.string().uuid('Invalid department ID').optional(),
  department_name: z.string().max(200, 'Department name too long').optional(),
  shift_type: z.enum(['morning', 'afternoon', 'evening', 'night', 'split', 'all_day']).optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
  required_employees: z.number().int().positive('Required employees must be positive'),
  required_skills: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  notes: z.string().max(500, 'Notes too long').optional(),
}).refine(
  (data) => data.department_id || data.department_name,
  {
    message: 'Either department_id or department_name must be provided',
    path: ['department_id'],
  }
);

// CSV upload request body
export const uploadDemandCSVSchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID'),
  override_existing: z.boolean().default(false),
  validate_only: z.boolean().default(false),
});

// Query parameters for demand data
export const demandQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  shiftType: z.enum(['morning', 'afternoon', 'evening', 'night', 'split', 'all_day']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Upload result/response
export const uploadResultSchema = z.object({
  success: z.boolean(),
  total_rows: z.number(),
  valid_rows: z.number(),
  invalid_rows: z.number(),
  inserted_rows: z.number().optional(),
  updated_rows: z.number().optional(),
  errors: z.array(z.object({
    row: z.number(),
    field: z.string().optional(),
    message: z.string(),
  })),
  warnings: z.array(z.object({
    row: z.number(),
    message: z.string(),
  })).optional(),
});

export type DemandRecord = z.infer<typeof demandRecordSchema>;
export type UploadDemandCSVInput = z.infer<typeof uploadDemandCSVSchema>;
export type DemandQueryInput = z.infer<typeof demandQuerySchema>;
export type UploadResult = z.infer<typeof uploadResultSchema>;
