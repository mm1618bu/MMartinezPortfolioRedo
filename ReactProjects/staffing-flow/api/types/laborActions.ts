/**
 * Labor Actions Type Definitions (VET/VTO/PTO)
 * Voluntary Extra Time (VET), Voluntary Time Off (VTO), and Paid Time Off (PTO) management
 */

export type ActionType = 'VET' | 'VTO' | 'PTO';
export type ActionStatus = 'draft' | 'open' | 'closed' | 'cancelled';
export type ResponseStatus = 'accepted' | 'declined' | 'pending' | 'waitlisted';
export type PriorityOrder = 'seniority' | 'performance' | 'random' | 'first_come_first_serve';

// PTO-specific types
export type PTOType = 'vacation' | 'sick' | 'personal' | 'bereavement' | 'jury_duty' | 'military' | 'other';
export type PTOStatus = 'pending' | 'approved' | 'denied' | 'cancelled';
export type PTODayType = 'full_day' | 'half_day' | 'hours';

// =============================================
// DATABASE MODELS
// =============================================

/**
 * Labor Action (VET/VTO Offer)
 */
export interface LaborAction {
  id: string;
  action_type: ActionType;
  target_date: string; // ISO date string (YYYY-MM-DD)
  shift_template_id?: string | null;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  department_id?: string | null;
  positions_available: number;
  positions_filled: number;
  priority_order?: PriorityOrder | null;
  offer_message?: string | null;
  status: ActionStatus;
  posted_by: string; // User ID
  posted_at: string; // ISO datetime
  closes_at?: string | null; // ISO datetime
  organization_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Labor Action Response (Employee Response)
 */
export interface LaborActionResponse {
  id: string;
  labor_action_id: string;
  employee_id: string;
  response_status: ResponseStatus;
  response_time: string;
  priority_score?: number | null;
  approved_by?: string | null;
  approved_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// API REQUEST/RESPONSE TYPES
// =============================================

/**
 * Create/Publish VET Offer Request
 */
export interface PublishVETRequest {
  organization_id: string;
  department_id?: string; // Optional - can target all departments
  shift_template_id?: string; // Optional - can be custom time range
  target_date: string; // ISO date (YYYY-MM-DD)
  start_time: string; // ISO datetime or time (HH:MM:SS)
  end_time: string; // ISO datetime or time (HH:MM:SS)
  positions_available: number;
  priority_order?: PriorityOrder;
  offer_message?: string;
  closes_at?: string; // ISO datetime - when offer expires
  status?: 'draft' | 'open'; // Default 'open'
  posted_by: string; // User ID
}

/**
 * Update VET Offer Request
 */
export interface UpdateVETRequest {
  positions_available?: number;
  priority_order?: PriorityOrder;
  offer_message?: string;
  closes_at?: string;
  status?: ActionStatus;
}

/**
 * List VET Offers Request (Query Parameters)
 */
export interface ListVETRequest {
  organization_id: string;
  department_id?: string;
  status?: ActionStatus;
  target_date_from?: string; // ISO date
  target_date_to?: string; // ISO date
  action_type?: ActionType;
  limit?: number;
  offset?: number;
}

/**
 * Get VET Offer Details Response
 */
export interface VETOfferDetails extends LaborAction {
  posted_by_name?: string;
  department_name?: string;
  shift_template_name?: string;
  response_count: number;
  accepted_count: number;
  pending_count: number;
  declined_count: number;
  waitlisted_count: number;
  responses?: Array<LaborActionResponse & {
    employee_name?: string;
    employee_number?: string;
  }>;
}

/**
 * Employee Response to VET Offer Request
 */
export interface RespondToVETRequest {
  labor_action_id: string;
  employee_id: string;
  response_status: 'accepted' | 'declined';
  notes?: string;
}

/**
 * Approve/Reject Employee Response Request (Manager Action)
 */
export interface ApproveVETResponseRequest {
  response_id: string;
  approved: boolean; // true = approved, false = rejected
  approved_by: string; // User ID
  notes?: string;
}

/**
 * Bulk Publish VET Request
 */
export interface BulkPublishVETRequest {
  offers: PublishVETRequest[];
}

/**
 * VET Analytics Request
 */
export interface VETAnalyticsRequest {
  organization_id: string;
  department_id?: string;
  date_from: string;
  date_to: string;
}

/**
 * VET Analytics Response
 */
export interface VETAnalyticsResponse {
  total_offers: number;
  total_positions: number;
  filled_positions: number;
  fill_rate: number; // Percentage
  avg_response_time_minutes: number;
  offers_by_status: {
    draft: number;
    open: number;
    closed: number;
    cancelled: number;
  };
  responses_by_status: {
    accepted: number;
    declined: number;
    pending: number;
    waitlisted: number;
  };
  top_responding_employees?: Array<{
    employee_id: string;
    employee_name: string;
    response_count: number;
    acceptance_rate: number;
  }>;
  department_breakdown?: Array<{
    department_id: string;
    department_name: string;
    offers_count: number;
    fill_rate: number;
  }>;
}

/**
 * VET Offer List Response
 */
export interface VETOfferListResponse {
  success: boolean;
  data: VETOfferDetails[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

/**
 * Standard API Response
 */
export interface VETAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * VET Eligibility Check
 */
export interface VETEligibilityRequest {
  employee_id: string;
  labor_action_id: string;
}

export interface VETEligibilityResponse {
  eligible: boolean;
  reasons?: string[]; // Why eligible/not eligible
  priority_score?: number;
  restrictions?: {
    max_weekly_hours_exceeded?: boolean;
    already_scheduled?: boolean;
    missing_qualifications?: string[];
    blackout_period?: boolean;
  };
}

/**
 * VET Notification Preferences
 */
export interface VETNotificationPreferences {
  employee_id: string;
  notify_via_email: boolean;
  notify_via_sms: boolean;
  notify_via_push: boolean;
  department_ids?: string[]; // Only notify for these departments
  min_hours?: number; // Only notify if offer is at least X hours
  preferred_days?: number[]; // 0-6 (Sunday-Saturday)
}

// =============================================
// VTO (VOLUNTARY TIME OFF) TYPES
// =============================================

/**
 * Publish VTO Offer Request
 * VTO is offered when there is overstaffing - employees can volunteer to take time off
 */
export interface PublishVTORequest {
  organization_id: string;
  department_id?: string; // Optional - can target all departments
  shift_template_id?: string; // Optional - can be custom time range
  target_date: string; // ISO date (YYYY-MM-DD)
  start_time: string; // ISO datetime or time (HH:MM:SS)
  end_time: string; // ISO datetime or time (HH:MM:SS)
  positions_available: number; // Number of employees who can take VTO
  priority_order?: PriorityOrder; // How to select employees
  offer_message?: string; // Why VTO is being offered
  closes_at?: string; // ISO datetime - when offer expires
  status?: 'draft' | 'open'; // Default 'open'
  posted_by: string; // User ID
  paid?: boolean; // Whether VTO is paid (default: false/unpaid)
  requires_approval?: boolean; // Whether manager must approve (default: true)
}

/**
 * Update VTO Offer Request
 */
export interface UpdateVTORequest {
  positions_available?: number;
  priority_order?: PriorityOrder;
  offer_message?: string;
  closes_at?: string;
  status?: ActionStatus;
  paid?: boolean;
  requires_approval?: boolean;
}

/**
 * Respond to VTO Offer Request
 */
export interface RespondToVTORequest {
  labor_action_id: string;
  employee_id: string;
  response_status: 'accepted' | 'declined'; // Accept = willing to take time off
  notes?: string;
}

/**
 * VTO Offer Details Response
 */
export interface VTOOfferDetails extends LaborAction {
  posted_by_name?: string;
  department_name?: string;
  shift_template_name?: string;
  response_count: number;
  accepted_count: number;
  pending_count: number;
  declined_count: number;
  waitlisted_count: number;
  paid?: boolean;
  requires_approval?: boolean;
  responses?: Array<LaborActionResponse & {
    employee_name?: string;
    employee_number?: string;
  }>;
}

/**
 * VTO Analytics Request
 */
export interface VTOAnalyticsRequest {
  organization_id: string;
  department_id?: string;
  date_from: string;
  date_to: string;
}

/**
 * VTO Analytics Response
 */
export interface VTOAnalyticsResponse {
  total_offers: number;
  total_positions_offered: number; // How many VTO slots offered
  positions_taken: number; // How many employees took VTO
  acceptance_rate: number; // Percentage
  avg_response_time_minutes: number;
  offers_by_status: {
    draft: number;
    open: number;
    closed: number;
    cancelled: number;
  };
  responses_by_status: {
    accepted: number;
    declined: number;
    pending: number;
    waitlisted: number;
  };
  top_accepting_employees?: Array<{
    employee_id: string;
    employee_name: string;
    vto_count: number; // Number of VTOs taken
  }>;
  department_breakdown?: Array<{
    department_id: string;
    department_name: string;
    offers_count: number;
    acceptance_rate: number;
  }>;
  cost_savings?: number; // Estimated cost saved by VTO (if unpaid)
}

/**
 * Bulk Publish VTO Request
 */
export interface BulkPublishVTORequest {
  offers: PublishVTORequest[];
}

// =============================================
// VTO SAFETY FLOOR ENFORCEMENT
// =============================================

/**
 * Safety Floor Configuration
 * Defines minimum staffing levels that must be maintained
 */
export interface SafetyFloorConfig {
  id: string;
  organization_id: string;
  department_id?: string | null; // Null = applies to all departments
  shift_template_id?: string | null; // Null = applies to all shifts
  day_of_week?: number | null; // 0-6 (Sunday-Saturday), null = all days
  time_start?: string | null; // Time range start (HH:MM:SS)
  time_end?: string | null; // Time range end (HH:MM:SS)
  minimum_staff_count: number; // Absolute minimum staff required
  minimum_staff_percentage?: number | null; // % of scheduled staff (e.g., 80%)
  skill_requirements?: SkillRequirement[]; // Required skills/roles
  enforcement_level: 'strict' | 'warning' | 'advisory'; // How to enforce
  override_allowed: boolean; // Can managers override?
  created_at: string;
  updated_at: string;
}

/**
 * Skill Requirement for Safety Floor
 */
export interface SkillRequirement {
  skill_id: string;
  skill_name: string;
  minimum_count: number; // At least N people with this skill
}

/**
 * Safety Floor Check Request
 */
export interface SafetyFloorCheckRequest {
  organization_id: string;
  department_id?: string;
  shift_template_id?: string;
  target_date: string; // ISO date
  start_time: string; // ISO datetime or time
  end_time: string; // ISO datetime or time
  proposed_vto_count: number; // How many VTO slots being offered
}

/**
 * Safety Floor Check Response
 */
export interface SafetyFloorCheckResponse {
  is_safe: boolean; // Can VTO be offered without violating safety floor?
  enforcement_level: 'strict' | 'warning' | 'advisory' | 'none';
  current_staff_count: number; // Currently scheduled staff
  minimum_required: number; // Minimum staff required
  available_vto_slots: number; // Max VTO slots that can be offered safely
  proposed_vto_count: number; // Requested VTO slots
  staff_after_vto: number; // Staff count if VTO is fully taken
  violations?: SafetyFloorViolation[]; // Any violations detected
  override_required: boolean; // Does this require manager override?
  recommendation?: string; // System recommendation
}

/**
 * Safety Floor Violation
 */
export interface SafetyFloorViolation {
  config_id: string;
  violation_type: 'minimum_count' | 'minimum_percentage' | 'skill_requirement';
  current_value: number;
  required_value: number;
  deficit: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

/**
 * VTO Offer with Safety Floor Override
 */
export interface PublishVTOWithOverrideRequest extends PublishVTORequest {
  skip_safety_floor_check?: boolean; // Skip safety floor validation
  override_reason?: string; // Reason for override (required if skip=true)
  override_approved_by?: string; // Manager who approved override
}

/**
 * Safety Floor Audit Log
 */
export interface SafetyFloorAuditLog {
  id: string;
  labor_action_id: string;
  check_timestamp: string;
  is_safe: boolean;
  enforcement_level: string;
  current_staff_count: number;
  minimum_required: number;
  proposed_vto_count: number;
  override_applied: boolean;
  override_reason?: string;
  override_approved_by?: string;
  violations?: SafetyFloorViolation[];
  created_at: string;
}

// =============================================
// PTO REQUEST TYPES
// =============================================

/**
 * PTO Request
 */
export interface PTORequest {
  id: string;
  organization_id: string;
  employee_id: string;
  department_id: string;
  pto_type: PTOType;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  day_type: PTODayType;
  hours_requested?: number; // For partial day requests
  total_days: number; // Business days requested
  status: PTOStatus;
  reason?: string;
  notes?: string;
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approval_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * PTO Balance
 */
export interface PTOBalance {
  id: string;
  organization_id: string;
  employee_id: string;
  pto_type: PTOType;
  balance_hours: number;
  used_hours: number;
  pending_hours: number;
  accrual_rate?: number; // Hours per pay period
  max_balance?: number; // Maximum accrual cap
  year: number;
  created_at: string;
  updated_at: string;
}

/**
 * PTO Conflict
 */
export interface PTOConflict {
  conflict_type: 'overlapping_request' | 'minimum_staffing' | 'blackout_date' | 'insufficient_balance';
  severity: 'blocking' | 'warning' | 'info';
  message: string;
  details?: any;
}

// =============================================
// PTO REQUEST API TYPES
// =============================================

/**
 * Request PTO
 */
export interface RequestPTORequest {
  organization_id: string;
  employee_id: string;
  department_id: string;
  pto_type: PTOType;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  day_type?: PTODayType; // Default: 'full_day'
  hours_requested?: number; // Required if day_type is 'hours'
  reason?: string;
  notes?: string;
}

/**
 * Update PTO Request
 */
export interface UpdatePTORequest {
  request_id: string;
  start_date?: string;
  end_date?: string;
  day_type?: PTODayType;
  hours_requested?: number;
  reason?: string;
  notes?: string;
}

/**
 * Review PTO Request (Approve/Deny)
 */
export interface ReviewPTORequest {
  request_id: string;
  action: 'approve' | 'deny';
  reviewed_by: string; // Manager/reviewer user ID
  approval_notes?: string;
}

/**
 * Cancel PTO Request
 */
export interface CancelPTORequest {
  request_id: string;
  employee_id: string; // Must be the requester
  reason?: string;
}

/**
 * List PTO Requests
 */
export interface ListPTORequestsRequest {
  organization_id: string;
  employee_id?: string; // Filter by employee
  department_id?: string; // Filter by department
  status?: PTOStatus; // Filter by status
  pto_type?: PTOType; // Filter by type
  start_date?: string; // Filter by date range
  end_date?: string;
  limit?: number;
  offset?: number;
}

/**
 * Check PTO Availability
 */
export interface CheckPTOAvailabilityRequest {
  organization_id: string;
  employee_id: string;
  department_id: string;
  start_date: string;
  end_date: string;
  day_type?: PTODayType;
  hours_requested?: number;
  exclude_request_id?: string; // Exclude specific request from conflict check
}

/**
 * Check PTO Availability Response
 */
export interface CheckPTOAvailabilityResponse {
  available: boolean;
  conflicts: PTOConflict[];
  current_balance?: number;
  required_balance?: number;
  overlapping_requests?: PTORequest[];
  staffing_level?: {
    scheduled_staff: number;
    requested_off: number;
    minimum_required: number;
    remaining_staff: number;
  };
  recommendation: string;
}

/**
 * Get PTO Balance
 */
export interface GetPTOBalanceRequest {
  organization_id: string;
  employee_id: string;
  year?: number; // Default: current year
  pto_type?: PTOType; // Get specific type or all types
}

/**
 * PTO Analytics Request
 */
export interface PTOAnalyticsRequest {
  organization_id: string;
  department_id?: string;
  start_date: string;
  end_date: string;
  group_by?: 'day' | 'week' | 'month' | 'pto_type';
}

/**
 * PTO Analytics Response
 */
export interface PTOAnalyticsResponse {
  total_requests: number;
  approved_requests: number;
  denied_requests: number;
  pending_requests: number;
  cancelled_requests: number;
  total_days_requested: number;
  total_days_approved: number;
  approval_rate: number; // Percentage
  average_response_time_hours: number;
  by_type?: Record<PTOType, {
    count: number;
    days: number;
    approval_rate: number;
  }>;
  by_period?: Array<{
    period: string;
    requests: number;
    approved: number;
    denied: number;
  }>;
}
