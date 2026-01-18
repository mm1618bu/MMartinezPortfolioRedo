export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff' | 'viewer';
  organization_id: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id?: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hire_date: string;
  department_id: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  skills?: string[];
  certifications?: string[];
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  department_id: string;
  organization_id: string;
  break_duration_minutes?: number;
  required_skills?: string[];
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftAssignment {
  id: string;
  employee_id: string;
  shift_template_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  department_id: string;
  organization_id: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PTORequest {
  id: string;
  employee_id: string;
  request_type: 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  hours_requested: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reason?: string;
  approver_id?: string;
  approved_at?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceEvent {
  id: string;
  employee_id: string;
  shift_assignment_id?: string;
  event_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  event_time: string;
  location?: string;
  department_id?: string;
  organization_id: string;
  created_at: string;
}

export interface LaborAction {
  id: string;
  action_type: 'VET' | 'VTO';
  target_date: string;
  start_time?: string;
  end_time?: string;
  department_id: string;
  positions_needed?: number;
  status: 'draft' | 'published' | 'closed' | 'cancelled';
  reason?: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data?: any;
  new_data?: any;
  user_id?: string;
  organization_id?: string;
  created_at: string;
}
