export interface Demand {
  id: string;
  date: string;
  department_id: string;
  shift_type?: 'morning' | 'afternoon' | 'evening' | 'night' | 'split' | 'all_day';
  start_time?: string;
  end_time?: string;
  required_employees: number;
  required_skills?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}
