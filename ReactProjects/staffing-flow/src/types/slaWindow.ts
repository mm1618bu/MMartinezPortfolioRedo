export interface SLAWindow {
  id: string;
  name: string;
  description: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  required_coverage_percentage: number;
  minimum_staff_count: number | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effective_date: string;
  end_date: string | null;
  is_active: boolean;
  organization_id: string;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateSLAWindowInput = Omit<
  SLAWindow,
  'id' | 'created_at' | 'updated_at'
>;

export interface SLAWindowQueryParams {
  organizationId: string;
  departmentId?: string;
  dayOfWeek?: string;
  priority?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
