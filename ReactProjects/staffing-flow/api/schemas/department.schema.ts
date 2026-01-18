import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  manager_id: z.string().uuid('Invalid manager ID').optional(),
  organization_id: z.string().uuid('Invalid organization ID'),
});

export const updateDepartmentSchema = createDepartmentSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const departmentQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type DepartmentQueryInput = z.infer<typeof departmentQuerySchema>;
