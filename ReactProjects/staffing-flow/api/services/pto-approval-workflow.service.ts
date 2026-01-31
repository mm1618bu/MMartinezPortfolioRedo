/**
 * PTO Approval Workflow Service
 * Automated approval rules, batch operations, and approval chains
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { laborActionsService } from './labor-actions.service';
import type {
  PTOAutoApprovalRule,
  PTOApprovalDelegation,
  ProcessPendingPTORequestsRequest,
  ProcessPendingPTORequestsResponse,
  BatchApprovePTORequest,
  BatchApprovePTOResponse,
  BatchDenyPTORequest,
  BatchDenyPTOResponse,
  CheckAutoApprovalRequest,
  CheckAutoApprovalResponse,
  DelegateApprovalRequest,
  GetPendingApprovalsRequest,
  PendingApprovalSummary,
  PTOApprovalAnalyticsRequest,
  PTOApprovalAnalyticsResponse,
  CreateApprovalRuleRequest,
  UpdateApprovalRuleRequest,
} from '../types/ptoApprovalWorkflow';
import type { PTORequest, VETAPIResponse } from '../types/laborActions';

export class PTOApprovalWorkflowService {
  /**
   * Process pending PTO requests with automated rules
   */
  async processPendingRequests(
    request: ProcessPendingPTORequestsRequest
  ): Promise<VETAPIResponse<ProcessPendingPTORequestsResponse>> {
    try {
      // Get all pending requests
      let query = supabase
        .from('pto_requests')
        .select('*')
        .eq('organization_id', request.organization_id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }

      const { data: pendingRequests, error } = await query;

      if (error) {
        logger.error('Error fetching pending requests:', error);
        return {
          success: false,
          error: `Failed to fetch pending requests: ${error.message}`,
        };
      }

      if (!pendingRequests || pendingRequests.length === 0) {
        return {
          success: true,
          data: {
            processed_count: 0,
            auto_approved_count: 0,
            auto_denied_count: 0,
            requires_manual_review_count: 0,
            details: [],
          },
        };
      }

      const results: ProcessPendingPTORequestsResponse = {
        processed_count: 0,
        auto_approved_count: 0,
        auto_denied_count: 0,
        requires_manual_review_count: 0,
        details: [],
      };

      // Process each request
      for (const ptoRequest of pendingRequests) {
        results.processed_count++;

        // Check auto-approval eligibility
        const eligibilityCheck = await this.checkAutoApprovalEligibility({
          organization_id: ptoRequest.organization_id,
          department_id: ptoRequest.department_id,
          employee_id: ptoRequest.employee_id,
          pto_type: ptoRequest.pto_type,
          start_date: ptoRequest.start_date,
          end_date: ptoRequest.end_date,
          total_days: ptoRequest.total_days,
        });

        if (eligibilityCheck.eligible) {
          // Auto-approve
          if (!request.dry_run) {
            await laborActionsService.reviewPTORequest({
              request_id: ptoRequest.id,
              action: 'approve',
              reviewed_by: 'system',
              approval_notes: `Auto-approved by rule: ${eligibilityCheck.rule_matched?.rule_name || 'Default'}`,
            });
          }

          results.auto_approved_count++;
          results.details.push({
            request_id: ptoRequest.id,
            employee_id: ptoRequest.employee_id,
            action_taken: 'auto_approved',
            reason: eligibilityCheck.reasons.join('; '),
            rule_applied: eligibilityCheck.rule_matched?.rule_name,
          });
        } else {
          // Check if should be auto-denied
          const shouldDeny = await this.shouldAutoDeny(ptoRequest);

          if (shouldDeny.deny) {
            if (!request.dry_run) {
              await laborActionsService.reviewPTORequest({
                request_id: ptoRequest.id,
                action: 'deny',
                reviewed_by: 'system',
                approval_notes: `Auto-denied: ${shouldDeny.reason}`,
              });
            }

            results.auto_denied_count++;
            results.details.push({
              request_id: ptoRequest.id,
              employee_id: ptoRequest.employee_id,
              action_taken: 'auto_denied',
              reason: shouldDeny.reason,
            });
          } else {
            // Requires manual review
            results.requires_manual_review_count++;
            results.details.push({
              request_id: ptoRequest.id,
              employee_id: ptoRequest.employee_id,
              action_taken: 'requires_review',
              reason: eligibilityCheck.reasons.join('; '),
            });
          }
        }
      }

      logger.info(`Processed ${results.processed_count} pending PTO requests`, {
        auto_approved: results.auto_approved_count,
        auto_denied: results.auto_denied_count,
        requires_review: results.requires_manual_review_count,
        dry_run: request.dry_run,
      });

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      logger.error('Error in processPendingRequests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Batch approve PTO requests
   */
  async batchApprove(request: BatchApprovePTORequest): Promise<VETAPIResponse<BatchApprovePTOResponse>> {
    try {
      const results: BatchApprovePTOResponse = {
        total: request.request_ids.length,
        approved: 0,
        failed: 0,
        results: [],
      };

      for (const requestId of request.request_ids) {
        try {
          const result = await laborActionsService.reviewPTORequest({
            request_id: requestId,
            action: 'approve',
            reviewed_by: request.approved_by,
            approval_notes: request.approval_notes,
          });

          if (result.success) {
            results.approved++;
            results.results.push({
              request_id: requestId,
              success: true,
            });
          } else {
            results.failed++;
            results.results.push({
              request_id: requestId,
              success: false,
              error: result.error,
            });
          }
        } catch (error) {
          results.failed++;
          results.results.push({
            request_id: requestId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info(`Batch approved ${results.approved}/${results.total} PTO requests`, {
        approved_by: request.approved_by,
      });

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      logger.error('Error in batchApprove:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Batch deny PTO requests
   */
  async batchDeny(request: BatchDenyPTORequest): Promise<VETAPIResponse<BatchDenyPTOResponse>> {
    try {
      const results: BatchDenyPTOResponse = {
        total: request.request_ids.length,
        denied: 0,
        failed: 0,
        results: [],
      };

      for (const requestId of request.request_ids) {
        try {
          const result = await laborActionsService.reviewPTORequest({
            request_id: requestId,
            action: 'deny',
            reviewed_by: request.denied_by,
            approval_notes: request.denial_reason,
          });

          if (result.success) {
            results.denied++;
            results.results.push({
              request_id: requestId,
              success: true,
            });
          } else {
            results.failed++;
            results.results.push({
              request_id: requestId,
              success: false,
              error: result.error,
            });
          }
        } catch (error) {
          results.failed++;
          results.results.push({
            request_id: requestId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logger.info(`Batch denied ${results.denied}/${results.total} PTO requests`, {
        denied_by: request.denied_by,
      });

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      logger.error('Error in batchDeny:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check auto-approval eligibility
   */
  async checkAutoApprovalEligibility(
    request: CheckAutoApprovalRequest
  ): Promise<CheckAutoApprovalResponse> {
    try {
      const reasons: string[] = [];
      let eligible = false;
      let matchedRule: PTOAutoApprovalRule | undefined;
      let requiresDocumentation = false;

      // Get approval rules for this organization/department
      const rules = await this.getApprovalRules(request.organization_id, request.department_id);

      // Sort by priority (higher priority first)
      rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // Check each rule
      for (const rule of rules) {
        if (!rule.enabled) continue;

        // Check if rule applies to this PTO type
        if (!rule.pto_types.includes(request.pto_type)) continue;

        let ruleMatches = true;
        const ruleReasons: string[] = [];

        // Check max days
        if (rule.max_days !== undefined && rule.max_days !== null) {
          if (request.total_days > rule.max_days) {
            ruleMatches = false;
            ruleReasons.push(`Request exceeds max days (${request.total_days} > ${rule.max_days})`);
          } else {
            ruleReasons.push(`Within max days limit (${rule.max_days})`);
          }
        }

        // Check max consecutive days
        if (rule.max_consecutive_days !== undefined && rule.max_consecutive_days !== null) {
          const consecutiveDays = this.calculateConsecutiveDays(request.start_date, request.end_date);
          if (consecutiveDays > rule.max_consecutive_days) {
            ruleMatches = false;
            ruleReasons.push(
              `Exceeds max consecutive days (${consecutiveDays} > ${rule.max_consecutive_days})`
            );
          } else {
            ruleReasons.push(`Within consecutive days limit (${rule.max_consecutive_days})`);
          }
        }

        // Check minimum notice
        if (rule.min_notice_days !== undefined && rule.min_notice_days !== null) {
          const daysUntilStart = this.calculateDaysUntil(request.start_date);
          if (daysUntilStart < rule.min_notice_days) {
            ruleMatches = false;
            ruleReasons.push(
              `Insufficient notice (${daysUntilStart} days < ${rule.min_notice_days} required)`
            );
          } else {
            ruleReasons.push(`Sufficient notice provided (${rule.min_notice_days}+ days)`);
          }
        }

        // Check auto-approve sick leave
        if (rule.auto_approve_sick && request.pto_type === 'sick') {
          ruleReasons.push('Sick leave auto-approve enabled');
          ruleMatches = true;
        }

        // Check blackout dates
        if (rule.blackout_dates && rule.blackout_dates.length > 0) {
          const overlapsBlackout = this.checkBlackoutDates(
            request.start_date,
            request.end_date,
            rule.blackout_dates
          );
          if (overlapsBlackout) {
            ruleMatches = false;
            ruleReasons.push('Overlaps with blackout dates');
          }
        }

        // Check max team members out
        if (rule.max_team_members_out !== undefined && rule.max_team_members_out !== null) {
          const teamMembersOut = await this.countTeamMembersOut(
            request.organization_id,
            request.department_id,
            request.start_date,
            request.end_date,
            request.employee_id
          );
          if (teamMembersOut >= rule.max_team_members_out) {
            ruleMatches = false;
            ruleReasons.push(
              `Too many team members out (${teamMembersOut} >= ${rule.max_team_members_out})`
            );
          }
        }

        // Check documentation requirement
        if (rule.requires_documentation) {
          requiresDocumentation = true;
          ruleReasons.push('Documentation required');
        }

        if (ruleMatches) {
          eligible = true;
          matchedRule = rule;
          reasons.push(...ruleReasons);
          break; // Stop at first matching rule
        }
      }

      if (!eligible && reasons.length === 0) {
        reasons.push('No auto-approval rules matched');
      }

      // Estimate approval time
      let estimatedApprovalTime = 'manual';
      if (eligible) {
        estimatedApprovalTime = 'immediate';
      } else if (request.pto_type === 'sick') {
        estimatedApprovalTime = '24h';
      } else {
        estimatedApprovalTime = '48h';
      }

      return {
        eligible,
        rule_matched: matchedRule,
        reasons,
        requires_documentation: requiresDocumentation,
        estimated_approval_time: estimatedApprovalTime,
      };
    } catch (error) {
      logger.error('Error checking auto-approval eligibility:', error);
      return {
        eligible: false,
        reasons: ['Error checking eligibility'],
        requires_documentation: false,
      };
    }
  }

  /**
   * Get pending approvals for a manager
   */
  async getPendingApprovals(
    request: GetPendingApprovalsRequest
  ): Promise<VETAPIResponse<PendingApprovalSummary>> {
    try {
      // Get pending requests
      let query = supabase
        .from('pto_requests')
        .select('*')
        .eq('organization_id', request.organization_id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }

      const { data: requests, error } = await query;

      if (error) {
        logger.error('Error fetching pending approvals:', error);
        return {
          success: false,
          error: `Failed to fetch pending approvals: ${error.message}`,
        };
      }

      const summary: PendingApprovalSummary = {
        total_pending: requests?.length || 0,
        by_priority: {
          urgent: 0,
          normal: 0,
          future: 0,
        },
        by_type: {
          vacation: 0,
          sick: 0,
          personal: 0,
          bereavement: 0,
          jury_duty: 0,
          military: 0,
          other: 0,
        },
        oldest_request_age_hours: 0,
        requests: [],
      };

      if (!requests || requests.length === 0) {
        return {
          success: true,
          data: summary,
        };
      }

      // Calculate oldest request age
      const now = new Date();
      const oldestRequest = requests[0];
      const oldestRequestTime = new Date(oldestRequest.requested_at);
      summary.oldest_request_age_hours =
        (now.getTime() - oldestRequestTime.getTime()) / (1000 * 60 * 60);

      // Process each request
      for (const request of requests) {
        const daysUntilStart = this.calculateDaysUntil(request.start_date);

        // Determine priority
        let priority: 'urgent' | 'normal' | 'future';
        if (daysUntilStart < 7) {
          priority = 'urgent';
          summary.by_priority.urgent++;
        } else if (daysUntilStart < 14) {
          priority = 'normal';
          summary.by_priority.normal++;
        } else {
          priority = 'future';
          summary.by_priority.future++;
        }

        // Count by type
        summary.by_type[request.pto_type as keyof typeof summary.by_type]++;

        // Check for conflicts
        const availabilityCheck = await laborActionsService.checkPTOAvailability({
          organization_id: request.organization_id,
          employee_id: request.employee_id,
          department_id: request.department_id,
          start_date: request.start_date,
          end_date: request.end_date,
          exclude_request_id: request.id,
        });

        summary.requests.push({
          id: request.id,
          employee_id: request.employee_id,
          pto_type: request.pto_type,
          start_date: request.start_date,
          end_date: request.end_date,
          total_days: request.total_days,
          requested_at: request.requested_at,
          priority,
          has_conflicts: !availabilityCheck.available,
        });
      }

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      logger.error('Error in getPendingApprovals:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Delegate approval authority
   */
  async delegateApproval(
    request: DelegateApprovalRequest
  ): Promise<VETAPIResponse<PTOApprovalDelegation>> {
    try {
      const now = new Date().toISOString();

      const delegationData = {
        organization_id: request.organization_id,
        delegator_id: request.delegator_id,
        delegate_id: request.delegate_id,
        start_date: request.start_date,
        end_date: request.end_date,
        department_ids: request.department_ids,
        active: true,
        reason: request.reason,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('pto_approval_delegations')
        .insert(delegationData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating approval delegation:', error);
        return {
          success: false,
          error: `Failed to create delegation: ${error.message}`,
        };
      }

      logger.info(`Approval authority delegated from ${request.delegator_id} to ${request.delegate_id}`);

      return {
        success: true,
        data: data as PTOApprovalDelegation,
      };
    } catch (error) {
      logger.error('Error in delegateApproval:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create auto-approval rule
   */
  async createApprovalRule(
    request: CreateApprovalRuleRequest
  ): Promise<VETAPIResponse<PTOAutoApprovalRule>> {
    try {
      const now = new Date().toISOString();

      const ruleData = {
        organization_id: request.organization_id,
        department_id: request.department_id,
        rule_name: request.rule_name,
        pto_types: request.pto_types,
        max_days: request.max_days,
        max_consecutive_days: request.max_consecutive_days,
        min_notice_days: request.min_notice_days,
        auto_approve_sick: request.auto_approve_sick || false,
        requires_documentation: request.requires_documentation || false,
        blackout_dates: request.blackout_dates || [],
        max_team_members_out: request.max_team_members_out,
        enabled: true,
        priority: request.priority || 0,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('pto_auto_approval_rules')
        .insert(ruleData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating approval rule:', error);
        return {
          success: false,
          error: `Failed to create rule: ${error.message}`,
        };
      }

      logger.info(`Created approval rule: ${request.rule_name}`);

      return {
        success: true,
        data: data as PTOAutoApprovalRule,
      };
    } catch (error) {
      logger.error('Error in createApprovalRule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update approval rule
   */
  async updateApprovalRule(
    request: UpdateApprovalRuleRequest
  ): Promise<VETAPIResponse<PTOAutoApprovalRule>> {
    try {
      const now = new Date().toISOString();

      const updates: any = {
        updated_at: now,
      };

      // Add fields if provided
      if (request.rule_name !== undefined) updates.rule_name = request.rule_name;
      if (request.pto_types !== undefined) updates.pto_types = request.pto_types;
      if (request.max_days !== undefined) updates.max_days = request.max_days;
      if (request.max_consecutive_days !== undefined)
        updates.max_consecutive_days = request.max_consecutive_days;
      if (request.min_notice_days !== undefined) updates.min_notice_days = request.min_notice_days;
      if (request.auto_approve_sick !== undefined) updates.auto_approve_sick = request.auto_approve_sick;
      if (request.requires_documentation !== undefined)
        updates.requires_documentation = request.requires_documentation;
      if (request.blackout_dates !== undefined) updates.blackout_dates = request.blackout_dates;
      if (request.max_team_members_out !== undefined)
        updates.max_team_members_out = request.max_team_members_out;
      if (request.enabled !== undefined) updates.enabled = request.enabled;
      if (request.priority !== undefined) updates.priority = request.priority;

      const { data, error } = await supabase
        .from('pto_auto_approval_rules')
        .update(updates)
        .eq('id', request.rule_id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating approval rule:', error);
        return {
          success: false,
          error: `Failed to update rule: ${error.message}`,
        };
      }

      logger.info(`Updated approval rule: ${request.rule_id}`);

      return {
        success: true,
        data: data as PTOAutoApprovalRule,
      };
    } catch (error) {
      logger.error('Error in updateApprovalRule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get approval analytics
   */
  async getApprovalAnalytics(
    request: PTOApprovalAnalyticsRequest
  ): Promise<VETAPIResponse<PTOApprovalAnalyticsResponse>> {
    try {
      let query = supabase
        .from('pto_requests')
        .select('*')
        .eq('organization_id', request.organization_id)
        .gte('requested_at', request.start_date)
        .lte('requested_at', request.end_date);

      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }

      const { data: requests, error } = await query;

      if (error) {
        logger.error('Error fetching approval analytics:', error);
        return {
          success: false,
          error: `Failed to fetch analytics: ${error.message}`,
        };
      }

      const analytics: PTOApprovalAnalyticsResponse = {
        total_requests: requests?.length || 0,
        auto_approved: 0,
        manually_approved: 0,
        denied: 0,
        pending: 0,
        auto_approval_rate: 0,
        average_approval_time_hours: 0,
        by_approver: [],
        by_rule: [],
      };

      if (!requests || requests.length === 0) {
        return {
          success: true,
          data: analytics,
        };
      }

      // Count statuses and calculate metrics
      let totalApprovalTime = 0;
      let approvedCount = 0;

      for (const req of requests) {
        if (req.status === 'approved') {
          if (req.reviewed_by === 'system') {
            analytics.auto_approved++;
          } else {
            analytics.manually_approved++;
          }
          approvedCount++;

          if (req.reviewed_at) {
            const requestedAt = new Date(req.requested_at).getTime();
            const reviewedAt = new Date(req.reviewed_at).getTime();
            totalApprovalTime += reviewedAt - requestedAt;
          }
        } else if (req.status === 'denied') {
          analytics.denied++;
        } else if (req.status === 'pending') {
          analytics.pending++;
        }
      }

      analytics.auto_approval_rate =
        analytics.total_requests > 0
          ? Math.round((analytics.auto_approved / analytics.total_requests) * 10000) / 100
          : 0;

      analytics.average_approval_time_hours =
        approvedCount > 0
          ? Math.round((totalApprovalTime / approvedCount / (1000 * 60 * 60)) * 100) / 100
          : 0;

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      logger.error('Error in getApprovalAnalytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  /**
   * Get approval rules for organization/department
   */
  private async getApprovalRules(
    organizationId: string,
    departmentId?: string
  ): Promise<PTOAutoApprovalRule[]> {
    try {
      let query = supabase
        .from('pto_auto_approval_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('enabled', true);

      // Get both org-level and dept-level rules
      if (departmentId) {
        query = query.or(`department_id.is.null,department_id.eq.${departmentId}`);
      } else {
        query = query.is('department_id', null);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching approval rules:', error);
        return [];
      }

      return (data as PTOAutoApprovalRule[]) || [];
    } catch (error) {
      logger.error('Error in getApprovalRules:', error);
      return [];
    }
  }

  /**
   * Check if request should be auto-denied
   */
  private async shouldAutoDeny(
    ptoRequest: PTORequest
  ): Promise<{ deny: boolean; reason: string }> {
    // Auto-deny if balance is insufficient (redundant check)
    const balanceCheck = await laborActionsService.checkPTOAvailability({
      organization_id: ptoRequest.organization_id,
      employee_id: ptoRequest.employee_id,
      department_id: ptoRequest.department_id,
      start_date: ptoRequest.start_date,
      end_date: ptoRequest.end_date,
      exclude_request_id: ptoRequest.id,
    });

    if (!balanceCheck.available) {
      const hasBlockingConflict = balanceCheck.conflicts?.some(
        (c) => c.severity === 'blocking'
      );
      if (hasBlockingConflict) {
        return {
          deny: true,
          reason: balanceCheck.conflicts
            ?.filter((c) => c.severity === 'blocking')
            .map((c) => c.message)
            .join('; ') || 'Blocking conflicts detected',
        };
      }
    }

    return { deny: false, reason: '' };
  }

  /**
   * Calculate consecutive days between dates
   */
  private calculateConsecutiveDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Calculate days until start date
   */
  private calculateDaysUntil(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if dates overlap with blackout dates
   */
  private checkBlackoutDates(
    startDate: string,
    endDate: string,
    blackoutDates: string[]
  ): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const blackout of blackoutDates) {
      const blackoutDate = new Date(blackout);
      if (blackoutDate >= start && blackoutDate <= end) {
        return true;
      }
    }

    return false;
  }

  /**
   * Count how many team members are out during the period
   */
  private async countTeamMembersOut(
    organizationId: string,
    departmentId: string,
    startDate: string,
    endDate: string,
    excludeEmployeeId?: string
  ): Promise<number> {
    try {
      let query = supabase
        .from('pto_requests')
        .select('employee_id')
        .eq('organization_id', organizationId)
        .eq('department_id', departmentId)
        .in('status', ['approved', 'pending'])
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

      if (excludeEmployeeId) {
        query = query.neq('employee_id', excludeEmployeeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error counting team members out:', error);
        return 0;
      }

      // Count unique employees
      const uniqueEmployees = new Set(data?.map((r) => r.employee_id) || []);
      return uniqueEmployees.size;
    } catch (error) {
      logger.error('Error in countTeamMembersOut:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const ptoApprovalWorkflowService = new PTOApprovalWorkflowService();
