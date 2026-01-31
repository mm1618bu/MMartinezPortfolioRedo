/**
 * Labor Actions Service Layer
 * Business logic for VET/VTO management
 */

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type {
  LaborAction,
  LaborActionResponse,
  PublishVETRequest,
  UpdateVETRequest,
  ListVETRequest,
  VETOfferDetails,
  RespondToVETRequest,
  ApproveVETResponseRequest,
  VETAnalyticsRequest,
  VETAnalyticsResponse,
  VETEligibilityRequest,
  VETEligibilityResponse,
  VETAPIResponse,
  VETOfferListResponse,
  PublishVTORequest,
  UpdateVTORequest,
  VTOOfferDetails,
  RespondToVTORequest,
  VTOAnalyticsRequest,
  VTOAnalyticsResponse,
  SafetyFloorCheckRequest,
  SafetyFloorCheckResponse,
  SafetyFloorConfig,
  SafetyFloorViolation,
  PublishVTOWithOverrideRequest,
  SafetyFloorAuditLog,
  PTORequest,
  PTOBalance,
  RequestPTORequest,
  UpdatePTORequest,
  ReviewPTORequest,
  CancelPTORequest,
  ListPTORequestsRequest,
  CheckPTOAvailabilityRequest,
  CheckPTOAvailabilityResponse,
  GetPTOBalanceRequest,
  PTOAnalyticsRequest,
  PTOAnalyticsResponse,
  PTOConflict,
  PTOType,
} from '../types/laborActions';

