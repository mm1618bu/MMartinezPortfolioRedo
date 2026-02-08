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
  department_id: string | null;
  department_name?: string | null;
  action_type: 'VET' | 'VTO';
  shift_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  positions_offered: number;
  positions_filled: number;
  positions_remaining: number;
  status: 'open' | 'closed' | 'cancelled' | 'draft';
  reason?: string | null;
  offer_deadline?: string | null;
  created_at: string;
}

export interface LaborActionResponse {
  action_id: string;
  employee_id: string;
  response_status: 'accepted' | 'declined' | 'pending' | 'waitlisted';
  response_time: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface ListOffersResponse<T> {
  success: boolean;
  data: T[];
}

interface OfferRecord {
  id: string;
  organization_id: string;
  department_id?: string | null;
  department_name?: string | null;
  action_type: 'VET' | 'VTO';
  target_date: string;
  start_time: string;
  end_time: string;
  positions_available: number;
  positions_filled: number;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  offer_message?: string | null;
  closes_at?: string | null;
  created_at: string;
}

const mapOfferToLaborAction = (offer: OfferRecord): LaborAction => {
  const positionsRemaining = Math.max(0, offer.positions_available - offer.positions_filled);

  return {
    action_id: offer.id,
    organization_id: offer.organization_id,
    department_id: offer.department_id ?? null,
    department_name: offer.department_name ?? null,
    action_type: offer.action_type,
    shift_date: offer.target_date,
    shift_type: 'all_day',
    start_time: offer.start_time,
    end_time: offer.end_time,
    positions_offered: offer.positions_available,
    positions_filled: offer.positions_filled,
    positions_remaining: positionsRemaining,
    status: offer.status,
    reason: offer.offer_message ?? undefined,
    offer_deadline: offer.closes_at ?? undefined,
    created_at: offer.created_at,
  };
};

export async function getAvailableLaborActions(
  organizationId: string,
  employeeId: string
): Promise<LaborAction[]> {
  const params = new URLSearchParams({
    organization_id: organizationId,
    status: 'open',
    limit: '100',
    offset: '0',
  });

  const [vetResponse, vtoResponse] = await Promise.all([
    fetch(`${API_BASE}/vet?${params.toString()}&action_type=VET`),
    fetch(`${API_BASE}/vet?${params.toString()}&action_type=VTO`),
  ]);

  if (!vetResponse.ok || !vtoResponse.ok) {
    throw new Error('Failed to fetch labor actions');
  }

  const vetData = (await vetResponse.json()) as ListOffersResponse<OfferRecord>;
  const vtoData = (await vtoResponse.json()) as ListOffersResponse<OfferRecord>;
  const vetOffers = (vetData.data || []).map(mapOfferToLaborAction);
  const vtoOffers = (vtoData.data || []).map(mapOfferToLaborAction);

  return [...vetOffers, ...vtoOffers];
}

export async function respondToLaborAction(
  actionId: string,
  employeeId: string,
  responseType: 'accept' | 'decline',
  organizationId: string,
  actionType: 'VET' | 'VTO'
): Promise<{ success: boolean; message: string }> {
  const responseStatus = responseType === 'accept' ? 'accepted' : 'declined';
  const endpoint = actionType === 'VET' ? 'vet' : 'vto';
  const response = await fetch(`${API_BASE}/${endpoint}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: organizationId,
      employee_id: employeeId,
      labor_action_id: actionId,
      response_status: responseStatus,
    }),
  });
  if (!response.ok) throw new Error('Failed to respond to labor action');
  return response.json();
}

export async function getMyLaborActionResponses(
  organizationId: string,
  employeeId: string
): Promise<LaborActionResponse[]> {
  void organizationId;
  void employeeId;
  return [];
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
