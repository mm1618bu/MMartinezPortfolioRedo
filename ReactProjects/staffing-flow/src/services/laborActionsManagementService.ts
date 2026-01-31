/**
 * Labor Actions Management Service
 * API service for managers/admins to manage VET/VTO, PTO, UPT, and schedules
 */

const API_BASE = '/api/labor-actions';

// ============================================================================
// VET/VTO Management
// ============================================================================

export interface CreateLaborActionRequest {
  organization_id: string;
  department_id: string;
  action_type: 'VET' | 'VTO';
  shift_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  positions_offered: number;
  reason?: string;
  offer_deadline?: string;
  eligible_employee_ids?: string[];
}

export interface LaborActionWithResponses {
  action_id: string;
  organization_id: string;
  department_id: string;
  department_name: string;
  action_type: 'VET' | 'VTO';
  shift_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  positions_offered: number;
  positions_filled: number;
  positions_remaining: number;
  status: 'open' | 'closed' | 'cancelled';
  reason?: string;
  offer_deadline?: string;
  created_at: string;
  created_by: string;
  responses: LaborActionResponse[];
}

export interface LaborActionResponse {
  response_id: string;
  action_id: string;
  employee_id: string;
  employee_name: string;
  response_type: 'accept' | 'decline';
  response_time: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
}

export async function createLaborAction(request: CreateLaborActionRequest): Promise<{ success: boolean; action: LaborActionWithResponses }> {
  const response = await fetch(`${API_BASE}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to create labor action');
  return response.json();
}

export async function getLaborActions(organizationId: string, filters?: {
  department_id?: string;
  action_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}): Promise<LaborActionWithResponses[]> {
  const params = new URLSearchParams({ organization_id: organizationId });
  if (filters?.department_id) params.append('department_id', filters.department_id);
  if (filters?.action_type) params.append('action_type', filters.action_type);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);

  const response = await fetch(`${API_BASE}/actions?${params}`);
  if (!response.ok) throw new Error('Failed to fetch labor actions');
  const data = await response.json();
  return data.actions || [];
}

export async function approveResponse(responseId: string, organizationId: string, reviewedBy: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/responses/${responseId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organization_id: organizationId, reviewed_by: reviewedBy }),
  });
  if (!response.ok) throw new Error('Failed to approve response');
  return response.json();
}

export async function rejectResponse(responseId: string, organizationId: string, reviewedBy: string, reason?: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/responses/${responseId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organization_id: organizationId, reviewed_by: reviewedBy, reason }),
  });
  if (!response.ok) throw new Error('Failed to reject response');
  return response.json();
}

export async function closeLaborAction(actionId: string, organizationId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/actions/${actionId}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organization_id: organizationId }),
  });
  if (!response.ok) throw new Error('Failed to close labor action');
  return response.json();
}

// ============================================================================
// PTO Approval Management
// ============================================================================

export interface PTORequestWithEmployee {
  request_id: string;
  organization_id: string;
  employee_id: string;
  employee_name: string;
  department_id: string;
  department_name: string;
  pto_type: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  reason?: string;
  denial_reason?: string;
  submitted_at: string;
  approved_at?: string;
  approved_by?: string;
  approved_by_name?: string;
  employee_balance?: number;
  conflicts?: string[];
}

export async function getPendingPTORequests(organizationId: string, departmentId?: string): Promise<PTORequestWithEmployee[]> {
  const params = new URLSearchParams({ organization_id: organizationId, status: 'pending' });
  if (departmentId) params.append('department_id', departmentId);

  const response = await fetch(`${API_BASE}/pto/requests?${params}`);
  if (!response.ok) throw new Error('Failed to fetch PTO requests');
  const data = await response.json();
  return data.requests || [];
}

export async function approvePTORequest(requestId: string, organizationId: string, approvedBy: string, notes?: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/pto/requests/${requestId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organization_id: organizationId, approved_by: approvedBy, notes }),
  });
  if (!response.ok) throw new Error('Failed to approve PTO request');
  return response.json();
}

export async function denyPTORequest(requestId: string, organizationId: string, approvedBy: string, denialReason: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/pto/requests/${requestId}/deny`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organization_id: organizationId, approved_by: approvedBy, denial_reason: denialReason }),
  });
  if (!response.ok) throw new Error('Failed to deny PTO request');
  return response.json();
}

// ============================================================================
// UPT Management
// ============================================================================

export interface UPTExceptionWithEmployee {
  exception_id: string;
  employee_id: string;
  employee_name: string;
  department_id: string;
  department_name: string;
  exception_type: string;
  exception_date: string;
  occurrence_time: string;
  severity: string;
  minutes_missed: number;
  upt_hours_deducted: number;
  is_excused: boolean;
  excuse_reason?: string;
  notes?: string;
  created_at: string;
  current_balance?: number;
  balance_status?: string;
}

export interface EmployeeAtRisk {
  employee_id: string;
  employee_name: string;
  department_id: string;
  department_name: string;
  current_balance_hours: number;
  balance_status: string;
  total_exceptions: number;
  exceptions_last_30_days: number;
  last_exception_date?: string;
  days_until_termination?: number;
  recommended_action: string;
}

