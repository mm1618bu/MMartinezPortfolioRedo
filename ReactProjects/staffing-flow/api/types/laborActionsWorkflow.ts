/**
 * VET Acceptance Workflow Types
 * Automated processing of VET responses with priority-based acceptance
 */

import type {
  LaborActionResponse,
  ResponseStatus,
  ActionStatus,
} from './laborActions';

// =============================================
// WORKFLOW CONFIGURATION
// =============================================

/**
 * Workflow configuration for VET acceptance
 */
export interface WorkflowConfig {
  auto_approve_enabled: boolean;
  auto_waitlist_enabled: boolean;
  auto_close_when_filled: boolean;
  send_notifications: boolean;
  priority_scoring_enabled: boolean;
  max_waitlist_size?: number;
  approval_timeout_minutes?: number;
}

/**
 * Default workflow configuration
 */
export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  auto_approve_enabled: true,
  auto_waitlist_enabled: true,
  auto_close_when_filled: true,
  send_notifications: true,
  priority_scoring_enabled: true,
  max_waitlist_size: 20,
  approval_timeout_minutes: 1440, // 24 hours
};

// =============================================
// PRIORITY SCORING
// =============================================

/**
 * Factors for calculating employee priority score
 */
export interface PriorityScoreFactors {
  seniority_years?: number;
  performance_rating?: number; // 0-100
  attendance_rate?: number; // 0-100
  vet_acceptance_history?: number; // Number of VETs accepted in past
  last_vet_date?: string; // ISO date of last VET worked
  response_speed_minutes?: number; // Minutes to respond
  skills_match?: number; // 0-100 match score
  availability_conflicts?: number; // Number of conflicts
}

/**
 * Weighted priority scoring configuration
 */
export interface PriorityWeights {
  seniority: number;
  performance: number;
  attendance: number;
  history: number;
  recency: number;
  speed: number;
  skills: number;
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  seniority: 0.25,
  performance: 0.20,
  attendance: 0.15,
  history: 0.15,
  recency: 0.10,
  speed: 0.10,
  skills: 0.05,
};

// =============================================
// WORKFLOW PROCESSING
// =============================================

/**
 * Process VET responses request
 */
export interface ProcessResponsesRequest {
  labor_action_id: string;
  workflow_config?: Partial<WorkflowConfig>;
  priority_weights?: Partial<PriorityWeights>;
  processed_by: string; // User ID triggering workflow
}

/**
 * Response processing result
 */
export interface ResponseProcessingResult {
  response_id: string;
  employee_id: string;
  employee_name?: string;
  original_status: ResponseStatus;
  new_status: ResponseStatus;
  priority_score: number;
  action_taken: 'approved' | 'waitlisted' | 'rejected' | 'no_action';
  reason: string;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  success: boolean;
  labor_action_id: string;
  total_responses: number;
  processed_count: number;
  approved_count: number;
  waitlisted_count: number;
  rejected_count: number;
  no_action_count: number;
  positions_filled: number;
  positions_available: number;
  offer_closed: boolean;
  processing_details: ResponseProcessingResult[];
  notifications_sent: number;
  execution_time_ms: number;
  errors?: string[];
}

// =============================================
// AUTO-APPROVAL RULES
// =============================================

/**
 * Auto-approval rule configuration
 */
export interface AutoApprovalRule {
  id: string;
  rule_name: string;
  organization_id: string;
  department_id?: string;
  enabled: boolean;
  conditions: AutoApprovalCondition[];
  priority: number; // Higher = evaluated first
  created_at: string;
  updated_at: string;
}

/**
 * Condition for auto-approval
 */
export interface AutoApprovalCondition {
  field: 'priority_score' | 'seniority' | 'performance' | 'attendance' | 'response_time';
  operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  value: number;
  required: boolean; // Must pass vs. nice to have
}

/**
 * Auto-approval evaluation result
 */
export interface AutoApprovalEvaluation {
  eligible: boolean;
  rule_matched?: AutoApprovalRule;
  conditions_passed: number;
  conditions_failed: number;
  reasons: string[];
}

// =============================================
// WAITLIST MANAGEMENT
// =============================================

/**
 * Waitlist entry
 */
