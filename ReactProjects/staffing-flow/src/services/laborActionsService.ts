/**
 * Labor Actions Service
 * Handles API calls for VET, VTO, PTO, and UPT tracking
 */

const API_BASE = '/api/labor-actions';

// ============================================================================
// VET/VTO Actions
// ============================================================================

export interface LaborAction {
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
}

export interface LaborActionResponse {
  action_id: string;
  employee_id: string;
  employee_name: string;
  response_type: 'accept' | 'decline';
  response_time: string;
  status: 'pending' | 'approved' | 'rejected';
}

export async function getAvailableLaborActions(
  organizationId: string,
  employeeId: string
): Promise<LaborAction[]> {
  const response = await fetch(
    `${API_BASE}/actions/available?organization_id=${organizationId}&employee_id=${employeeId}`
  );
  if (!response.ok) throw new Error('Failed to fetch labor actions');
  const data = await response.json();
  return data.actions || [];
}

export async function respondToLaborAction(
  actionId: string,
  employeeId: string,
  responseType: 'accept' | 'decline',
  organizationId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/actions/${actionId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: organizationId,
      employee_id: employeeId,
      response_type: responseType,
    }),
  });
  if (!response.ok) throw new Error('Failed to respond to labor action');
  return response.json();
}

export async function getMyLaborActionResponses(
  organizationId: string,
  employeeId: string
): Promise<LaborActionResponse[]> {
  const response = await fetch(
    `${API_BASE}/responses?organization_id=${organizationId}&employee_id=${employeeId}`
  );
  if (!response.ok) throw new Error('Failed to fetch responses');
  const data = await response.json();
  return data.responses || [];
}

// ============================================================================
// PTO Requests
// ============================================================================

export interface PTORequest {
  request_id: string;
  organization_id: string;
  employee_id: string;
  employee_name: string;
  department_id: string;
  department_name: string;
  pto_type: 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury_duty' | 'military';
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
}

export interface PTOBalance {
  employee_id: string;
  pto_type: string;
  available_hours: number;
  used_hours: number;
  pending_hours: number;
  total_accrued_hours: number;
}

export async function getPTORequests(
  organizationId: string,
  employeeId: string
): Promise<PTORequest[]> {
  const response = await fetch(
    `${API_BASE}/pto/requests?organization_id=${organizationId}&employee_id=${employeeId}`
  );
  if (!response.ok) throw new Error('Failed to fetch PTO requests');
  const data = await response.json();
  return data.requests || [];
}

export async function getPTOBalances(
  organizationId: string,
  employeeId: string
): Promise<PTOBalance[]> {
  const response = await fetch(
    `${API_BASE}/pto/balance?organization_id=${organizationId}&employee_id=${employeeId}`
  );
  if (!response.ok) throw new Error('Failed to fetch PTO balances');
  const data = await response.json();
  return data.balances || [];
}

export async function submitPTORequest(request: {
  organization_id: string;
  employee_id: string;
  department_id: string;
  pto_type: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  reason?: string;
}): Promise<{ success: boolean; request: PTORequest }> {
  const response = await fetch(`${API_BASE}/pto/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to submit PTO request');
  return response.json();
}

export async function cancelPTORequest(
  requestId: string,
  organizationId: string,
  employeeId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/pto/requests/${requestId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: organizationId,
      employee_id: employeeId,
    }),
  });
  if (!response.ok) throw new Error('Failed to cancel PTO request');
  return response.json();
}

// ============================================================================
// UPT Tracking
// ============================================================================

export interface UPTBalance {
  balance_id: string;
  employee_id: string;
  employee_name: string;
  current_balance_hours: number;
  initial_balance_hours: number;
  total_used_hours: number;
  total_excused_hours: number;
  warning_threshold_hours: number;
  critical_threshold_hours: number;
  termination_threshold_hours: number;
  balance_status: 'healthy' | 'warning' | 'critical' | 'terminated';
  is_negative: boolean;
  exceptions_this_month: number;
  exceptions_this_year: number;
  last_exception_date?: string;
  last_balance_update: string;
}

export interface UPTException {
  exception_id: string;
  employee_id: string;
  employee_name: string;
  exception_type: 'absence' | 'tardiness' | 'early_departure' | 'missed_punch' | 'extended_break' | 'no_call_no_show' | 'partial_absence';
  exception_date: string;
  occurrence_time: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  minutes_missed: number;
  upt_hours_deducted: number;
  is_excused: boolean;
  excuse_reason?: string;
  notes?: string;
  created_at: string;
}

export async function getUPTBalance(
  organizationId: string,
  employeeId: string
): Promise<{ balance: UPTBalance; recent_exceptions: UPTException[] }> {
  const response = await fetch(
    `${API_BASE}/upt/balance?organization_id=${organizationId}&employee_id=${employeeId}`
  );
  if (!response.ok) throw new Error('Failed to fetch UPT balance');
  return response.json();
}

export async function getUPTExceptions(
  organizationId: string,
  employeeId: string,
  limit: number = 50
): Promise<UPTException[]> {
  const response = await fetch(
    `${API_BASE}/upt/exceptions?organization_id=${organizationId}&employee_id=${employeeId}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to fetch UPT exceptions');
  const data = await response.json();
  return data.exceptions || [];
}

// ============================================================================
// Schedule/Shifts
// ============================================================================

export interface ShiftAssignment {
  shift_id: string;
  employee_id: string;
  shift_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  department_name: string;
  duration_hours: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export async function getMySchedule(
  organizationId: string,
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<ShiftAssignment[]> {
  const response = await fetch(
    `${API_BASE}/schedule?organization_id=${organizationId}&employee_id=${employeeId}&start_date=${startDate}&end_date=${endDate}`
  );
  if (!response.ok) throw new Error('Failed to fetch schedule');
  const data = await response.json();
  return data.shifts || [];
}
