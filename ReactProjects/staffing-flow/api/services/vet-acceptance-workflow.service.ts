/**
 * VET Acceptance Workflow Service
 * Automated processing engine for VET responses with priority-based acceptance
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { laborActionsService } from './labor-actions.service';
import {
  DEFAULT_WORKFLOW_CONFIG,
  DEFAULT_PRIORITY_WEIGHTS,
} from '../types/laborActionsWorkflow';
import type {
  WorkflowConfig,
  PriorityScoreFactors,
  PriorityWeights,
  ProcessResponsesRequest,
  WorkflowExecutionResult,
  ResponseProcessingResult,
  AutoApprovalEvaluation,
  WaitlistProcessingResult,
  WorkflowNotification,
  WorkflowNotificationType,
  BatchApproveRequest,
  BatchRejectRequest,
  BatchOperationResult,
  WorkflowStatusResponse,
  WorkflowAPIResponse,
} from '../types/laborActionsWorkflow';
import type { LaborAction } from '../types/laborActions';

export class VETAcceptanceWorkflowService {
  /**
   * Process all pending responses for a VET offer using configured workflow
   */
  async processResponses(request: ProcessResponsesRequest): Promise<WorkflowAPIResponse<WorkflowExecutionResult>> {
    const startTime = Date.now();
    
    try {
      // Merge with default config
      const config: WorkflowConfig = {
        ...DEFAULT_WORKFLOW_CONFIG,
        ...request.workflow_config,
      };

      const weights: PriorityWeights = {
        ...DEFAULT_PRIORITY_WEIGHTS,
        ...request.priority_weights,
      };

      // Fetch VET offer details
      const offerResult = await laborActionsService.getVETDetails(request.labor_action_id);
      if (!offerResult.success || !offerResult.data) {
        return {
          success: false,
          error: 'VET offer not found',
        };
      }

      const offer = offerResult.data;

      // Check if offer is open
      if (offer.status !== 'open') {
        return {
          success: false,
          error: `Cannot process responses for ${offer.status} offer`,
        };
      }

      // Get all pending responses
      const { data: responses, error: responsesError } = await supabase
        .from('labor_action_responses')
        .select(`
          *,
          employee:employees(
            id,
            first_name,
            last_name,
            employee_number,
            hire_date,
            department_id
          )
        `)
        .eq('labor_action_id', request.labor_action_id)
        .eq('response_status', 'pending');

      if (responsesError) {
        logger.error('Error fetching responses:', responsesError);
        return {
          success: false,
          error: 'Failed to fetch responses',
        };
      }

      const pendingResponses = responses || [];
      
      if (pendingResponses.length === 0) {
        return {
          success: true,
          data: {
            success: true,
            labor_action_id: request.labor_action_id,
            total_responses: 0,
            processed_count: 0,
            approved_count: 0,
            waitlisted_count: 0,
            rejected_count: 0,
            no_action_count: 0,
            positions_filled: offer.positions_filled,
            positions_available: offer.positions_available,
            offer_closed: false,
            processing_details: [],
            notifications_sent: 0,
            execution_time_ms: Date.now() - startTime,
          },
        };
      }

      // Calculate priority scores for each response
      const scoredResponses = await Promise.all(
        pendingResponses.map(async (response) => {
          const score = await this.calculatePriorityScore(
            response,
            offer,
            weights
          );
          return { ...response, calculated_score: score };
        })
      );

      // Sort by priority score (highest first) and response time
      scoredResponses.sort((a, b) => {
        if (b.calculated_score !== a.calculated_score) {
          return b.calculated_score - a.calculated_score;
        }
        return new Date(a.response_time).getTime() - new Date(b.response_time).getTime();
      });

      // Process each response based on priority order
      const processingResults: ResponseProcessingResult[] = [];
      let approvedCount = 0;
      let waitlistedCount = 0;
      let rejectedCount = 0;
      let noActionCount = 0;
      const errors: string[] = [];

      const availablePositions = offer.positions_available - offer.positions_filled;

      for (let i = 0; i < scoredResponses.length; i++) {
        const response = scoredResponses[i];
        const currentPosition = approvedCount;

        try {
          let actionTaken: ResponseProcessingResult['action_taken'];
          let newStatus: 'accepted' | 'waitlisted' | 'declined' | 'pending';
          let reason: string;

          if (currentPosition < availablePositions) {
            // Position available - approve if auto-approve enabled
            if (config.auto_approve_enabled) {
              const autoApproval = this.evaluateAutoApproval(response, response.calculated_score);
              
              if (autoApproval.eligible) {
                newStatus = 'accepted';
                actionTaken = 'approved';
                reason = `Auto-approved: ${autoApproval.reasons.join(', ')}`;
                approvedCount++;
              } else {
                newStatus = 'pending';
                actionTaken = 'no_action';
                reason = `Manual approval required: ${autoApproval.reasons.join(', ')}`;
                noActionCount++;
              }
            } else {
              newStatus = 'pending';
              actionTaken = 'no_action';
              reason = 'Manual approval required (auto-approve disabled)';
              noActionCount++;
            }
          } else {
            // No positions available - waitlist or reject
            if (config.auto_waitlist_enabled) {
              const maxWaitlist = config.max_waitlist_size || 20;
              if (waitlistedCount < maxWaitlist) {
                newStatus = 'waitlisted';
                actionTaken = 'waitlisted';
                reason = `Added to waitlist (position ${waitlistedCount + 1})`;
                waitlistedCount++;
              } else {
                newStatus = 'declined';
                actionTaken = 'rejected';
                reason = 'Waitlist full';
                rejectedCount++;
              }
            } else {
              newStatus = 'pending';
              actionTaken = 'no_action';
              reason = 'All positions filled - pending manual review';
              noActionCount++;
            }
          }

          // Update response status
          if (actionTaken !== 'no_action') {
            const { error: updateError } = await supabase
              .from('labor_action_responses')
              .update({
                response_status: newStatus,
                priority_score: response.calculated_score,
                approved_by: actionTaken === 'approved' ? request.processed_by : null,
                approved_at: actionTaken === 'approved' ? new Date().toISOString() : null,
                notes: reason,
                updated_at: new Date().toISOString(),
              })
              .eq('id', response.id);

            if (updateError) {
              logger.error(`Error updating response ${response.id}:`, updateError);
              errors.push(`Failed to update response ${response.id}`);
            }
          }

          processingResults.push({
            response_id: response.id,
            employee_id: response.employee_id,
            employee_name: response.employee
              ? `${response.employee.first_name} ${response.employee.last_name}`
              : undefined,
            original_status: 'pending',
            new_status: newStatus,
            priority_score: response.calculated_score,
            action_taken: actionTaken,
            reason,
          });

          // Send notification if configured
          if (config.send_notifications && actionTaken !== 'no_action') {
            await this.sendWorkflowNotification({
              type: this.getNotificationType(actionTaken),
              recipient_id: response.employee_id,
              labor_action_id: request.labor_action_id,
              response_id: response.id,
              subject: this.getNotificationSubject(actionTaken, offer),
              message: this.getNotificationMessage(actionTaken, offer, reason),
              priority: actionTaken === 'approved' ? 'high' : 'normal',
              channels: ['email', 'push', 'in_app'],
            });
          }
        } catch (error) {
          logger.error(`Error processing response ${response.id}:`, error);
          errors.push(`Error processing response ${response.id}: ${error}`);
          noActionCount++;
        }
      }

      // Update positions filled count
      await this.updateOfferPositionsFilled(request.labor_action_id);

      // Auto-close if configured and filled
      let offerClosed = false;
      if (config.auto_close_when_filled && approvedCount >= availablePositions) {
        await laborActionsService.closeVET(request.labor_action_id, request.processed_by);
        offerClosed = true;
      }

      const executionTime = Date.now() - startTime;

      const result: WorkflowExecutionResult = {
        success: true,
        labor_action_id: request.labor_action_id,
        total_responses: pendingResponses.length,
        processed_count: processingResults.length,
        approved_count: approvedCount,
        waitlisted_count: waitlistedCount,
        rejected_count: rejectedCount,
        no_action_count: noActionCount,
        positions_filled: offer.positions_filled + approvedCount,
        positions_available: offer.positions_available,
        offer_closed: offerClosed,
        processing_details: processingResults,
        notifications_sent: approvedCount + waitlistedCount + rejectedCount,
        execution_time_ms: executionTime,
        errors: errors.length > 0 ? errors : undefined,
      };

      logger.info(`Workflow completed for ${request.labor_action_id}: ${approvedCount} approved, ${waitlistedCount} waitlisted`);

      return {
        success: true,
        data: result,
        message: 'Workflow executed successfully',
      };
    } catch (error) {
      logger.error('Exception in processResponses:', error);
      return {
        success: false,
        error: 'Workflow execution failed',
      };
    }
  }

  /**
   * Calculate priority score for an employee response
   */
  private async calculatePriorityScore(
    response: any,
    offer: LaborAction,
    weights: PriorityWeights
  ): Promise<number> {
    try {
      const employee = response.employee;
      if (!employee) return 0;

      const factors = await this.gatherPriorityFactors(response, employee, offer);
      
      // Calculate weighted score (0-100)
      const scores = {
        seniority: this.scoreSeniority(factors.seniority_years || 0),
        performance: factors.performance_rating || 50,
        attendance: factors.attendance_rate || 100,
        history: this.scoreVETHistory(factors.vet_acceptance_history || 0),
        recency: this.scoreRecency(factors.last_vet_date),
        speed: this.scoreResponseSpeed(factors.response_speed_minutes || 0),
        skills: factors.skills_match || 100,
      };

      const weightedScore =
        scores.seniority * weights.seniority +
        scores.performance * weights.performance +
        scores.attendance * weights.attendance +
        scores.history * weights.history +
        scores.recency * weights.recency +
        scores.speed * weights.speed +
        scores.skills * weights.skills;

      return Math.round(weightedScore * 100) / 100;
    } catch (error) {
      logger.error('Error calculating priority score:', error);
      return 0;
    }
  }

  /**
   * Gather factors for priority scoring
   */
  private async gatherPriorityFactors(
    response: any,
    employee: any,
    offer: LaborAction
  ): Promise<PriorityScoreFactors> {
    const hireDate = new Date(employee.hire_date);
    const now = new Date();
    const seniorityYears = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    // Calculate response speed
    const postedTime = new Date(offer.posted_at).getTime();
    const responseTime = new Date(response.response_time).getTime();
    const responseMinutes = (responseTime - postedTime) / (1000 * 60);

    // Fetch VET history (simplified - would query actual history)
    const vetHistory = 0; // TODO: Query actual VET acceptance history

    return {
      seniority_years: seniorityYears,
      performance_rating: 85, // TODO: Fetch actual performance data
      attendance_rate: 95, // TODO: Fetch actual attendance data
      vet_acceptance_history: vetHistory,
      last_vet_date: undefined, // TODO: Fetch last VET date
      response_speed_minutes: responseMinutes,
      skills_match: 100, // TODO: Calculate skills match
      availability_conflicts: 0, // TODO: Check for conflicts
    };
  }

  /**
   * Score seniority (0-100)
   */
  private scoreSeniority(years: number): number {
    // 0 years = 0, 10+ years = 100, linear scale
    return Math.min(100, (years / 10) * 100);
  }

  /**
   * Score VET history (0-100)
   */
  private scoreVETHistory(acceptanceCount: number): number {
    // More accepted VETs = higher score
    // Cap at 20 VETs = 100 score
    return Math.min(100, (acceptanceCount / 20) * 100);
  }

  /**
   * Score recency (0-100)
   */
  private scoreRecency(lastVETDate?: string): number {
    if (!lastVETDate) return 100; // Never worked VET = highest priority

    const daysSince = (Date.now() - new Date(lastVETDate).getTime()) / (1000 * 60 * 60 * 24);
    
    // Recent VET = lower score (give others a chance)
    // < 7 days = 0, > 30 days = 100
    if (daysSince < 7) return 0;
    if (daysSince > 30) return 100;
    return ((daysSince - 7) / 23) * 100;
  }

  /**
   * Score response speed (0-100)
   */
  private scoreResponseSpeed(minutes: number): number {
    // Faster response = higher score
    // < 5 min = 100, > 60 min = 0, linear decay
    if (minutes < 5) return 100;
    if (minutes > 60) return 0;
    return 100 - ((minutes - 5) / 55) * 100;
  }

  /**
   * Evaluate if response qualifies for auto-approval
   */
  private evaluateAutoApproval(_response: any, priorityScore: number): AutoApprovalEvaluation {
    // Simple auto-approval logic - can be enhanced with custom rules
    const minScore = 60; // Minimum score for auto-approval
    
    if (priorityScore >= minScore) {
      return {
        eligible: true,
        conditions_passed: 1,
        conditions_failed: 0,
        reasons: [`Priority score ${priorityScore.toFixed(1)} meets threshold`],
      };
    }

    return {
      eligible: false,
      conditions_passed: 0,
      conditions_failed: 1,
      reasons: [`Priority score ${priorityScore.toFixed(1)} below threshold (${minScore})`],
    };
  }

  /**
   * Batch approve multiple responses
   */
  async batchApprove(request: BatchApproveRequest): Promise<WorkflowAPIResponse<BatchOperationResult>> {
    try {
      const results: BatchOperationResult['results'] = [];
      let successCount = 0;
      let failCount = 0;

      for (const responseId of request.response_ids) {
        try {
          const { error } = await supabase
            .from('labor_action_responses')
            .update({
              response_status: 'accepted',
              approved_by: request.approved_by,
              approved_at: new Date().toISOString(),
              notes: request.notes || 'Batch approved',
              updated_at: new Date().toISOString(),
            })
            .eq('id', responseId)
            .eq('labor_action_id', request.labor_action_id);

          if (error) {
            results.push({ response_id: responseId, success: false, error: error.message });
            failCount++;
          } else {
            results.push({ response_id: responseId, success: true });
            successCount++;
          }
        } catch (error) {
          results.push({ response_id: responseId, success: false, error: String(error) });
          failCount++;
        }
      }

      // Update positions filled
      await this.updateOfferPositionsFilled(request.labor_action_id);

      return {
        success: true,
        data: {
          success: true,
          total_requested: request.response_ids.length,
          successful_count: successCount,
          failed_count: failCount,
          results,
        },
      };
    } catch (error) {
      logger.error('Exception in batchApprove:', error);
      return {
        success: false,
        error: 'Batch approval failed',
      };
    }
  }

  /**
   * Batch reject multiple responses
   */
  async batchReject(request: BatchRejectRequest): Promise<WorkflowAPIResponse<BatchOperationResult>> {
    try {
      const results: BatchOperationResult['results'] = [];
      let successCount = 0;
      let failCount = 0;

      for (const responseId of request.response_ids) {
        try {
          const { error } = await supabase
            .from('labor_action_responses')
            .update({
              response_status: 'declined',
              notes: request.reason,
              updated_at: new Date().toISOString(),
            })
            .eq('id', responseId)
            .eq('labor_action_id', request.labor_action_id);

          if (error) {
            results.push({ response_id: responseId, success: false, error: error.message });
            failCount++;
          } else {
            results.push({ response_id: responseId, success: true });
            successCount++;
          }
        } catch (error) {
          results.push({ response_id: responseId, success: false, error: String(error) });
          failCount++;
        }
      }

      return {
        success: true,
        data: {
          success: true,
          total_requested: request.response_ids.length,
          successful_count: successCount,
          failed_count: failCount,
          results,
        },
      };
    } catch (error) {
      logger.error('Exception in batchReject:', error);
      return {
        success: false,
        error: 'Batch rejection failed',
      };
    }
  }

  /**
   * Get workflow status for a VET offer
   */
  async getWorkflowStatus(laborActionId: string): Promise<WorkflowAPIResponse<WorkflowStatusResponse>> {
    try {
      const offerResult = await laborActionsService.getVETDetails(laborActionId);
      if (!offerResult.success || !offerResult.data) {
        return {
          success: false,
          error: 'VET offer not found',
        };
      }

      const offer = offerResult.data;

      const status: WorkflowStatusResponse = {
        labor_action_id: laborActionId,
        offer_status: offer.status,
        positions_available: offer.positions_available,
        positions_filled: offer.positions_filled,
        pending_responses: offer.pending_count,
        approved_responses: offer.accepted_count,
        waitlisted_responses: offer.waitlisted_count,
        workflow_enabled: true,
        last_processed_at: undefined, // TODO: Track workflow executions
        next_processing_scheduled: undefined,
      };

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      logger.error('Exception in getWorkflowStatus:', error);
      return {
        success: false,
        error: 'Failed to get workflow status',
      };
    }
  }

  /**
   * Process waitlist promotions when positions become available
   */
  async processWaitlist(laborActionId: string, positionsAvailable: number): Promise<WaitlistProcessingResult> {
    try {
      // Get waitlisted responses sorted by priority
      const { data: waitlisted } = await supabase
        .from('labor_action_responses')
        .select(`
          *,
          employee:employees(first_name, last_name)
        `)
        .eq('labor_action_id', laborActionId)
        .eq('response_status', 'waitlisted')
        .order('priority_score', { ascending: false })
        .order('response_time', { ascending: true })
        .limit(positionsAvailable);

      if (!waitlisted || waitlisted.length === 0) {
        return {
          promoted_count: 0,
          promoted_employees: [],
          remaining_waitlist: 0,
        };
      }

      const promotedEmployees = [];

      for (let i = 0; i < waitlisted.length && i < positionsAvailable; i++) {
        const response = waitlisted[i];
        
        await supabase
          .from('labor_action_responses')
          .update({
            response_status: 'accepted',
            approved_at: new Date().toISOString(),
            notes: 'Promoted from waitlist',
            updated_at: new Date().toISOString(),
          })
          .eq('id', response.id);

        promotedEmployees.push({
          employee_id: response.employee_id,
          employee_name: response.employee
            ? `${response.employee.first_name} ${response.employee.last_name}`
            : undefined,
          from_position: i + 1,
        });
      }

      // Count remaining waitlist
      const { count } = await supabase
        .from('labor_action_responses')
        .select('*', { count: 'exact', head: true })
        .eq('labor_action_id', laborActionId)
        .eq('response_status', 'waitlisted');

      return {
        promoted_count: promotedEmployees.length,
        promoted_employees: promotedEmployees,
        remaining_waitlist: (count || 0) - promotedEmployees.length,
      };
    } catch (error) {
      logger.error('Exception in processWaitlist:', error);
      return {
        promoted_count: 0,
        promoted_employees: [],
        remaining_waitlist: 0,
      };
    }
  }

  /**
   * Update offer positions_filled count
   */
  private async updateOfferPositionsFilled(laborActionId: string): Promise<void> {
    try {
      const { count } = await supabase
        .from('labor_action_responses')
        .select('*', { count: 'exact', head: true })
        .eq('labor_action_id', laborActionId)
        .eq('response_status', 'accepted');

      await supabase
        .from('labor_actions')
        .update({ positions_filled: count || 0 })
        .eq('id', laborActionId);
    } catch (error) {
      logger.error('Error updating positions_filled:', error);
    }
  }

  /**
   * Send workflow notification
   */
  private async sendWorkflowNotification(notification: WorkflowNotification): Promise<void> {
    // TODO: Integrate with notification service
    logger.info(`Workflow notification: ${notification.type} to ${notification.recipient_id}`);
  }

  /**
   * Get notification type based on action
   */
  private getNotificationType(action: string): WorkflowNotificationType {
    switch (action) {
      case 'approved':
        return 'response_approved';
      case 'waitlisted':
        return 'added_to_waitlist';
      case 'rejected':
        return 'response_rejected';
      default:
        return 'response_received';
    }
  }

  /**
   * Get notification subject
   */
  private getNotificationSubject(action: string, offer: any): string {
    const date = new Date(offer.target_date).toLocaleDateString();
    switch (action) {
      case 'approved':
        return `VET Approved for ${date}`;
      case 'waitlisted':
        return `Added to VET Waitlist for ${date}`;
      case 'rejected':
        return `VET Response Update for ${date}`;
      default:
        return `VET Update for ${date}`;
    }
  }

  /**
   * Get notification message
   */
  private getNotificationMessage(action: string, offer: any, reason: string): string {
    const date = new Date(offer.target_date).toLocaleDateString();
    const time = `${new Date(offer.start_time).toLocaleTimeString()} - ${new Date(offer.end_time).toLocaleTimeString()}`;
    
    switch (action) {
      case 'approved':
        return `Your VET request for ${date} (${time}) has been approved! ${reason}`;
      case 'waitlisted':
        return `You've been added to the waitlist for VET on ${date} (${time}). ${reason}`;
      case 'rejected':
        return `Unfortunately, the VET offer for ${date} (${time}) is no longer available. ${reason}`;
      default:
        return `Update regarding your VET request for ${date} (${time}). ${reason}`;
    }
  }
}

// Export singleton instance
export const vetAcceptanceWorkflowService = new VETAcceptanceWorkflowService();