export interface WaitlistEntry {
  response_id: string;
  employee_id: string;
  labor_action_id: string;
  priority_score: number;
  waitlist_position: number;
  added_at: string;
  notified: boolean;
}

/**
 * Waitlist processing result
 */
export interface WaitlistProcessingResult {
  promoted_count: number;
  promoted_employees: Array<{
    employee_id: string;
    employee_name?: string;
    from_position: number;
  }>;
  remaining_waitlist: number;
}

// =============================================
// NOTIFICATIONS
// =============================================

/**
 * Notification types for workflow
 */
export type WorkflowNotificationType =
  | 'response_received'
  | 'response_approved'
  | 'response_rejected'
  | 'added_to_waitlist'
  | 'promoted_from_waitlist'
  | 'offer_closed'
  | 'offer_filled'
  | 'approval_required';

/**
 * Workflow notification payload
 */
export interface WorkflowNotification {
  type: WorkflowNotificationType;
  recipient_id: string; // Employee or manager ID
  labor_action_id: string;
  response_id?: string;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
  data?: Record<string, any>;
}

// =============================================
// BATCH OPERATIONS
// =============================================

/**
 * Batch approve responses request
 */
export interface BatchApproveRequest {
  labor_action_id: string;
  response_ids: string[];
  approved_by: string;
  notes?: string;
}

/**
 * Batch reject responses request
 */
export interface BatchRejectRequest {
  labor_action_id: string;
  response_ids: string[];
  rejected_by: string;
  reason: string;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  success: boolean;
  total_requested: number;
  successful_count: number;
  failed_count: number;
  results: Array<{
    response_id: string;
    success: boolean;
    error?: string;
  }>;
}

// =============================================
// WORKFLOW HISTORY
// =============================================

/**
 * Workflow execution history
 */
export interface WorkflowExecution {
  id: string;
  labor_action_id: string;
  execution_type: 'manual' | 'automatic' | 'scheduled';
  triggered_by: string; // User ID
  triggered_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  config_used: WorkflowConfig;
  results?: WorkflowExecutionResult;
  error_message?: string;
}

// =============================================
// API RESPONSES
// =============================================

/**
 * Standard workflow API response
 */
export interface WorkflowAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Get workflow status response
 */
export interface WorkflowStatusResponse {
  labor_action_id: string;
  offer_status: ActionStatus;
  positions_available: number;
  positions_filled: number;
  pending_responses: number;
  approved_responses: number;
  waitlisted_responses: number;
  workflow_enabled: boolean;
  last_processed_at?: string;
  next_processing_scheduled?: string;
}

/**
 * Priority score breakdown for transparency
 */
export interface PriorityScoreBreakdown {
  total_score: number;
  max_possible_score: number;
  percentage: number;
  factors: {
    seniority: { score: number; weight: number; weighted_score: number };
    performance: { score: number; weight: number; weighted_score: number };
    attendance: { score: number; weight: number; weighted_score: number };
    history: { score: number; weight: number; weighted_score: number };
    recency: { score: number; weight: number; weighted_score: number };
    speed: { score: number; weight: number; weighted_score: number };
    skills: { score: number; weight: number; weighted_score: number };
  };
  recommendations?: string[];
}

/**
 * Response with priority details
 */
export interface ResponseWithPriority extends LaborActionResponse {
  employee_name?: string;
  employee_number?: string;
  priority_score: number;
  priority_breakdown?: PriorityScoreBreakdown;
  waitlist_position?: number;
  estimated_approval_chance?: number; // 0-100
}

// =============================================
// SCHEDULING
// =============================================

/**
 * Scheduled workflow execution
 */
export interface ScheduledWorkflow {
  id: string;
  labor_action_id: string;
  schedule_type: 'once' | 'recurring';
  execute_at: string; // ISO datetime
  recurring_interval_minutes?: number;
  enabled: boolean;
  config: WorkflowConfig;
  created_by: string;
  created_at: string;
}

/**
 * Create scheduled workflow request
 */
export interface CreateScheduledWorkflowRequest {
  labor_action_id: string;
  execute_at: string;
  recurring_interval_minutes?: number;
  config?: Partial<WorkflowConfig>;
  created_by: string;
}