export class LaborActionsService {
  /**
   * Publish a new VET offer
   */
  async publishVET(request: PublishVETRequest): Promise<VETAPIResponse<LaborAction>> {
    try {
      // Build timestamps
      const now = new Date().toISOString();
      const targetDate = request.target_date;
      
      // Combine date with time if time is provided as HH:MM:SS
      let startTime = request.start_time;
      let endTime = request.end_time;
      
      if (!request.start_time.includes('T')) {
        startTime = `${targetDate}T${request.start_time}`;
      }
      if (!request.end_time.includes('T')) {
        endTime = `${targetDate}T${request.end_time}`;
      }

      const vetOffer = {
        action_type: 'VET' as const,
        target_date: targetDate,
        shift_template_id: request.shift_template_id || null,
        start_time: startTime,
        end_time: endTime,
        department_id: request.department_id || null,
        positions_available: request.positions_available,
        positions_filled: 0,
        priority_order: request.priority_order || null,
        offer_message: request.offer_message || null,
        status: request.status || 'open',
        posted_by: request.posted_by,
        posted_at: now,
        closes_at: request.closes_at || null,
        organization_id: request.organization_id,
      };

      const { data, error } = await supabase
        .from('labor_actions')
        .insert(vetOffer)
        .select()
        .single();

      if (error) {
        logger.error('Error publishing VET offer:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info(`VET offer published: ${data.id}`);
      return {
        success: true,
        data: data as LaborAction,
        message: 'VET offer published successfully',
      };
    } catch (error) {
      logger.error('Exception in publishVET:', error);
      return {
        success: false,
        error: 'Failed to publish VET offer',
      };
    }
  }

  /**
   * Update an existing VET offer
   */
  async updateVET(vetId: string, request: UpdateVETRequest): Promise<VETAPIResponse<LaborAction>> {
    try {
      const { data, error } = await supabase
        .from('labor_actions')
        .update({
          ...request,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vetId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating VET offer:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'VET offer not found',
        };
      }

      logger.info(`VET offer updated: ${vetId}`);
      return {
        success: true,
        data: data as LaborAction,
        message: 'VET offer updated successfully',
      };
    } catch (error) {
      logger.error('Exception in updateVET:', error);
      return {
        success: false,
        error: 'Failed to update VET offer',
      };
    }
  }

  /**
   * Close a VET offer (manually)
   */
  async closeVET(vetId: string, closedBy: string): Promise<VETAPIResponse<LaborAction>> {
    try {
      const { data, error } = await supabase
        .from('labor_actions')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', vetId)
        .select()
        .single();

      if (error) {
        logger.error('Error closing VET offer:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info(`VET offer closed: ${vetId} by ${closedBy}`);
      return {
        success: true,
        data: data as LaborAction,
        message: 'VET offer closed successfully',
      };
    } catch (error) {
      logger.error('Exception in closeVET:', error);
      return {
        success: false,
        error: 'Failed to close VET offer',
      };
    }
  }

  /**
   * Cancel a VET offer
   */
  async cancelVET(vetId: string, cancelledBy: string): Promise<VETAPIResponse<LaborAction>> {
    try {
      const { data, error } = await supabase
        .from('labor_actions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', vetId)
        .select()
        .single();

      if (error) {
        logger.error('Error cancelling VET offer:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info(`VET offer cancelled: ${vetId} by ${cancelledBy}`);
      return {
        success: true,
        data: data as LaborAction,
        message: 'VET offer cancelled successfully',
      };
    } catch (error) {
      logger.error('Exception in cancelVET:', error);
      return {
        success: false,
        error: 'Failed to cancel VET offer',
      };
    }
  }

  /**
   * List VET offers with filtering
   */
  async listVETOffers(request: ListVETRequest): Promise<VETOfferListResponse> {
    try {
      const limit = request.limit || 50;
      const offset = request.offset || 0;

      let query = supabase
        .from('labor_actions')
        .select(`
          *,
          responses:labor_action_responses(count)
        `, { count: 'exact' })
        .eq('organization_id', request.organization_id)
        .eq('action_type', request.action_type || 'VET');

      // Apply filters
      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }

      if (request.status) {
        query = query.eq('status', request.status);
      }

      if (request.target_date_from) {
        query = query.gte('target_date', request.target_date_from);
      }

      if (request.target_date_to) {
        query = query.lte('target_date', request.target_date_to);
      }

      // Pagination and ordering
      query = query
        .order('target_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error listing VET offers:', error);
        return {
          success: false,
          data: [],
          pagination: {
            total: 0,
            limit,
            offset,
            has_more: false,
          },
        };
      }

      // Enrich data with response counts
      const enrichedData = await Promise.all(
        (data || []).map(async (offer) => {
          const responseCounts = await this.getResponseCounts(offer.id);
          return {
            ...offer,
            response_count: responseCounts.total,
            accepted_count: responseCounts.accepted,
            pending_count: responseCounts.pending,
            declined_count: responseCounts.declined,
            waitlisted_count: responseCounts.waitlisted,
          } as VETOfferDetails;
        })
      );

      return {
        success: true,
        data: enrichedData,
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > offset + limit,
        },
      };
    } catch (error) {
      logger.error('Exception in listVETOffers:', error);
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          limit: request.limit || 50,
          offset: request.offset || 0,
          has_more: false,
        },
      };
    }
  }

  /**
   * Get detailed VET offer information
   */
  async getVETDetails(vetId: string): Promise<VETAPIResponse<VETOfferDetails>> {
    try {
      const { data: offer, error: offerError } = await supabase
        .from('labor_actions')
        .select(`
          *,
          department:departments(name),
          shift_template:shift_templates(name),
          posted_by_user:users!posted_by(name)
        `)
        .eq('id', vetId)
        .single();

      if (offerError || !offer) {
        logger.error('Error fetching VET details:', offerError);
        return {
          success: false,
          error: 'VET offer not found',
        };
      }

      // Fetch all responses
      const { data: responses, error: responsesError } = await supabase
        .from('labor_action_responses')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_number)
        `)
        .eq('labor_action_id', vetId)
        .order('response_time', { ascending: true });

      if (responsesError) {
        logger.error('Error fetching responses:', responsesError);
      }

      // Calculate response counts
      const responseCounts = await this.getResponseCounts(vetId);

      const details: VETOfferDetails = {
        ...offer,
        posted_by_name: offer.posted_by_user?.name,
        department_name: offer.department?.name,
        shift_template_name: offer.shift_template?.name,
        response_count: responseCounts.total,
        accepted_count: responseCounts.accepted,
        pending_count: responseCounts.pending,
        declined_count: responseCounts.declined,
        waitlisted_count: responseCounts.waitlisted,
        responses: (responses || []).map((r) => ({
          ...r,
          employee_name: r.employee
            ? `${r.employee.first_name} ${r.employee.last_name}`
            : undefined,
          employee_number: r.employee?.employee_number,
        })),
      };

      return {
        success: true,
        data: details,
      };
    } catch (error) {
      logger.error('Exception in getVETDetails:', error);
      return {
        success: false,
        error: 'Failed to fetch VET details',
      };
    }
  }

  /**
   * Employee responds to VET offer
   */
  async respondToVET(request: RespondToVETRequest): Promise<VETAPIResponse<LaborActionResponse>> {
    try {
      // Check if response already exists
      const { data: existing } = await supabase
        .from('labor_action_responses')
        .select('id')
        .eq('labor_action_id', request.labor_action_id)
        .eq('employee_id', request.employee_id)
        .single();

      if (existing) {
        // Update existing response
        const { data, error } = await supabase
          .from('labor_action_responses')
          .update({
            response_status: request.response_status,
            response_time: new Date().toISOString(),
            notes: request.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          logger.error('Error updating VET response:', error);
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          data: data as LaborActionResponse,
          message: 'Response updated successfully',
        };
      }

      // Create new response
      const newResponse = {
        labor_action_id: request.labor_action_id,
        employee_id: request.employee_id,
        response_status: request.response_status,
        response_time: new Date().toISOString(),
        notes: request.notes || null,
      };

      const { data, error } = await supabase
        .from('labor_action_responses')
        .insert(newResponse)
        .select()
        .single();

      if (error) {
        logger.error('Error creating VET response:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info(`Employee ${request.employee_id} responded to VET ${request.labor_action_id}`);
      return {
        success: true,
        data: data as LaborActionResponse,
        message: 'Response submitted successfully',
      };
    } catch (error) {
      logger.error('Exception in respondToVET:', error);
      return {
        success: false,
        error: 'Failed to submit response',
      };
    }
  }

  /**
   * Manager approves/rejects employee response
   */
  async approveVETResponse(request: ApproveVETResponseRequest): Promise<VETAPIResponse<LaborActionResponse>> {
    try {
      const newStatus = request.approved ? 'accepted' : 'declined';
      
      const { data, error } = await supabase
        .from('labor_action_responses')
        .update({
          response_status: newStatus,
          approved_by: request.approved_by,
          approved_at: new Date().toISOString(),
          notes: request.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.response_id)
        .select()
        .single();

      if (error) {
        logger.error('Error approving VET response:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Update positions_filled count if approved
      if (request.approved && data) {
        await this.updatePositionsFilled(data.labor_action_id);
      }

      logger.info(`VET response ${request.response_id} ${request.approved ? 'approved' : 'rejected'}`);
      return {
        success: true,
        data: data as LaborActionResponse,
        message: `Response ${request.approved ? 'approved' : 'rejected'} successfully`,
      };
    } catch (error) {
      logger.error('Exception in approveVETResponse:', error);
      return {
        success: false,
        error: 'Failed to process approval',
      };
    }
  }

  /**
   * Get VET analytics
   */
  async getVETAnalytics(request: VETAnalyticsRequest): Promise<VETAPIResponse<VETAnalyticsResponse>> {
    try {
      // Fetch all VET offers in date range
      let query = supabase
        .from('labor_actions')
        .select(`
          *,
          responses:labor_action_responses(*)
        `)
        .eq('organization_id', request.organization_id)
        .eq('action_type', 'VET')
        .gte('target_date', request.date_from)
        .lte('target_date', request.date_to);

      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }

      const { data: offers, error } = await query;

      if (error) {
        logger.error('Error fetching VET analytics:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Calculate analytics
      const totalOffers = offers?.length || 0;
      const totalPositions = offers?.reduce((sum, o) => sum + o.positions_available, 0) || 0;
      const filledPositions = offers?.reduce((sum, o) => sum + o.positions_filled, 0) || 0;
      const fillRate = totalPositions > 0 ? (filledPositions / totalPositions) * 100 : 0;

      // Status breakdown
      const offersByStatus = {
        draft: offers?.filter((o) => o.status === 'draft').length || 0,
        open: offers?.filter((o) => o.status === 'open').length || 0,
        closed: offers?.filter((o) => o.status === 'closed').length || 0,
        cancelled: offers?.filter((o) => o.status === 'cancelled').length || 0,
      };

      // Response breakdown
      const allResponses = offers?.flatMap((o) => o.responses || []) || [];
      const responsesByStatus = {
        accepted: allResponses.filter((r) => r.response_status === 'accepted').length,
        declined: allResponses.filter((r) => r.response_status === 'declined').length,
        pending: allResponses.filter((r) => r.response_status === 'pending').length,
        waitlisted: allResponses.filter((r) => r.response_status === 'waitlisted').length,
      };

      // Average response time
      const responseTimes = allResponses
        .map((r) => {
          const offer = offers?.find((o) => o.id === r.labor_action_id);
          if (!offer) return 0;
          const posted = new Date(offer.posted_at).getTime();
          const responded = new Date(r.response_time).getTime();
          return (responded - posted) / 1000 / 60; // Minutes
        })
        .filter((t) => t > 0);

      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
          : 0;

      const analytics: VETAnalyticsResponse = {
        total_offers: totalOffers,
        total_positions: totalPositions,
        filled_positions: filledPositions,
        fill_rate: parseFloat(fillRate.toFixed(2)),
        avg_response_time_minutes: parseFloat(avgResponseTime.toFixed(2)),
        offers_by_status: offersByStatus,
        responses_by_status: responsesByStatus,
      };

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      logger.error('Exception in getVETAnalytics:', error);
      return {
        success: false,
        error: 'Failed to fetch analytics',
      };
    }
  }

  /**
   * Check employee eligibility for VET offer
   */
  async checkVETEligibility(request: VETEligibilityRequest): Promise<VETAPIResponse<VETEligibilityResponse>> {
    try {
      // Fetch employee and VET offer
      const { data: employee } = await supabase
        .from('employees')
        .select('*, skills, certifications')
        .eq('id', request.employee_id)
        .single();

      const { data: offer } = await supabase
        .from('labor_actions')
        .select('*, shift_template:shift_templates(*)')
        .eq('id', request.labor_action_id)
        .single();

      if (!employee || !offer) {
        return {
          success: false,
          error: 'Employee or VET offer not found',
        };
      }

      const reasons: string[] = [];
      const restrictions: any = {};
      let eligible = true;

      // Check if employee is active
      if (employee.status !== 'active') {
        eligible = false;
        reasons.push('Employee is not active');
      }

      // Check if VET is still open
      if (offer.status !== 'open') {
        eligible = false;
        reasons.push('VET offer is not currently open');
      }

      // Check if offer has expired
      if (offer.closes_at && new Date(offer.closes_at) < new Date()) {
        eligible = false;
        reasons.push('VET offer has expired');
      }

      // Check if positions are still available
      if (offer.positions_filled >= offer.positions_available) {
        eligible = false;
        reasons.push('All positions have been filled');
      }

      // If all checks pass
      if (eligible) {
        reasons.push('Employee meets all eligibility criteria');
      }

      const eligibility: VETEligibilityResponse = {
        eligible,
        reasons,
        restrictions: Object.keys(restrictions).length > 0 ? restrictions : undefined,
      };

      return {
        success: true,
        data: eligibility,
      };
    } catch (error) {
      logger.error('Exception in checkVETEligibility:', error);
      return {
        success: false,
        error: 'Failed to check eligibility',
      };
    }
  }

  /**
   * Helper: Get response counts for a VET offer
   */
  private async getResponseCounts(vetId: string): Promise<{
    total: number;
    accepted: number;
    pending: number;
    declined: number;
    waitlisted: number;
  }> {
    const { data } = await supabase
      .from('labor_action_responses')
      .select('response_status')
      .eq('labor_action_id', vetId);

    const responses = data || [];
    return {
      total: responses.length,
      accepted: responses.filter((r) => r.response_status === 'accepted').length,
      pending: responses.filter((r) => r.response_status === 'pending').length,
      declined: responses.filter((r) => r.response_status === 'declined').length,
      waitlisted: responses.filter((r) => r.response_status === 'waitlisted').length,
    };
  }

  /**
   * Helper: Update positions_filled count
   */
  private async updatePositionsFilled(vetId: string): Promise<void> {
    try {
      const { data: responses } = await supabase
        .from('labor_action_responses')
        .select('response_status')
        .eq('labor_action_id', vetId)
        .eq('response_status', 'accepted');

      const filledCount = responses?.length || 0;

      await supabase
        .from('labor_actions')
        .update({ positions_filled: filledCount })
        .eq('id', vetId);
    } catch (error) {
      logger.error('Error updating positions_filled:', error);
    }
  }

  // =============================================
  // VTO (VOLUNTARY TIME OFF) METHODS
  // =============================================

  /**
   * Publish a new VTO offer
   * VTO is offered when there is overstaffing - employees can volunteer to take unpaid/paid time off
   */
  async publishVTO(request: PublishVTORequest): Promise<VETAPIResponse<LaborAction>> {
    try {
      const now = new Date().toISOString();
      const targetDate = request.target_date;
      
      // Combine date with time if time is provided as HH:MM:SS
      let startTime = request.start_time;
      let endTime = request.end_time;
      
      if (!request.start_time.includes('T')) {
        startTime = `${targetDate}T${request.start_time}`;
      }
      if (!request.end_time.includes('T')) {
        endTime = `${targetDate}T${request.end_time}`;
      }

      const vtoOffer = {
        action_type: 'VTO' as const,
        target_date: targetDate,
        shift_template_id: request.shift_template_id || null,
        start_time: startTime,
        end_time: endTime,
        department_id: request.department_id || null,
        positions_available: request.positions_available,
        positions_filled: 0,
        priority_order: request.priority_order || null,
        offer_message: request.offer_message || null,
        status: request.status || 'open',
        posted_by: request.posted_by,
        posted_at: now,
        closes_at: request.closes_at || null,
        organization_id: request.organization_id,
        paid: request.paid || false,
        requires_approval: request.requires_approval !== undefined ? request.requires_approval : true,
      };

      const { data, error } = await supabase
        .from('labor_actions')
        .insert(vtoOffer)
        .select()
        .single();

      if (error) {
        logger.error('Error publishing VTO offer:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info(`VTO offer published: ${data.id}`);
      return {
        success: true,
        data: data as LaborAction,
        message: 'VTO offer published successfully',
      };
    } catch (error) {
      logger.error('Exception in publishVTO:', error);
      return {
        success: false,
        error: 'Failed to publish VTO offer',
      };
    }
  }

  /**
   * Update an existing VTO offer
   */
  async updateVTO(vtoId: string, request: UpdateVTORequest): Promise<VETAPIResponse<LaborAction>> {
    try {
      const { data, error } = await supabase
        .from('labor_actions')
        .update({
          ...request,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vtoId)
        .eq('action_type', 'VTO')
        .select()
        .single();

      if (error) {
        logger.error('Error updating VTO offer:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'VTO offer not found',
        };
      }

      logger.info(`VTO offer updated: ${vtoId}`);
      return {
        success: true,
        data: data as LaborAction,
        message: 'VTO offer updated successfully',
      };
    } catch (error) {
      logger.error('Exception in updateVTO:', error);
      return {
        success: false,
        error: 'Failed to update VTO offer',
      };
    }
  }

  /**
   * Close a VTO offer (manually)
   */
  async closeVTO(vtoId: string, closedBy: string): Promise<VETAPIResponse<LaborAction>> {
    try {
      const { data, error } = await supabase
        .from('labor_actions')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', vtoId)
        .eq('action_type', 'VTO')
        .select()
        .single();

      if (error) {
        logger.error('Error closing VTO offer:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info(`VTO offer closed: ${vtoId} by ${closedBy}`);
      return {
        success: true,
        data: data as LaborAction,
        message: 'VTO offer closed successfully',
      };
    } catch (error) {
      logger.error('Exception in closeVTO:', error);
      return {
        success: false,
        error: 'Failed to close VTO offer',
      };
    }
  }

  /**
   * Cancel a VTO offer
   */
  async cancelVTO(vtoId: string, cancelledBy: string): Promise<VETAPIResponse<LaborAction>> {
    try {
      const { data, error } = await supabase
        .from('labor_actions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', vtoId)
        .eq('action_type', 'VTO')
        .select()
        .single();

      if (error) {
        logger.error('Error cancelling VTO offer:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info(`VTO offer cancelled: ${vtoId} by ${cancelledBy}`);
      return {
        success: true,
        data: data as LaborAction,
        message: 'VTO offer cancelled successfully',
      };
    } catch (error) {
      logger.error('Exception in cancelVTO:', error);
      return {
        success: false,
        error: 'Failed to cancel VTO offer',
      };
    }
  }

  /**
   * Get detailed VTO offer information
   */
  async getVTODetails(vtoId: string): Promise<VETAPIResponse<VTOOfferDetails>> {
    try {
      const { data: offer, error: offerError } = await supabase
        .from('labor_actions')
        .select(`
          *,
          department:departments(name),
          shift_template:shift_templates(name),
          posted_by_user:users!posted_by(name)
        `)
        .eq('id', vtoId)
        .eq('action_type', 'VTO')
        .single();

      if (offerError || !offer) {
        logger.error('Error fetching VTO details:', offerError);
        return {
          success: false,
          error: 'VTO offer not found',
        };
      }

      // Fetch all responses
      const { data: responses, error: responsesError } = await supabase
        .from('labor_action_responses')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_number)
        `)
        .eq('labor_action_id', vtoId)
        .order('response_time', { ascending: true });

      if (responsesError) {
        logger.error('Error fetching responses:', responsesError);
      }

      // Calculate response counts
      const responseCounts = await this.getResponseCounts(vtoId);

      const details: VTOOfferDetails = {
        ...offer,
        posted_by_name: offer.posted_by_user?.name,
        department_name: offer.department?.name,
        shift_template_name: offer.shift_template?.name,
        response_count: responseCounts.total,
        accepted_count: responseCounts.accepted,
        pending_count: responseCounts.pending,
        declined_count: responseCounts.declined,
        waitlisted_count: responseCounts.waitlisted,
        responses: (responses || []).map((r) => ({
          ...r,
          employee_name: r.employee
            ? `${r.employee.first_name} ${r.employee.last_name}`
            : undefined,
          employee_number: r.employee?.employee_number,
        })),
      };

      return {
        success: true,
        data: details,
      };
    } catch (error) {
      logger.error('Exception in getVTODetails:', error);
      return {
        success: false,
        error: 'Failed to fetch VTO details',
      };
    }
  }

  /**
   * Employee responds to VTO offer
   */
  async respondToVTO(request: RespondToVTORequest): Promise<VETAPIResponse<LaborActionResponse>> {
    try {
      // Check if response already exists
      const { data: existing } = await supabase
        .from('labor_action_responses')
        .select('id')
        .eq('labor_action_id', request.labor_action_id)
        .eq('employee_id', request.employee_id)
        .single();

      if (existing) {
        // Update existing response
        const { data, error } = await supabase
          .from('labor_action_responses')
          .update({
            response_status: request.response_status,
            response_time: new Date().toISOString(),
            notes: request.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          logger.error('Error updating VTO response:', error);
          return {
            success: false,
            error: error.message,
          };
        }

        return {
          success: true,
          data: data as LaborActionResponse,
          message: 'Response updated successfully',
        };
      }

      // Create new response
      const newResponse = {
        labor_action_id: request.labor_action_id,
        employee_id: request.employee_id,
        response_status: request.response_status,
        response_time: new Date().toISOString(),
        notes: request.notes || null,
      };

      const { data, error } = await supabase
        .from('labor_action_responses')
        .insert(newResponse)
        .select()
        .single();

      if (error) {
        logger.error('Error creating VTO response:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info(`Employee ${request.employee_id} responded to VTO ${request.labor_action_id}`);
      return {
        success: true,
        data: data as LaborActionResponse,
        message: 'Response submitted successfully',
      };
    } catch (error) {
      logger.error('Exception in respondToVTO:', error);
      return {
        success: false,
        error: 'Failed to submit response',
      };
    }
  }

  /**
   * Get VTO analytics
   */
  async getVTOAnalytics(request: VTOAnalyticsRequest): Promise<VETAPIResponse<VTOAnalyticsResponse>> {
    try {
      // Fetch all VTO offers in date range
      let query = supabase
        .from('labor_actions')
        .select(`
          *,
          responses:labor_action_responses(*)
        `)
        .eq('organization_id', request.organization_id)
        .eq('action_type', 'VTO')
        .gte('target_date', request.date_from)
        .lte('target_date', request.date_to);

      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }

      const { data: offers, error } = await query;

      if (error) {
        logger.error('Error fetching VTO analytics:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Calculate analytics
      const totalOffers = offers?.length || 0;
      const totalPositionsOffered = offers?.reduce((sum, o) => sum + o.positions_available, 0) || 0;
      const positionsTaken = offers?.reduce((sum, o) => sum + o.positions_filled, 0) || 0;
      const acceptanceRate = totalPositionsOffered > 0 ? (positionsTaken / totalPositionsOffered) * 100 : 0;

      // Status breakdown
      const offersByStatus = {
        draft: offers?.filter((o) => o.status === 'draft').length || 0,
        open: offers?.filter((o) => o.status === 'open').length || 0,
        closed: offers?.filter((o) => o.status === 'closed').length || 0,
        cancelled: offers?.filter((o) => o.status === 'cancelled').length || 0,
      };

      // Response breakdown
      const allResponses = offers?.flatMap((o) => o.responses || []) || [];
      const responsesByStatus = {
        accepted: allResponses.filter((r) => r.response_status === 'accepted').length,
        declined: allResponses.filter((r) => r.response_status === 'declined').length,
        pending: allResponses.filter((r) => r.response_status === 'pending').length,
        waitlisted: allResponses.filter((r) => r.response_status === 'waitlisted').length,
      };

      // Average response time
      const responseTimes = allResponses
        .map((r) => {
          const offer = offers?.find((o) => o.id === r.labor_action_id);
          if (!offer) return 0;
          const posted = new Date(offer.posted_at).getTime();
          const responded = new Date(r.response_time).getTime();
          return (responded - posted) / 1000 / 60; // Minutes
        })
        .filter((t) => t > 0);

      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
          : 0;

      const analytics: VTOAnalyticsResponse = {
        total_offers: totalOffers,
        total_positions_offered: totalPositionsOffered,
        positions_taken: positionsTaken,
        acceptance_rate: parseFloat(acceptanceRate.toFixed(2)),
        avg_response_time_minutes: parseFloat(avgResponseTime.toFixed(2)),
        offers_by_status: offersByStatus,
        responses_by_status: responsesByStatus,
      };

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      logger.error('Exception in getVTOAnalytics:', error);
      return {
        success: false,
        error: 'Failed to fetch analytics',
      };
    }
  }

  // =============================================
  // VTO SAFETY FLOOR ENFORCEMENT
  // =============================================

  /**
   * Check if VTO offer violates safety floor requirements
   */
  async checkSafetyFloor(request: SafetyFloorCheckRequest): Promise<SafetyFloorCheckResponse> {
    try {
      const targetDate = request.target_date;
      let startTime = request.start_time;
      let endTime = request.end_time;

      // Normalize time strings
      if (!startTime.includes('T')) {
        startTime = `${targetDate}T${startTime}`;
      }
      if (!endTime.includes('T')) {
        endTime = `${targetDate}T${endTime}`;
      }

      // 1. Get applicable safety floor configurations
      const configs = await this.getSafetyFloorConfigs(
        request.organization_id,
        request.department_id,
        request.shift_template_id,
        targetDate,
        startTime,
        endTime
      );

      if (configs.length === 0) {
        // No safety floor configured - allow VTO
        return {
          is_safe: true,
          enforcement_level: 'none',
          current_staff_count: 0,
          minimum_required: 0,
          available_vto_slots: request.proposed_vto_count,
          proposed_vto_count: request.proposed_vto_count,
          staff_after_vto: 0,
          override_required: false,
          recommendation: 'No safety floor configured - VTO can be offered freely',
        };
      }

      // 2. Get current scheduled staff count for the time period
      const currentStaffCount = await this.getScheduledStaffCount(
        request.organization_id,
        request.department_id,
        targetDate,
        startTime,
        endTime
      );

      // 3. Check each safety floor config
      const violations: SafetyFloorViolation[] = [];
      let strictestEnforcement: 'strict' | 'warning' | 'advisory' = 'advisory';
      let maxMinimumRequired = 0;

      for (const config of configs) {
        const violation = await this.checkSafetyFloorConfig(
          config,
          currentStaffCount,
          request.proposed_vto_count
        );

        if (violation) {
          violations.push(violation);
          
          // Track strictest enforcement level
          if (config.enforcement_level === 'strict') {
            strictestEnforcement = 'strict';
          } else if (config.enforcement_level === 'warning' && strictestEnforcement !== 'strict') {
            strictestEnforcement = 'warning';
          }

          // Track highest minimum requirement
          if (config.minimum_staff_count > maxMinimumRequired) {
            maxMinimumRequired = config.minimum_staff_count;
          }
        }
      }

      // Calculate available VTO slots
      const availableVtoSlots = Math.max(0, currentStaffCount - maxMinimumRequired);
      const staffAfterVto = currentStaffCount - request.proposed_vto_count;
      const isSafe = violations.length === 0 || strictestEnforcement !== 'strict';
      const overrideRequired = !isSafe && violations.some(v => 
        configs.find(c => c.id === v.config_id)?.override_allowed === false
      );

      // Generate recommendation
      let recommendation = '';
      if (isSafe) {
        recommendation = `VTO can be safely offered. ${availableVtoSlots} slots available.`;
      } else if (strictestEnforcement === 'strict') {
        recommendation = `VTO would violate safety floor. Reduce to ${availableVtoSlots} slots or less.`;
      } else if (strictestEnforcement === 'warning') {
        recommendation = `Warning: VTO may impact minimum staffing. Current: ${currentStaffCount}, After VTO: ${staffAfterVto}, Minimum: ${maxMinimumRequired}`;
      } else {
        recommendation = `Advisory: Consider reducing VTO to maintain optimal staffing levels.`;
      }

      return {
        is_safe: isSafe,
        enforcement_level: strictestEnforcement,
        current_staff_count: currentStaffCount,
        minimum_required: maxMinimumRequired,
        available_vto_slots: availableVtoSlots,
        proposed_vto_count: request.proposed_vto_count,
        staff_after_vto: staffAfterVto,
        violations: violations.length > 0 ? violations : undefined,
        override_required: overrideRequired,
        recommendation,
      };
    } catch (error) {
      logger.error('Exception in checkSafetyFloor:', error);
      // On error, fail safe - block VTO
      return {
        is_safe: false,
        enforcement_level: 'strict',
        current_staff_count: 0,
        minimum_required: 0,
        available_vto_slots: 0,
        proposed_vto_count: request.proposed_vto_count,
        staff_after_vto: 0,
        override_required: true,
        recommendation: 'Error checking safety floor - VTO blocked for safety',
      };
    }
  }

  /**
   * Get applicable safety floor configurations
   */
  private async getSafetyFloorConfigs(
    organizationId: string,
    departmentId?: string,
    shiftTemplateId?: string,
    targetDate?: string,
    startTime?: string,
    endTime?: string
  ): Promise<SafetyFloorConfig[]> {
    try {
      let query = supabase
        .from('safety_floor_configs')
        .select('*')
        .eq('organization_id', organizationId);

      // Filter by department (if specified)
      if (departmentId) {
        query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
      } else {
        query = query.is('department_id', null);
      }

      // Filter by shift template (if specified)
      if (shiftTemplateId) {
        query = query.or(`shift_template_id.eq.${shiftTemplateId},shift_template_id.is.null`);
      }

      // Filter by day of week (if target date specified)
      if (targetDate) {
        const dayOfWeek = new Date(targetDate).getDay();
        query = query.or(`day_of_week.eq.${dayOfWeek},day_of_week.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching safety floor configs:', error);
        return [];
      }

      // Filter by time range if specified
      if (startTime && endTime && data) {
        const requestStart = new Date(startTime).getTime();
        const requestEnd = new Date(endTime).getTime();

        return (data as SafetyFloorConfig[]).filter((config) => {
          if (!config.time_start || !config.time_end) {
            return true; // No time restriction
          }

          // Parse config times (HH:MM:SS format)
          const timeParts = config.time_start.split(':').map(Number);
          const configStartHour = timeParts[0] || 0;
          const configStartMin = timeParts[1] || 0;
          
          const endTimeParts = config.time_end.split(':').map(Number);
          const configEndHour = endTimeParts[0] || 0;
          const configEndMin = endTimeParts[1] || 0;
          
          const configStartMs = (configStartHour * 60 + configStartMin) * 60 * 1000;
          const configEndMs = (configEndHour * 60 + configEndMin) * 60 * 1000;

          const requestStartMs = new Date(requestStart).getHours() * 3600000 + 
                                  new Date(requestStart).getMinutes() * 60000;
          const requestEndMs = new Date(requestEnd).getHours() * 3600000 + 
                                new Date(requestEnd).getMinutes() * 60000;

          // Check if time ranges overlap
          return requestStartMs < configEndMs && requestEndMs > configStartMs;
        });
      }

      return (data as SafetyFloorConfig[]) || [];
    } catch (error) {
      logger.error('Exception in getSafetyFloorConfigs:', error);
      return [];
    }
  }

  /**
   * Get scheduled staff count for a time period
   */
  private async getScheduledStaffCount(
    organizationId: string,
    departmentId: string | undefined,
    targetDate: string,
    startTime: string,
    endTime: string
  ): Promise<number> {
    try {
      // Query schedules table for staff scheduled during this time
      let query = supabase
        .from('schedules')
        .select('employee_id', { count: 'exact', head: false })
        .eq('organization_id', organizationId)
        .eq('date', targetDate)
        .gte('end_time', startTime)
        .lte('start_time', endTime);

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { count, error } = await query;

      if (error) {
        logger.error('Error fetching scheduled staff count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('Exception in getScheduledStaffCount:', error);
      return 0;
    }
  }

  /**
   * Check a single safety floor configuration
   */
  private async checkSafetyFloorConfig(
    config: SafetyFloorConfig,
    currentStaffCount: number,
    proposedVtoCount: number
  ): Promise<SafetyFloorViolation | null> {
    const staffAfterVto = currentStaffCount - proposedVtoCount;

    // Check absolute minimum
    if (staffAfterVto < config.minimum_staff_count) {
      return {
        config_id: config.id,
        violation_type: 'minimum_count',
        current_value: staffAfterVto,
        required_value: config.minimum_staff_count,
        deficit: config.minimum_staff_count - staffAfterVto,
        message: `Staff count after VTO (${staffAfterVto}) would be below minimum requirement (${config.minimum_staff_count})`,
        severity: config.enforcement_level === 'strict' ? 'critical' : 
                  config.enforcement_level === 'warning' ? 'warning' : 'info',
      };
    }

    // Check percentage minimum
    if (config.minimum_staff_percentage) {
      const requiredByPercentage = Math.ceil((currentStaffCount * config.minimum_staff_percentage) / 100);
      if (staffAfterVto < requiredByPercentage) {
        return {
          config_id: config.id,
          violation_type: 'minimum_percentage',
          current_value: staffAfterVto,
          required_value: requiredByPercentage,
          deficit: requiredByPercentage - staffAfterVto,
          message: `Staff count after VTO (${staffAfterVto}) would be below ${config.minimum_staff_percentage}% of scheduled staff (${requiredByPercentage} required)`,
          severity: config.enforcement_level === 'strict' ? 'critical' : 
                    config.enforcement_level === 'warning' ? 'warning' : 'info',
        };
      }
    }

    // Check skill requirements (if specified)
    if (config.skill_requirements && config.skill_requirements.length > 0) {
      // TODO: Implement skill-based checking
      // This would require querying employee skills for scheduled staff
      // For now, we'll skip this check
    }

    return null; // No violation
  }

  /**
   * Publish VTO with safety floor enforcement
   */
  async publishVTOWithSafetyCheck(
    request: PublishVTOWithOverrideRequest
  ): Promise<VETAPIResponse<LaborAction>> {
    try {
      // Check if safety floor check should be skipped
      if (!request.skip_safety_floor_check) {
        // Perform safety floor check
        const safetyCheck = await this.checkSafetyFloor({
          organization_id: request.organization_id,
          department_id: request.department_id,
          shift_template_id: request.shift_template_id,
          target_date: request.target_date,
          start_time: request.start_time,
          end_time: request.end_time,
          proposed_vto_count: request.positions_available,
        });

        // Block if strict enforcement and not safe
        if (!safetyCheck.is_safe && safetyCheck.enforcement_level === 'strict') {
          logger.warn('VTO blocked by safety floor enforcement:', safetyCheck);
          return {
            success: false,
            error: `Safety floor violation: ${safetyCheck.recommendation}`,
            data: safetyCheck as any,
          };
        }

        // Warn if warning level
        if (!safetyCheck.is_safe && safetyCheck.enforcement_level === 'warning') {
          logger.warn('VTO published with safety floor warning:', safetyCheck);
          // Continue but log warning
        }
      } else {
        // Override applied - validate override details
        if (!request.override_reason) {
          return {
            success: false,
            error: 'override_reason is required when skipping safety floor check',
          };
        }
        if (!request.override_approved_by) {
          return {
            success: false,
            error: 'override_approved_by is required when skipping safety floor check',
          };
        }
        logger.info(`VTO published with safety floor override by ${request.override_approved_by}: ${request.override_reason}`);
      }

      // Proceed with normal VTO publishing
      return await this.publishVTO(request);
    } catch (error) {
      logger.error('Exception in publishVTOWithSafetyCheck:', error);
      return {
        success: false,
        error: 'Failed to publish VTO with safety check',
      };
    }
  }

  /**
   * Log safety floor check for audit trail
   */
  async logSafetyFloorAudit(
    laborActionId: string,
    checkResult: SafetyFloorCheckResponse,
    overrideApplied: boolean,
    overrideReason?: string,
    overrideApprovedBy?: string
  ): Promise<void> {
    try {
      const auditLog: Omit<SafetyFloorAuditLog, 'id' | 'created_at'> = {
        labor_action_id: laborActionId,
        check_timestamp: new Date().toISOString(),
        is_safe: checkResult.is_safe,
        enforcement_level: checkResult.enforcement_level,
        current_staff_count: checkResult.current_staff_count,
        minimum_required: checkResult.minimum_required,
        proposed_vto_count: checkResult.proposed_vto_count,
        override_applied: overrideApplied,
        override_reason: overrideReason,
        override_approved_by: overrideApprovedBy,
        violations: checkResult.violations,
      };

      await supabase.from('safety_floor_audit_logs').insert(auditLog);
      logger.info(`Safety floor audit logged for VTO ${laborActionId}`);
    } catch (error) {
      logger.error('Error logging safety floor audit:', error);
    }
  }

  // =============================================
  // PTO REQUEST METHODS
  // =============================================

  /**
   * Request PTO
   */
  async requestPTO(request: RequestPTORequest): Promise<VETAPIResponse<PTORequest>> {
    try {
      const now = new Date().toISOString();

      // Calculate business days between start and end date
      const totalDays = this.calculateBusinessDays(request.start_date, request.end_date);

      // Calculate hours requested
      let hoursRequested = 0;
      if (request.day_type === 'hours' && request.hours_requested) {
        hoursRequested = request.hours_requested;
      } else if (request.day_type === 'half_day') {
        hoursRequested = totalDays * 4; // Assuming 4 hours per half day
      } else {
        hoursRequested = totalDays * 8; // Full day = 8 hours
      }

      // Check PTO balance
      const balanceCheck = await this.checkPTOBalance(
        request.organization_id,
        request.employee_id,
        request.pto_type,
        hoursRequested
      );

      if (!balanceCheck.sufficient) {
        return {
          success: false,
          error: `Insufficient PTO balance. Available: ${balanceCheck.available} hours, Requested: ${hoursRequested} hours`,
        };
      }

      // Check for conflicts
      const availabilityCheck = await this.checkPTOAvailability({
        organization_id: request.organization_id,
        employee_id: request.employee_id,
        department_id: request.department_id,
        start_date: request.start_date,
        end_date: request.end_date,
        day_type: request.day_type || 'full_day',
        hours_requested: hoursRequested,
      });

      // Warn about conflicts but don't block
      if (!availabilityCheck.available) {
        logger.warn(`PTO request has conflicts but will be created as pending`, {
          employee_id: request.employee_id,
          conflicts: availabilityCheck.conflicts,
        });
      }

      // Create PTO request
      const ptoData = {
        organization_id: request.organization_id,
        employee_id: request.employee_id,
        department_id: request.department_id,
        pto_type: request.pto_type,
        start_date: request.start_date,
        end_date: request.end_date,
        day_type: request.day_type || 'full_day',
        hours_requested: hoursRequested,
        total_days: totalDays,
        status: 'pending',
        reason: request.reason,
        notes: request.notes,
        requested_at: now,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('pto_requests')
        .insert(ptoData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating PTO request:', error);
        return {
          success: false,
          error: `Failed to create PTO request: ${error.message}`,
        };
      }

      // Update pending hours in balance
      await this.updatePendingBalance(
        request.organization_id,
        request.employee_id,
        request.pto_type,
        hoursRequested,
        'add'
      );

      logger.info(`PTO request created: ${data.id}`);

      return {
        success: true,
        data: data as PTORequest,
      };
    } catch (error) {
      logger.error('Error in requestPTO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update PTO Request
   */
  async updatePTORequest(request: UpdatePTORequest): Promise<VETAPIResponse<PTORequest>> {
    try {
      const now = new Date().toISOString();

      // Get existing request
      const { data: existing, error: fetchError } = await supabase
        .from('pto_requests')
        .select('*')
        .eq('id', request.request_id)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: 'PTO request not found',
        };
      }

      // Only allow updates if status is pending
      if (existing.status !== 'pending') {
        return {
          success: false,
          error: `Cannot update PTO request with status: ${existing.status}`,
        };
      }

      // Calculate new total days if dates changed
      let totalDays = existing.total_days;
      if (request.start_date || request.end_date) {
        const startDate = request.start_date || existing.start_date;
        const endDate = request.end_date || existing.end_date;
        totalDays = this.calculateBusinessDays(startDate, endDate);
      }

      // Calculate new hours if changed
      let hoursRequested = existing.hours_requested;
      if (request.day_type || request.hours_requested || request.start_date || request.end_date) {
        const dayType = request.day_type || existing.day_type;
        if (dayType === 'hours') {
          hoursRequested = request.hours_requested || existing.hours_requested || 0;
        } else if (dayType === 'half_day') {
          hoursRequested = totalDays * 4;
        } else {
          hoursRequested = totalDays * 8;
        }
      }

      // Update pending balance if hours changed
      const hoursDiff = hoursRequested - existing.hours_requested;
      if (hoursDiff !== 0) {
        await this.updatePendingBalance(
          existing.organization_id,
          existing.employee_id,
          existing.pto_type,
          Math.abs(hoursDiff),
          hoursDiff > 0 ? 'add' : 'subtract'
        );
      }

      // Update request
      const updates = {
        start_date: request.start_date,
        end_date: request.end_date,
        day_type: request.day_type,
        hours_requested: hoursRequested,
        total_days: totalDays,
        reason: request.reason,
        notes: request.notes,
        updated_at: now,
      };

      // Remove undefined fields
      Object.keys(updates).forEach((key) => {
        if (updates[key as keyof typeof updates] === undefined) {
          delete updates[key as keyof typeof updates];
        }
      });

      const { data, error } = await supabase
        .from('pto_requests')
        .update(updates)
        .eq('id', request.request_id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating PTO request:', error);
        return {
          success: false,
          error: `Failed to update PTO request: ${error.message}`,
        };
      }

      logger.info(`PTO request updated: ${request.request_id}`);

      return {
        success: true,
        data: data as PTORequest,
      };
    } catch (error) {
      logger.error('Error in updatePTORequest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Review PTO Request (Approve/Deny)
   */
  async reviewPTORequest(request: ReviewPTORequest): Promise<VETAPIResponse<PTORequest>> {
    try {
      const now = new Date().toISOString();

      // Get existing request
      const { data: existing, error: fetchError } = await supabase
        .from('pto_requests')
        .select('*')
        .eq('id', request.request_id)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: 'PTO request not found',
        };
      }

      // Only allow review if status is pending
      if (existing.status !== 'pending') {
        return {
          success: false,
          error: `Cannot review PTO request with status: ${existing.status}`,
        };
      }

      const newStatus = request.action === 'approve' ? 'approved' : 'denied';

      // Update request
      const { data, error } = await supabase
        .from('pto_requests')
        .update({
          status: newStatus,
          reviewed_by: request.reviewed_by,
          reviewed_at: now,
          approval_notes: request.approval_notes,
          updated_at: now,
        })
        .eq('id', request.request_id)
        .select()
        .single();

      if (error) {
        logger.error('Error reviewing PTO request:', error);
        return {
          success: false,
          error: `Failed to review PTO request: ${error.message}`,
        };
      }

      // Update balances
      if (request.action === 'approve') {
        // Move from pending to used
        await this.updatePendingBalance(
          existing.organization_id,
          existing.employee_id,
          existing.pto_type,
          existing.hours_requested,
          'subtract'
        );
        await this.updateUsedBalance(
          existing.organization_id,
          existing.employee_id,
          existing.pto_type,
          existing.hours_requested,
          'add'
        );
      } else {
        // Remove from pending
        await this.updatePendingBalance(
          existing.organization_id,
          existing.employee_id,
          existing.pto_type,
          existing.hours_requested,
          'subtract'
        );
      }

      logger.info(`PTO request ${request.action}d: ${request.request_id}`);

      return {
        success: true,
        data: data as PTORequest,
      };
    } catch (error) {
      logger.error('Error in reviewPTORequest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Cancel PTO Request
   */
  async cancelPTORequest(request: CancelPTORequest): Promise<VETAPIResponse<PTORequest>> {
    try {
      const now = new Date().toISOString();

      // Get existing request
      const { data: existing, error: fetchError } = await supabase
        .from('pto_requests')
        .select('*')
        .eq('id', request.request_id)
        .single();

      if (fetchError || !existing) {
        return {
          success: false,
          error: 'PTO request not found',
        };
      }

      // Verify employee owns this request
      if (existing.employee_id !== request.employee_id) {
        return {
          success: false,
          error: 'Not authorized to cancel this PTO request',
        };
      }

      // Only allow cancel if status is pending or approved
      if (existing.status !== 'pending' && existing.status !== 'approved') {
        return {
          success: false,
          error: `Cannot cancel PTO request with status: ${existing.status}`,
        };
      }

      // Update request
      const { data, error } = await supabase
        .from('pto_requests')
        .update({
          status: 'cancelled',
          notes: request.reason ? `${existing.notes || ''}\nCancellation reason: ${request.reason}` : existing.notes,
          updated_at: now,
        })
        .eq('id', request.request_id)
        .select()
        .single();

      if (error) {
        logger.error('Error cancelling PTO request:', error);
        return {
          success: false,
          error: `Failed to cancel PTO request: ${error.message}`,
        };
      }

      // Update balances based on previous status
      if (existing.status === 'pending') {
        // Remove from pending
        await this.updatePendingBalance(
          existing.organization_id,
          existing.employee_id,
          existing.pto_type,
          existing.hours_requested,
          'subtract'
        );
      } else if (existing.status === 'approved') {
        // Return to available balance
        await this.updateUsedBalance(
          existing.organization_id,
          existing.employee_id,
          existing.pto_type,
          existing.hours_requested,
          'subtract'
        );
      }

      logger.info(`PTO request cancelled: ${request.request_id}`);

      return {
        success: true,
        data: data as PTORequest,
      };
    } catch (error) {
      logger.error('Error in cancelPTORequest:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * List PTO Requests
   */
  async listPTORequests(request: ListPTORequestsRequest): Promise<VETAPIResponse<PTORequest[]>> {
    try {
      let query = supabase
        .from('pto_requests')
        .select('*')
        .eq('organization_id', request.organization_id)
        .order('requested_at', { ascending: false });

      // Apply filters
      if (request.employee_id) {
        query = query.eq('employee_id', request.employee_id);
      }

      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }

      if (request.status) {
        query = query.eq('status', request.status);
      }

      if (request.pto_type) {
        query = query.eq('pto_type', request.pto_type);
      }

      if (request.start_date) {
        query = query.gte('start_date', request.start_date);
      }

      if (request.end_date) {
        query = query.lte('end_date', request.end_date);
      }

      // Apply pagination
      const limit = request.limit || 50;
      const offset = request.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        logger.error('Error listing PTO requests:', error);
        return {
          success: false,
          error: `Failed to list PTO requests: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data as PTORequest[],
      };
    } catch (error) {
      logger.error('Error in listPTORequests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check PTO Availability
   */
  async checkPTOAvailability(
    request: CheckPTOAvailabilityRequest
  ): Promise<CheckPTOAvailabilityResponse> {
    try {
      const conflicts: PTOConflict[] = [];
      let available = true;

      // Calculate hours requested
      const totalDays = this.calculateBusinessDays(request.start_date, request.end_date);
      let hoursRequested = 0;
      if (request.day_type === 'hours' && request.hours_requested) {
        hoursRequested = request.hours_requested;
      } else if (request.day_type === 'half_day') {
        hoursRequested = totalDays * 4;
      } else {
        hoursRequested = totalDays * 8;
      }

      // Check overlapping requests
      let query = supabase
        .from('pto_requests')
        .select('*')
        .eq('employee_id', request.employee_id)
        .in('status', ['pending', 'approved'])
        .or(`start_date.lte.${request.end_date},end_date.gte.${request.start_date}`);

      if (request.exclude_request_id) {
        query = query.neq('id', request.exclude_request_id);
      }

      const { data: overlapping } = await query;

      if (overlapping && overlapping.length > 0) {
        conflicts.push({
          conflict_type: 'overlapping_request',
          severity: 'blocking',
          message: `You have ${overlapping.length} overlapping PTO request(s) for this period`,
          details: overlapping,
        });
        available = false;
      }

      // Check PTO balance
      const balanceCheck = await this.checkPTOBalance(
        request.organization_id,
        request.employee_id,
        'vacation', // TODO: Get actual type from request
        hoursRequested
      );

      if (!balanceCheck.sufficient) {
        conflicts.push({
          conflict_type: 'insufficient_balance',
          severity: 'blocking',
          message: `Insufficient PTO balance. Available: ${balanceCheck.available} hours, Requested: ${hoursRequested} hours`,
        });
        available = false;
      }

      // Check minimum staffing (similar to safety floor)
      const staffingCheck = await this.checkMinimumStaffingForPTO(
        request.organization_id,
        request.department_id,
        request.start_date,
        request.end_date
      );

      if (!staffingCheck.adequate) {
        conflicts.push({
          conflict_type: 'minimum_staffing',
          severity: 'warning',
          message: staffingCheck.message || 'Approving this request may result in understaffing',
          details: staffingCheck,
        });
        // Don't block, just warn
      }

      const recommendation = available
        ? 'PTO request can be submitted'
        : conflicts.find((c) => c.severity === 'blocking')
        ? 'PTO request cannot be approved due to conflicts'
        : 'PTO request may be approved with caution';

      return {
        available,
        conflicts,
        current_balance: balanceCheck.available,
        required_balance: hoursRequested,
        overlapping_requests: overlapping as PTORequest[],
        staffing_level: staffingCheck.adequate && staffingCheck.scheduled_staff !== undefined ? {
          scheduled_staff: staffingCheck.scheduled_staff,
          requested_off: staffingCheck.requested_off || 0,
          minimum_required: staffingCheck.minimum_required || 0,
          remaining_staff: staffingCheck.remaining_staff || 0,
        } : undefined,
        recommendation,
      };
    } catch (error) {
      logger.error('Error in checkPTOAvailability:', error);
      return {
        available: false,
        conflicts: [
          {
            conflict_type: 'minimum_staffing',
            severity: 'blocking',
            message: 'Error checking PTO availability',
          },
        ],
        recommendation: 'Unable to verify availability',
      };
    }
  }

  /**
   * Get PTO Balance
   */
  async getPTOBalance(request: GetPTOBalanceRequest): Promise<VETAPIResponse<PTOBalance[]>> {
    try {
      const year = request.year || new Date().getFullYear();

      let query = supabase
        .from('pto_balances')
        .select('*')
        .eq('organization_id', request.organization_id)
        .eq('employee_id', request.employee_id)
        .eq('year', year);

      if (request.pto_type) {
        query = query.eq('pto_type', request.pto_type);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error getting PTO balance:', error);
        return {
          success: false,
          error: `Failed to get PTO balance: ${error.message}`,
        };
      }

      return {
        success: true,
        data: data as PTOBalance[],
      };
    } catch (error) {
      logger.error('Error in getPTOBalance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get PTO Analytics
   */
  async getPTOAnalytics(request: PTOAnalyticsRequest): Promise<VETAPIResponse<PTOAnalyticsResponse>> {
    try {
      let query = supabase
        .from('pto_requests')
        .select('*')
        .eq('organization_id', request.organization_id)
        .gte('start_date', request.start_date)
        .lte('end_date', request.end_date);

      if (request.department_id) {
        query = query.eq('department_id', request.department_id);
      }

      const { data: requests, error } = await query;

      if (error) {
        logger.error('Error getting PTO analytics:', error);
        return {
          success: false,
          error: `Failed to get PTO analytics: ${error.message}`,
        };
      }

      if (!requests || requests.length === 0) {
        return {
          success: true,
          data: {
            total_requests: 0,
            approved_requests: 0,
            denied_requests: 0,
            pending_requests: 0,
            cancelled_requests: 0,
            total_days_requested: 0,
            total_days_approved: 0,
            approval_rate: 0,
            average_response_time_hours: 0,
          },
        };
      }

      // Calculate metrics
      const totalRequests = requests.length;
      const approvedRequests = requests.filter((r) => r.status === 'approved').length;
      const deniedRequests = requests.filter((r) => r.status === 'denied').length;
      const pendingRequests = requests.filter((r) => r.status === 'pending').length;
      const cancelledRequests = requests.filter((r) => r.status === 'cancelled').length;
      const totalDaysRequested = requests.reduce((sum, r) => sum + r.total_days, 0);
      const totalDaysApproved = requests
        .filter((r) => r.status === 'approved')
        .reduce((sum, r) => sum + r.total_days, 0);
      const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

      // Calculate average response time
      const reviewedRequests = requests.filter(
        (r) => r.reviewed_at && (r.status === 'approved' || r.status === 'denied')
      );
      let averageResponseTimeHours = 0;
      if (reviewedRequests.length > 0) {
        const totalResponseTime = reviewedRequests.reduce((sum, r) => {
          const requestedAt = new Date(r.requested_at).getTime();
          const reviewedAt = new Date(r.reviewed_at!).getTime();
          return sum + (reviewedAt - requestedAt);
        }, 0);
        averageResponseTimeHours = totalResponseTime / reviewedRequests.length / (1000 * 60 * 60);
      }

      const analytics: PTOAnalyticsResponse = {
        total_requests: totalRequests,
        approved_requests: approvedRequests,
        denied_requests: deniedRequests,
        pending_requests: pendingRequests,
        cancelled_requests: cancelledRequests,
        total_days_requested: totalDaysRequested,
        total_days_approved: totalDaysApproved,
        approval_rate: Math.round(approvalRate * 100) / 100,
        average_response_time_hours: Math.round(averageResponseTimeHours * 100) / 100,
      };

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      logger.error('Error in getPTOAnalytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // =============================================
  // PTO HELPER METHODS
  // =============================================

  /**
   * Calculate business days between two dates (excluding weekends)
   */
  private calculateBusinessDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Check PTO balance
   */
  private async checkPTOBalance(
    organizationId: string,
    employeeId: string,
    ptoType: PTOType,
    hoursRequested: number
  ): Promise<{ sufficient: boolean; available: number }> {
    try {
      const year = new Date().getFullYear();

      const { data: balance } = await supabase
        .from('pto_balances')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('employee_id', employeeId)
        .eq('pto_type', ptoType)
        .eq('year', year)
        .single();

      if (!balance) {
        // No balance record, assume 0 available
        return { sufficient: false, available: 0 };
      }

      const availableHours = balance.balance_hours - balance.used_hours - balance.pending_hours;

      return {
        sufficient: availableHours >= hoursRequested,
        available: availableHours,
      };
    } catch (error) {
      logger.error('Error checking PTO balance:', error);
      return { sufficient: false, available: 0 };
    }
  }

  /**
   * Update pending balance
   */
  private async updatePendingBalance(
    organizationId: string,
    employeeId: string,
    ptoType: PTOType,
    hours: number,
    operation: 'add' | 'subtract'
  ): Promise<void> {
    try {
      const year = new Date().getFullYear();

      const { data: balance } = await supabase
        .from('pto_balances')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('employee_id', employeeId)
        .eq('pto_type', ptoType)
        .eq('year', year)
        .single();

      if (!balance) {
        logger.warn('PTO balance not found for employee');
        return;
      }

      const newPending =
        operation === 'add' ? balance.pending_hours + hours : balance.pending_hours - hours;

      await supabase
        .from('pto_balances')
        .update({
          pending_hours: Math.max(0, newPending),
          updated_at: new Date().toISOString(),
        })
        .eq('id', balance.id);
    } catch (error) {
      logger.error('Error updating pending balance:', error);
    }
  }

  /**
   * Update used balance
   */
  private async updateUsedBalance(
    organizationId: string,
    employeeId: string,
    ptoType: PTOType,
    hours: number,
    operation: 'add' | 'subtract'
  ): Promise<void> {
    try {
      const year = new Date().getFullYear();

      const { data: balance } = await supabase
        .from('pto_balances')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('employee_id', employeeId)
        .eq('pto_type', ptoType)
        .eq('year', year)
        .single();

      if (!balance) {
        logger.warn('PTO balance not found for employee');
        return;
      }

      const newUsed = operation === 'add' ? balance.used_hours + hours : balance.used_hours - hours;

      await supabase
        .from('pto_balances')
        .update({
          used_hours: Math.max(0, newUsed),
          updated_at: new Date().toISOString(),
        })
        .eq('id', balance.id);
    } catch (error) {
      logger.error('Error updating used balance:', error);
    }
  }

  /**
   * Check minimum staffing for PTO (similar to safety floor but for PTO context)
   */
  private async checkMinimumStaffingForPTO(
    organizationId: string,
    departmentId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    adequate: boolean;
    message?: string;
    scheduled_staff?: number;
    requested_off?: number;
    minimum_required?: number;
    remaining_staff?: number;
  }> {
    try {
      // Get safety floor configs for this department
      const { data: configs } = await supabase
        .from('safety_floor_configs')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('department_id', departmentId);

      if (!configs || configs.length === 0) {
        // No safety floor configured, assume adequate
        return { adequate: true };
      }

      // For simplicity, use the strictest config
      const strictestConfig = configs.reduce((prev, current) =>
        (current.minimum_staff_count || 0) > (prev.minimum_staff_count || 0) ? current : prev
      );

      // Get scheduled staff count for the date range (simplified)
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select('employee_id')
        .eq('organization_id', organizationId)
        .eq('department_id', departmentId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        logger.error('Error checking schedules:', error);
        return { adequate: true }; // Fail open
      }

      const scheduledStaff = new Set(schedules?.map((s) => s.employee_id) || []).size;

      // Get existing PTO requests for the period
      const { data: ptoRequests } = await supabase
        .from('pto_requests')
        .select('employee_id')
        .eq('organization_id', organizationId)
        .eq('department_id', departmentId)
        .in('status', ['approved', 'pending'])
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

      const requestedOff = new Set(ptoRequests?.map((p) => p.employee_id) || []).size;

      const remainingStaff = scheduledStaff - requestedOff - 1; // -1 for current request
      const minimumRequired = strictestConfig.minimum_staff_count || 0;

      const adequate = remainingStaff >= minimumRequired;

      return {
        adequate,
        message: adequate
          ? undefined
          : `Approving would leave ${remainingStaff} staff, below minimum of ${minimumRequired}`,
        scheduled_staff: scheduledStaff,
        requested_off: requestedOff + 1,
        minimum_required: minimumRequired,
        remaining_staff: remainingStaff,
      };
    } catch (error) {
      logger.error('Error checking minimum staffing:', error);
      return { adequate: true }; // Fail open
    }
  }
}

// Export singleton instance
export const laborActionsService = new LaborActionsService();
