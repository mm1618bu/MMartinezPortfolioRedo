export interface StaffingBuffer {
  id: string;
  name: string;
  description: string | null;
  buffer_percentage: number;
  buffer_minimum_count: number | null;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  effective_date: string;
  end_date: string | null;
  is_active: boolean;
  organization_id: string;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateStaffingBufferInput = Omit<
  StaffingBuffer,
  'id' | 'created_at' | 'updated_at'
>;

export interface StaffingBufferQueryParams {
  organizationId: string;
  departmentId?: string;
  isActive?: boolean;
  effectiveDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}
