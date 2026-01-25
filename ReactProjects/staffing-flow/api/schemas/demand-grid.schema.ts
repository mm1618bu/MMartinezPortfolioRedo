import { z } from 'zod';

/**
 * Grid query parameters with advanced filtering and sorting
 */
export const demandGridQuerySchema = z.object({
  // Organization filter (required)
  organizationId: z.string().uuid(),

  // Pagination
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50),

  // Sorting
  sortBy: z
    .enum(['date', 'department', 'shift_type', 'required_employees', 'priority', 'created_at'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),

  // Filters
  departmentIds: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').filter(Boolean) : undefined)),
  shiftTypes: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').filter(Boolean) : undefined)),
  priorities: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').filter(Boolean) : undefined)),

  // Date range
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  // Employee count range
  minEmployees: z.coerce.number().int().nonnegative().optional(),
  maxEmployees: z.coerce.number().int().positive().optional(),

  // Search across multiple fields
  search: z.string().optional(),

  // Include deleted records
  includeDeleted: z.coerce.boolean().default(false),
});

export type DemandGridQuery = z.infer<typeof demandGridQuerySchema>;

/**
 * Grid response format
 */
export const demandGridResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  }),
  filters: z.object({
    applied: z.record(z.string(), z.any()),
    available: z.record(z.string(), z.array(z.any())),
  }),
  sort: z.object({
    field: z.string().optional(),
    order: z.enum(['asc', 'desc']),
  }),
});

export type DemandGridResponse = z.infer<typeof demandGridResponseSchema>;

/**
 * Bulk delete schema
 */
export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  organizationId: z.string().uuid(),
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;

/**
 * Bulk update schema
 */
export const bulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  organizationId: z.string().uuid(),
  updates: z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    shift_type: z
      .enum(['morning', 'afternoon', 'evening', 'night', 'split', 'all_day'])
      .optional(),
    notes: z.string().max(500).optional(),
  }),
});

export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;

/**
 * Export schema
 */
export const exportSchema = z.object({
  organizationId: z.string().uuid(),
  format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
  filters: demandGridQuerySchema.omit({ page: true, pageSize: true }).optional(),
  columns: z
    .array(
      z.enum([
        'date',
        'department',
        'shift_type',
        'start_time',
        'end_time',
        'required_employees',
        'required_skills',
        'priority',
        'notes',
      ])
    )
    .optional(),
});

export type ExportInput = z.infer<typeof exportSchema>;
