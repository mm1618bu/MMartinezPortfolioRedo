import { z } from 'zod';

export const createStaffSchema = z.object({
  employee_number: z.string().min(1, 'Employee number is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  hire_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  department_id: z.string().uuid('Invalid department ID'),
  position: z.string().min(1, 'Position is required'),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).default('active'),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  organization_id: z.string().uuid('Invalid organization ID'),
});

export const updateStaffSchema = createStaffSchema.partial();

export const staffQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const importStaffSchema = z.object({
  data: z.array(createStaffSchema),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type StaffQueryInput = z.infer<typeof staffQuerySchema>;
export type ImportStaffInput = z.infer<typeof importStaffSchema>;
