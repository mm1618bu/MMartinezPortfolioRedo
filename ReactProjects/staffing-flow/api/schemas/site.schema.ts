import { z } from 'zod';

/**
 * Sites (locations/facilities) schema
 * Sites are physical locations where employees work
 */

export const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(200, 'Name too long'),
  code: z.string().min(1, 'Site code is required').max(50, 'Code too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  city: z.string().max(100, 'City too long').optional(),
  state: z.string().max(50, 'State too long').optional(),
  country: z.string().max(100, 'Country too long').optional(),
  postal_code: z.string().max(20, 'Postal code too long').optional(),
  timezone: z.string().max(50, 'Timezone too long').optional(),
  phone: z.string().max(20, 'Phone too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  manager_id: z.string().uuid('Invalid manager ID').optional(),
  is_active: z.boolean().default(true),
  organization_id: z.string().uuid('Invalid organization ID'),
});

export const updateSiteSchema = createSiteSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const siteQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type SiteQueryInput = z.infer<typeof siteQuerySchema>;
