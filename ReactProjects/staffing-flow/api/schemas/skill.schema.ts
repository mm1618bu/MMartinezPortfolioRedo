import { z } from 'zod';

/**
 * Skills schema
 * Skills represent competencies that employees can possess
 */

export const createSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  is_active: z.boolean().default(true),
  organization_id: z.string().uuid('Invalid organization ID'),
});

export const updateSkillSchema = createSkillSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const skillQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  category: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Employee Skills (junction table)
export const createEmployeeSkillSchema = z.object({
  employee_id: z.string().uuid('Invalid employee ID'),
  skill_id: z.string().uuid('Invalid skill ID'),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  acquired_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const updateEmployeeSkillSchema = createEmployeeSkillSchema
  .partial()
  .omit({ employee_id: true, skill_id: true })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
export type SkillQueryInput = z.infer<typeof skillQuerySchema>;
export type CreateEmployeeSkillInput = z.infer<typeof createEmployeeSkillSchema>;
export type UpdateEmployeeSkillInput = z.infer<typeof updateEmployeeSkillSchema>;