export async function getUPTExceptions(organizationId: string, filters?: {
  department_id?: string;
  employee_id?: string;
  is_excused?: boolean;
  balance_status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<UPTExceptionWithEmployee[]> {
  const params = new URLSearchParams({ organization_id: organizationId });
  if (filters?.department_id) params.append('department_id', filters.department_id);
  if (filters?.employee_id) params.append('employee_id', filters.employee_id);
  if (filters?.is_excused !== undefined) params.append('is_excused', String(filters.is_excused));
  if (filters?.balance_status) params.append('balance_status', filters.balance_status);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.limit) params.append('limit', String(filters.limit));

  const response = await fetch(`${API_BASE}/upt/exceptions?${params}`);
  if (!response.ok) throw new Error('Failed to fetch UPT exceptions');
  const data = await response.json();
  return data.exceptions || [];
}

export async function excuseUPTException(exceptionId: string, organizationId: string, approvedBy: string, excuseReason: string, refundUPT: boolean = true): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/upt/exceptions/${exceptionId}/excuse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: organizationId,
      approved_by: approvedBy,
      excuse_reason: excuseReason,
      refund_upt: refundUPT,
    }),
  });
  if (!response.ok) throw new Error('Failed to excuse exception');
  return response.json();
}

export async function getEmployeesAtRisk(organizationId: string, departmentId?: string, statusFilter?: string[]): Promise<EmployeeAtRisk[]> {
  const params = new URLSearchParams({ organization_id: organizationId });
  if (departmentId) params.append('department_id', departmentId);
  if (statusFilter) params.append('status_filter', statusFilter.join(','));

  const response = await fetch(`${API_BASE}/upt/employees-at-risk?${params}`);
  if (!response.ok) throw new Error('Failed to fetch at-risk employees');
  const data = await response.json();
  return data.employees || [];
}

export async function detectUPTExceptions(organizationId: string, departmentId?: string, startDate?: string, endDate?: string): Promise<{
  success: boolean;
  exceptions_detected: number;
  exceptions_created: number;
  upt_hours_deducted: number;
  employees_affected: number;
}> {
  const response = await fetch(`${API_BASE}/upt/detect-exceptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: organizationId,
      department_id: departmentId,
      start_date: startDate || new Date().toISOString().split('T')[0],
      end_date: endDate || new Date().toISOString().split('T')[0],
      auto_deduct_upt: true,
      send_notifications: true,
    }),
  });
  if (!response.ok) throw new Error('Failed to detect exceptions');
  return response.json();
}

// ============================================================================
// Analytics
// ============================================================================

export interface LaborActionsAnalytics {
  total_vet_offered: number;
  total_vto_offered: number;
  vet_acceptance_rate: number;
  vto_acceptance_rate: number;
  avg_response_time_hours: number;
  by_department: Array<{
    department_id: string;
    department_name: string;
    vet_count: number;
    vto_count: number;
    acceptance_rate: number;
  }>;
}

export interface PTOAnalytics {
  total_requests: number;
  pending_requests: number;
  approval_rate: number;
  avg_approval_time_hours: number;
  by_type: Array<{
    pto_type: string;
    count: number;
    approval_rate: number;
  }>;
  by_department: Array<{
    department_id: string;
    department_name: string;
    total_requests: number;
    approval_rate: number;
  }>;
}

export interface UPTAnalytics {
  total_exceptions: number;
  employees_healthy: number;
  employees_warning: number;
  employees_critical: number;
  avg_exceptions_per_employee: number;
  by_type: Array<{
    exception_type: string;
    count: number;
    avg_hours_deducted: number;
  }>;
  by_department: Array<{
    department_id: string;
    department_name: string;
    total_exceptions: number;
    employees_at_risk: number;
  }>;
}

export async function getLaborActionsAnalytics(organizationId: string, startDate: string, endDate: string): Promise<LaborActionsAnalytics> {
  const params = new URLSearchParams({ organization_id: organizationId, start_date: startDate, end_date: endDate });
  const response = await fetch(`${API_BASE}/analytics/labor-actions?${params}`);
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

export async function getPTOAnalytics(organizationId: string, startDate: string, endDate: string): Promise<PTOAnalytics> {
  const params = new URLSearchParams({ organization_id: organizationId, start_date: startDate, end_date: endDate });
  const response = await fetch(`${API_BASE}/analytics/pto?${params}`);
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
}

export async function getUPTAnalytics(organizationId: string, startDate: string, endDate: string): Promise<UPTAnalytics> {
  const params = new URLSearchParams({ organization_id: organizationId, start_date: startDate, end_date: endDate, group_by: 'department' });
  const response = await fetch(`${API_BASE}/upt/analytics?${params}`);
  if (!response.ok) throw new Error('Failed to fetch analytics');
  const data = await response.json();
  
  return {
    total_exceptions: data.summary?.total_exceptions || 0,
    employees_healthy: data.summary?.employees_healthy || 0,
    employees_warning: data.summary?.employees_warning || 0,
    employees_critical: data.summary?.employees_critical || 0,
    avg_exceptions_per_employee: data.summary?.avg_exceptions_per_employee || 0,
    by_type: data.by_exception_type || [],
    by_department: data.by_department || [],
  };
}
