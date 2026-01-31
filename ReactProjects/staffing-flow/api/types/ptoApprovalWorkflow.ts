/**
 * PTO Approval Workflow Type Definitions
 * Automated approval rules, batch operations, and approval chains
 */

import type { PTOType } from './laborActions';

// =============================================
// APPROVAL RULE TYPES
// =============================================

/**
 * Auto-Approval Rule
 */
export interface PTOAutoApprovalRule {
  id: string;
  organization_id: string;
  department_id?: string;
  rule_name: string;
  pto_types: PTOType[]; // Which PTO types this rule applies to
  max_days?: number; // Auto-approve if <= this many days
  max_consecutive_days?: number; // Auto-approve if <= consecutive days
  min_notice_days?: number; // Auto-approve if requested X days in advance
  auto_approve_sick?: boolean; // Auto-approve all sick leave
  requires_documentation?: boolean; // Require docs for certain types
  blackout_dates?: string[]; // Dates that cannot be auto-approved
  max_team_members_out?: number; // Max team members out at once
  enabled: boolean;
  priority: number; // Rule evaluation priority
  created_at: string;
  updated_at: string;
}

/**
 * Approval Chain Level
 */
export interface ApprovalChainLevel {
  level: number;
  approver_role: string; // 'manager' | 'senior_manager' | 'hr' | 'director'
  approver_id?: string; // Specific user ID if not role-based
  approval_type: 'any' | 'all'; // Any one person or all at this level
  required_for_days?: number; // Only required if >= X days
  required_for_types?: PTOType[]; // Only required for certain types
}

/**
 * Approval Chain
 */
export interface PTOApprovalChain {
  id: string;
  organization_id: string;
  department_id?: string;
  chain_name: string;
  levels: ApprovalChainLevel[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Approval Step (Instance)
 */
export interface PTOApprovalStep {
  id: string;
  pto_request_id: string;
  chain_level: number;
  approver_id: string;
  status: 'pending' | 'approved' | 'denied' | 'skipped';
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Approval Delegation
 */
export interface PTOApprovalDelegation {
  id: string;
  organization_id: string;
  delegator_id: string; // User delegating approval authority
  delegate_id: string; // User receiving approval authority
  start_date: string;
  end_date: string;
  department_ids?: string[]; // Specific departments or all
  active: boolean;
  reason?: string;
  created_at: string;
  updated_at: string;
}

// =============================================
// WORKFLOW REQUEST TYPES
// =============================================

/**
 * Process Pending Requests (Automated)
 */
export interface ProcessPendingPTORequestsRequest {
  organization_id: string;
  department_id?: string;
  dry_run?: boolean; // Preview results without applying
}

/**
 * Process Pending Requests Response
 */
export interface ProcessPendingPTORequestsResponse {
  processed_count: number;
  auto_approved_count: number;
  auto_denied_count: number;
  requires_manual_review_count: number;
  details: Array<{
    request_id: string;
    employee_id: string;
    action_taken: 'auto_approved' | 'auto_denied' | 'requires_review';
    reason: string;
    rule_applied?: string;
  }>;
}

/**
 * Batch Approve Requests
 */
export interface BatchApprovePTORequest {
  organization_id: string;
  request_ids: string[];
  approved_by: string;
  approval_notes?: string;
  override_conflicts?: boolean; // Approve even if conflicts exist
}

/**
 * Batch Approve Response
 */
export interface BatchApprovePTOResponse {
  total: number;
  approved: number;
  failed: number;
  results: Array<{
    request_id: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Batch Deny Requests
 */
export interface BatchDenyPTORequest {
  organization_id: string;
  request_ids: string[];
  denied_by: string;
  denial_reason: string;
}

/**
 * Batch Deny Response
 */
export interface BatchDenyPTOResponse {
  total: number;
  denied: number;
  failed: number;
  results: Array<{
    request_id: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Check Auto-Approval Eligibility
 */
export interface CheckAutoApprovalRequest {
  organization_id: string;
  department_id: string;
  employee_id: string;
  pto_type: PTOType;
  start_date: string;
  end_date: string;
  total_days: number;
}

/**
 * Check Auto-Approval Response
 */
export interface CheckAutoApprovalResponse {
  eligible: boolean;
  rule_matched?: PTOAutoApprovalRule;
  reasons: string[];
  requires_documentation: boolean;
  estimated_approval_time?: string; // 'immediate' | '24h' | '48h' | 'manual'
}

/**
 * Delegate Approval Authority
 */
export interface DelegateApprovalRequest {
  organization_id: string;
  delegator_id: string;
  delegate_id: string;
  start_date: string;
  end_date: string;
  department_ids?: string[];
  reason?: string;
}

/**
 * Get Pending Approvals
 */
export interface GetPendingApprovalsRequest {
  organization_id: string;
  approver_id: string;
  department_id?: string;
  include_delegated?: boolean; // Include requests delegated to this user
}

/**
 * Pending Approval Summary
 */
export interface PendingApprovalSummary {
  total_pending: number;
  by_priority: {
    urgent: number; // < 7 days away
    normal: number; // 7-14 days away
    future: number; // > 14 days away
  };
  by_type: Record<PTOType, number>;
  oldest_request_age_hours: number;
  requests: Array<{
    id: string;
    employee_id: string;
    employee_name?: string;
    pto_type: PTOType;
    start_date: string;
    end_date: string;
    total_days: number;
    requested_at: string;
    priority: 'urgent' | 'normal' | 'future';
    has_conflicts: boolean;
  }>;
}

/**
 * Approval Workflow Analytics
 */
export interface PTOApprovalAnalyticsRequest {
  organization_id: string;
  department_id?: string;
  start_date: string;
  end_date: string;
}

/**
 * Approval Workflow Analytics Response
 */
export interface PTOApprovalAnalyticsResponse {
  total_requests: number;
  auto_approved: number;
  manually_approved: number;
  denied: number;
  pending: number;
  auto_approval_rate: number; // Percentage
  average_approval_time_hours: number;
  by_approver: Array<{
    approver_id: string;
    approver_name?: string;
    requests_reviewed: number;
    approved: number;
    denied: number;
    avg_response_time_hours: number;
  }>;
  by_rule: Array<{
    rule_id: string;
    rule_name: string;
    requests_auto_approved: number;
    success_rate: number;
  }>;
}

/**
 * Create Approval Rule
 */
export interface CreateApprovalRuleRequest {
  organization_id: string;
  department_id?: string;
  rule_name: string;
  pto_types: PTOType[];
  max_days?: number;
  max_consecutive_days?: number;
  min_notice_days?: number;
  auto_approve_sick?: boolean;
  requires_documentation?: boolean;
  blackout_dates?: string[];
  max_team_members_out?: number;
  priority?: number;
}

/**
 * Update Approval Rule
 */
export interface UpdateApprovalRuleRequest {
  rule_id: string;
  rule_name?: string;
  pto_types?: PTOType[];
  max_days?: number;
  max_consecutive_days?: number;
  min_notice_days?: number;
  auto_approve_sick?: boolean;
  requires_documentation?: boolean;
  blackout_dates?: string[];
  max_team_members_out?: number;
  enabled?: boolean;
  priority?: number;
}

/**
 * Approval Notification
 */
export interface PTOApprovalNotification {
  type: 'request_submitted' | 'request_approved' | 'request_denied' | 'action_required' | 'delegation_active';
  pto_request_id?: string;
  recipient_id: string;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  action_url?: string;
  sent_at: string;
}
