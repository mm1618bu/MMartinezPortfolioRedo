/**
 * Labor Actions API Routes (VET/VTO)
 * RESTful endpoints for VET publishing and management
 */

import express, { Request, Response, Router } from 'express';
import { laborActionsService } from '../services/labor-actions.service';
import { vetAcceptanceWorkflowService } from '../services/vet-acceptance-workflow.service';
import { ptoApprovalWorkflowService } from '../services/pto-approval-workflow.service';
import { uptTrackingService } from '../services/upt-tracking.service';
import { logger } from '../utils/logger';
import type {
  PublishVETRequest,
  UpdateVETRequest,
  ListVETRequest,
  RespondToVETRequest,
  ApproveVETResponseRequest,
  VETAnalyticsRequest,
  VETEligibilityRequest,
  UpdateVTORequest,
  RespondToVTORequest,
  VTOAnalyticsRequest,
  SafetyFloorCheckRequest,
  PublishVTOWithOverrideRequest,
  RequestPTORequest,
  UpdatePTORequest,
  ReviewPTORequest,
  CancelPTORequest,
  ListPTORequestsRequest,
  CheckPTOAvailabilityRequest,
  GetPTOBalanceRequest,
  PTOAnalyticsRequest,
} from '../types/laborActions';
import type {
  ProcessResponsesRequest,
  BatchApproveRequest,
  BatchRejectRequest,
} from '../types/laborActionsWorkflow';
import type {
  ProcessPendingPTORequestsRequest,
  BatchApprovePTORequest,
  BatchDenyPTORequest,
  CheckAutoApprovalRequest,
  DelegateApprovalRequest,
  GetPendingApprovalsRequest,
  PTOApprovalAnalyticsRequest,
  CreateApprovalRuleRequest,
  UpdateApprovalRuleRequest,
} from '../types/ptoApprovalWorkflow';
import type {
  DetectExceptionsRequest,
  RecordExceptionRequest,
  ExcuseExceptionRequest,
  GetUPTBalanceRequest,
  ListExceptionsRequest,
  UPTAnalyticsRequest,
  EmployeesAtRiskRequest,
  AdjustUPTBalanceRequest,
  CreateUPTPolicyRequest,
  UpdateUPTPolicyRequest,
} from '../types/uptTracking';

const router: Router = express.Router();

// =============================================
// VET OFFER MANAGEMENT
// =============================================

/**
 * POST /api/labor-actions/vet/publish
 * Publish a new VET offer
 */
router.post('/vet/publish', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: PublishVETRequest = req.body;

    // Validate required fields
    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.target_date) {
      res.status(400).json({ success: false, error: 'target_date is required' });
      return;
    }
    if (!request.start_time) {
      res.status(400).json({ success: false, error: 'start_time is required' });
      return;
    }
    if (!request.end_time) {
      res.status(400).json({ success: false, error: 'end_time is required' });
      return;
    }
    if (!request.positions_available || request.positions_available < 1) {
      res.status(400).json({ success: false, error: 'positions_available must be at least 1' });
      return;
    }
    if (!request.posted_by) {
      res.status(400).json({ success: false, error: 'posted_by is required' });
      return;
    }

    const result = await laborActionsService.publishVET(request);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vet/publish:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /api/labor-actions/vet/:id
 * Update an existing VET offer
 */
router.put('/vet/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const vetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const request: UpdateVETRequest = req.body;

    if (!vetId) {
      res.status(400).json({ success: false, error: 'VET ID is required' });
      return;
    }

    const result = await laborActionsService.updateVET(vetId, request);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in PUT /vet/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/vet/:id/close
 * Close a VET offer (manual closure)
 */
router.post('/vet/:id/close', async (req: Request, res: Response): Promise<void> => {
  try {
    const vetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { closed_by } = req.body;

    if (!vetId) {
      res.status(400).json({ success: false, error: 'VET ID is required' });
      return;
    }
    if (!closed_by) {
      res.status(400).json({ success: false, error: 'closed_by is required' });
      return;
    }

    const result = await laborActionsService.closeVET(vetId, closed_by);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vet/:id/close:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/vet/:id/cancel
 * Cancel a VET offer
 */
router.post('/vet/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const vetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { cancelled_by } = req.body;

    if (!vetId) {
      res.status(400).json({ success: false, error: 'VET ID is required' });
      return;
    }
    if (!cancelled_by) {
      res.status(400).json({ success: false, error: 'cancelled_by is required' });
      return;
    }

    const result = await laborActionsService.cancelVET(vetId, cancelled_by);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vet/:id/cancel:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/vet
 * List VET offers with filtering and pagination
 */
router.get('/vet', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ListVETRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      status: req.query.status as any,
      target_date_from: req.query.target_date_from as string,
      target_date_to: req.query.target_date_to as string,
      action_type: (req.query.action_type as any) || 'VET',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id query parameter is required' });
      return;
    }

    const result = await laborActionsService.listVETOffers(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /vet:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/vet/:id
 * Get detailed VET offer information
 */
router.get('/vet/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const vetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!vetId) {
      res.status(400).json({ success: false, error: 'VET ID is required' });
      return;
    }

    const result = await laborActionsService.getVETDetails(vetId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    logger.error('Error in GET /vet/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =============================================
// EMPLOYEE RESPONSES
// =============================================

/**
 * POST /api/labor-actions/vet/respond
 * Employee responds to a VET offer
 */
router.post('/vet/respond', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: RespondToVETRequest = req.body;

    // Validate required fields
    if (!request.labor_action_id) {
      res.status(400).json({ success: false, error: 'labor_action_id is required' });
      return;
    }
    if (!request.employee_id) {
      res.status(400).json({ success: false, error: 'employee_id is required' });
      return;
    }
    if (!request.response_status) {
      res.status(400).json({ success: false, error: 'response_status is required' });
      return;
    }
    if (!['accepted', 'declined'].includes(request.response_status)) {
      res.status(400).json({ 
        success: false, 
        error: 'response_status must be either "accepted" or "declined"' 
      });
      return;
    }

    const result = await laborActionsService.respondToVET(request);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vet/respond:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/vet/response/approve
 * Manager approves/rejects an employee response
 */
router.post('/vet/response/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ApproveVETResponseRequest = req.body;

    // Validate required fields
    if (!request.response_id) {
      res.status(400).json({ success: false, error: 'response_id is required' });
      return;
    }
    if (request.approved === undefined) {
      res.status(400).json({ success: false, error: 'approved field is required' });
      return;
    }
    if (!request.approved_by) {
      res.status(400).json({ success: false, error: 'approved_by is required' });
      return;
    }

    const result = await laborActionsService.approveVETResponse(request);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vet/response/approve:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/vet/:id/responses
 * Get all responses for a specific VET offer
 */
router.get('/vet/:id/responses', async (req: Request, res: Response): Promise<void> => {
  try {
    const vetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!vetId) {
      res.status(400).json({ success: false, error: 'VET ID is required' });
      return;
    }

    // This reuses getVETDetails which includes responses
    const result = await laborActionsService.getVETDetails(vetId);
    
    if (result.success && result.data) {
      res.status(200).json({
        success: true,
        data: result.data.responses || [],
      });
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Error in GET /vet/:id/responses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =============================================
// ELIGIBILITY & VALIDATION
// =============================================

/**
 * POST /api/labor-actions/vet/check-eligibility
 * Check if an employee is eligible for a VET offer
 */
router.post('/vet/check-eligibility', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: VETEligibilityRequest = req.body;

    if (!request.employee_id) {
      res.status(400).json({ success: false, error: 'employee_id is required' });
      return;
    }
    if (!request.labor_action_id) {
      res.status(400).json({ success: false, error: 'labor_action_id is required' });
      return;
    }

    const result = await laborActionsService.checkVETEligibility(request);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vet/check-eligibility:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =============================================
// ANALYTICS & REPORTING
// =============================================

/**
 * GET /api/labor-actions/vet/analytics
 * Get VET analytics for date range
 */
router.get('/vet/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: VETAnalyticsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    // Validate required fields
    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id query parameter is required' });
      return;
    }
    if (!request.date_from) {
      res.status(400).json({ success: false, error: 'date_from query parameter is required' });
      return;
    }
    if (!request.date_to) {
      res.status(400).json({ success: false, error: 'date_to query parameter is required' });
      return;
    }

    const result = await laborActionsService.getVETAnalytics(request);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in GET /vet/analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/vet/active
 * Get all currently active (open) VET offers
 */
router.get('/vet/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const organization_id = req.query.organization_id as string;
    const department_id = req.query.department_id as string;

    if (!organization_id) {
      res.status(400).json({ success: false, error: 'organization_id query parameter is required' });
      return;
    }

    const request: ListVETRequest = {
      organization_id,
      department_id,
      status: 'open',
      limit: 100,
      offset: 0,
    };

    const result = await laborActionsService.listVETOffers(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /vet/active:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =============================================
// HEALTH CHECK
// =============================================

/**
 * GET /api/labor-actions/health
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Labor Actions API is running',
    timestamp: new Date().toISOString(),
  });
});

// =============================================
// WORKFLOW & AUTOMATION
// =============================================

/**
 * POST /api/labor-actions/vet/:id/process
 * Process all pending responses using automated workflow
 */
router.post('/vet/:id/process', async (req: Request, res: Response): Promise<void> => {
  try {
    const vetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { workflow_config, priority_weights, processed_by } = req.body;

    if (!vetId) {
      res.status(400).json({ success: false, error: 'VET ID is required' });
      return;
    }
    if (!processed_by) {
      res.status(400).json({ success: false, error: 'processed_by is required' });
      return;
    }

    const request: ProcessResponsesRequest = {
      labor_action_id: vetId,
      workflow_config,
      priority_weights,
      processed_by,
    };

    const result = await vetAcceptanceWorkflowService.processResponses(request);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vet/:id/process:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/vet/:id/batch-approve
 * Batch approve multiple responses
 */
router.post('/vet/:id/batch-approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const vetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { response_ids, approved_by, notes } = req.body;

    if (!vetId) {
      res.status(400).json({ success: false, error: 'VET ID is required' });
      return;
    }
    if (!response_ids || !Array.isArray(response_ids) || response_ids.length === 0) {
      res.status(400).json({ success: false, error: 'response_ids array is required' });
      return;
    }
    if (!approved_by) {
      res.status(400).json({ success: false, error: 'approved_by is required' });
      return;
    }

    const request: BatchApproveRequest = {
      labor_action_id: vetId,
      response_ids,
      approved_by,
      notes,
    };

    const result = await vetAcceptanceWorkflowService.batchApprove(request);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vet/:id/batch-approve:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/vet/:id/batch-reject
 * Batch reject multiple responses
 */
router.post('/vet/:id/batch-reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const vetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { response_ids, rejected_by, reason } = req.body;

    if (!vetId) {
      res.status(400).json({ success: false, error: 'VET ID is required' });
      return;
    }
    if (!response_ids || !Array.isArray(response_ids) || response_ids.length === 0) {
      res.status(400).json({ success: false, error: 'response_ids array is required' });
      return;
    }
    if (!rejected_by) {
      res.status(400).json({ success: false, error: 'rejected_by is required' });
      return;
    }
    if (!reason) {
      res.status(400).json({ success: false, error: 'reason is required' });
      return;
    }

    const request: BatchRejectRequest = {
      labor_action_id: vetId,
      response_ids,
      rejected_by,
      reason,
    };

    const result = await vetAcceptanceWorkflowService.batchReject(request);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vet/:id/batch-reject:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/vet/:id/workflow-status
 * Get workflow status for VET offer
 */
router.get('/vet/:id/workflow-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const vetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!vetId) {
      res.status(400).json({ success: false, error: 'VET ID is required' });
      return;
    }

    const result = await vetAcceptanceWorkflowService.getWorkflowStatus(vetId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    logger.error('Error in GET /vet/:id/workflow-status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/vet/:id/process-waitlist
 * Process waitlist promotions
 */
router.post('/vet/:id/process-waitlist', async (req: Request, res: Response): Promise<void> => {
  try {
    const vetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { positions_available } = req.body;

    if (!vetId) {
      res.status(400).json({ success: false, error: 'VET ID is required' });
      return;
    }
    if (!positions_available || positions_available < 1) {
      res.status(400).json({ success: false, error: 'positions_available must be at least 1' });
      return;
    }

    const result = await vetAcceptanceWorkflowService.processWaitlist(vetId, positions_available);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in POST /vet/:id/process-waitlist:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =============================================
// VTO OFFER MANAGEMENT
// =============================================

/**
 * POST /api/labor-actions/vto/publish
 * Publish a new VTO offer with safety floor enforcement
 */
router.post('/vto/publish', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: PublishVTOWithOverrideRequest = req.body;

    // Validate required fields
    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.target_date) {
      res.status(400).json({ success: false, error: 'target_date is required' });
      return;
    }
    if (!request.start_time) {
      res.status(400).json({ success: false, error: 'start_time is required' });
      return;
    }
    if (!request.end_time) {
      res.status(400).json({ success: false, error: 'end_time is required' });
      return;
    }
    if (!request.positions_available || request.positions_available < 1) {
      res.status(400).json({ success: false, error: 'positions_available must be at least 1' });
      return;
    }
    if (!request.posted_by) {
      res.status(400).json({ success: false, error: 'posted_by is required' });
      return;
    }

    // Validate override fields if safety floor check is being skipped
    if (request.skip_safety_floor_check) {
      if (!request.override_reason) {
        res.status(400).json({ 
          success: false, 
          error: 'override_reason is required when skip_safety_floor_check is true' 
        });
        return;
      }
      if (!request.override_approved_by) {
        res.status(400).json({ 
          success: false, 
          error: 'override_approved_by is required when skip_safety_floor_check is true' 
        });
        return;
      }
    }

    // Use safety-aware publishing method
    const vtoResult = await laborActionsService.publishVTOWithSafetyCheck(request);
    
    // If safety floor blocked VTO, return 409 Conflict
    if (!vtoResult.success && vtoResult.error?.includes('Safety floor violation')) {
      res.status(409).json(vtoResult);
      return;
    }

    res.status(vtoResult.success ? 201 : 400).json(vtoResult);
  } catch (error) {
    logger.error('Error in POST /vto/publish:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /api/labor-actions/vto/:id
 * Update a VTO offer
 */
router.put('/vto/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const vtoId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const request: UpdateVTORequest = req.body;

    if (!vtoId) {
      res.status(400).json({ success: false, error: 'VTO ID is required' });
      return;
    }

    const result = await laborActionsService.updateVTO(vtoId, request);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in PUT /vto/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/vto/:id
 * Get VTO offer details
 */
router.get('/vto/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const vtoId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!vtoId) {
      res.status(400).json({ success: false, error: 'VTO ID is required' });
      return;
    }

    const result = await laborActionsService.getVTODetails(vtoId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    logger.error('Error in GET /vto/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/vto/:id/close
 * Close a VTO offer
 */
router.post('/vto/:id/close', async (req: Request, res: Response): Promise<void> => {
  try {
    const vtoId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { closed_by } = req.body;

    if (!vtoId) {
      res.status(400).json({ success: false, error: 'VTO ID is required' });
      return;
    }
    if (!closed_by) {
      res.status(400).json({ success: false, error: 'closed_by is required' });
      return;
    }

    const result = await laborActionsService.closeVTO(vtoId, closed_by);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vto/:id/close:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/vto/:id/cancel
 * Cancel a VTO offer
 */
router.post('/vto/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const vtoId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { cancelled_by } = req.body;

    if (!vtoId) {
      res.status(400).json({ success: false, error: 'VTO ID is required' });
      return;
    }
    if (!cancelled_by) {
      res.status(400).json({ success: false, error: 'cancelled_by is required' });
      return;
    }

    const result = await laborActionsService.cancelVTO(vtoId, cancelled_by);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vto/:id/cancel:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/vto/respond
 * Employee responds to VTO offer
 */
router.post('/vto/respond', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: RespondToVTORequest = req.body;

    if (!request.labor_action_id) {
      res.status(400).json({ success: false, error: 'labor_action_id is required' });
      return;
    }
    if (!request.employee_id) {
      res.status(400).json({ success: false, error: 'employee_id is required' });
      return;
    }
    if (!request.response_status || !['accepted', 'declined'].includes(request.response_status)) {
      res.status(400).json({ success: false, error: 'response_status must be "accepted" or "declined"' });
      return;
    }

    const result = await laborActionsService.respondToVTO(request);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    logger.error('Error in POST /vto/respond:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/vto/analytics
 * Get VTO analytics
 */
router.get('/vto/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: VTOAnalyticsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string | undefined,
      date_from: req.query.date_from as string,
      date_to: req.query.date_to as string,
    };

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.date_from) {
      res.status(400).json({ success: false, error: 'date_from is required' });
      return;
    }
    if (!request.date_to) {
      res.status(400).json({ success: false, error: 'date_to is required' });
      return;
    }

    const result = await laborActionsService.getVTOAnalytics(request);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    logger.error('Error in GET /vto/analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/vto/check-safety-floor
 * Check if VTO offer would violate safety floor requirements
 */
router.post('/vto/check-safety-floor', async (req: Request, res: Response): Promise<void> => {
  try {
    const checkRequest: SafetyFloorCheckRequest = req.body;

    // Validate required fields
    if (!checkRequest.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!checkRequest.target_date) {
      res.status(400).json({ success: false, error: 'target_date is required' });
      return;
    }
    if (!checkRequest.start_time) {
      res.status(400).json({ success: false, error: 'start_time is required' });
      return;
    }
    if (!checkRequest.end_time) {
      res.status(400).json({ success: false, error: 'end_time is required' });
      return;
    }
    if (checkRequest.proposed_vto_count === undefined || checkRequest.proposed_vto_count < 1) {
      res.status(400).json({ success: false, error: 'proposed_vto_count must be at least 1' });
      return;
    }

    const safetyResult = await laborActionsService.checkSafetyFloor(checkRequest);
    res.status(200).json({
      success: true,
      data: safetyResult,
    });
  } catch (error) {
    logger.error('Error in POST /vto/check-safety-floor:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =============================================
// PTO REQUEST MANAGEMENT
// =============================================

/**
 * POST /api/labor-actions/pto/request
 * Submit a new PTO request
 */
router.post('/pto/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: RequestPTORequest = req.body;

    // Validate required fields
    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.employee_id) {
      res.status(400).json({ success: false, error: 'employee_id is required' });
      return;
    }
    if (!request.department_id) {
      res.status(400).json({ success: false, error: 'department_id is required' });
      return;
    }
    if (!request.pto_type) {
      res.status(400).json({ success: false, error: 'pto_type is required' });
      return;
    }
    if (!request.start_date) {
      res.status(400).json({ success: false, error: 'start_date is required' });
      return;
    }
    if (!request.end_date) {
      res.status(400).json({ success: false, error: 'end_date is required' });
      return;
    }

    const result = await laborActionsService.requestPTO(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in POST /pto/request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /api/labor-actions/pto/:id
 * Update a pending PTO request
 */
router.put('/pto/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: UpdatePTORequest = {
      request_id: req.params.id as string,
      ...req.body,
    };

    const result = await laborActionsService.updatePTORequest(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in PUT /pto/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/pto/:id/review
 * Approve or deny a PTO request
 */
router.post('/pto/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ReviewPTORequest = {
      request_id: req.params.id as string,
      action: req.body.action,
      reviewed_by: req.body.reviewed_by,
      approval_notes: req.body.approval_notes,
    };

    // Validate action
    if (!request.action || !['approve', 'deny'].includes(request.action)) {
      res.status(400).json({ success: false, error: 'action must be "approve" or "deny"' });
      return;
    }

    if (!request.reviewed_by) {
      res.status(400).json({ success: false, error: 'reviewed_by is required' });
      return;
    }

    const result = await laborActionsService.reviewPTORequest(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in POST /pto/:id/review:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/pto/:id/cancel
 * Cancel a PTO request
 */
router.post('/pto/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: CancelPTORequest = {
      request_id: req.params.id as string,
      employee_id: req.body.employee_id,
      reason: req.body.reason,
    };

    if (!request.employee_id) {
      res.status(400).json({ success: false, error: 'employee_id is required' });
      return;
    }

    const result = await laborActionsService.cancelPTORequest(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in POST /pto/:id/cancel:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/pto
 * List PTO requests
 */
router.get('/pto', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ListPTORequestsRequest = {
      organization_id: req.query.organization_id as string,
      employee_id: req.query.employee_id as string | undefined,
      department_id: req.query.department_id as string | undefined,
      status: req.query.status as any,
      pto_type: req.query.pto_type as any,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }

    const result = await laborActionsService.listPTORequests(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /pto:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/pto/check-availability
 * Check PTO availability and conflicts
 */
router.post('/pto/check-availability', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: CheckPTOAvailabilityRequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.employee_id) {
      res.status(400).json({ success: false, error: 'employee_id is required' });
      return;
    }
    if (!request.department_id) {
      res.status(400).json({ success: false, error: 'department_id is required' });
      return;
    }
    if (!request.start_date) {
      res.status(400).json({ success: false, error: 'start_date is required' });
      return;
    }
    if (!request.end_date) {
      res.status(400).json({ success: false, error: 'end_date is required' });
      return;
    }

    const result = await laborActionsService.checkPTOAvailability(request);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in POST /pto/check-availability:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/pto/balance
 * Get PTO balance for an employee
 */
router.get('/pto/balance', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: GetPTOBalanceRequest = {
      organization_id: req.query.organization_id as string,
      employee_id: req.query.employee_id as string,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      pto_type: req.query.pto_type as any,
    };

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.employee_id) {
      res.status(400).json({ success: false, error: 'employee_id is required' });
      return;
    }

    const result = await laborActionsService.getPTOBalance(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /pto/balance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/pto/analytics
 * Get PTO analytics
 */
router.get('/pto/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: PTOAnalyticsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string | undefined,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      group_by: req.query.group_by as any,
    };

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.start_date) {
      res.status(400).json({ success: false, error: 'start_date is required' });
      return;
    }
    if (!request.end_date) {
      res.status(400).json({ success: false, error: 'end_date is required' });
      return;
    }

    const result = await laborActionsService.getPTOAnalytics(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /pto/analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =============================================
// PTO APPROVAL WORKFLOW
// =============================================

/**
 * POST /api/labor-actions/pto/workflow/process-pending
 * Process pending PTO requests with automated rules
 */
router.post('/pto/workflow/process-pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ProcessPendingPTORequestsRequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }

    const result = await ptoApprovalWorkflowService.processPendingRequests(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in POST /pto/workflow/process-pending:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/pto/workflow/batch-approve
 * Batch approve multiple PTO requests
 */
router.post('/pto/workflow/batch-approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: BatchApprovePTORequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.request_ids || request.request_ids.length === 0) {
      res.status(400).json({ success: false, error: 'request_ids is required and must not be empty' });
      return;
    }
    if (!request.approved_by) {
      res.status(400).json({ success: false, error: 'approved_by is required' });
      return;
    }

    const result = await ptoApprovalWorkflowService.batchApprove(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in POST /pto/workflow/batch-approve:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/pto/workflow/batch-deny
 * Batch deny multiple PTO requests
 */
router.post('/pto/workflow/batch-deny', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: BatchDenyPTORequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.request_ids || request.request_ids.length === 0) {
      res.status(400).json({ success: false, error: 'request_ids is required and must not be empty' });
      return;
    }
    if (!request.denied_by) {
      res.status(400).json({ success: false, error: 'denied_by is required' });
      return;
    }
    if (!request.denial_reason) {
      res.status(400).json({ success: false, error: 'denial_reason is required' });
      return;
    }

    const result = await ptoApprovalWorkflowService.batchDeny(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in POST /pto/workflow/batch-deny:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/pto/workflow/check-auto-approval
 * Check if a PTO request is eligible for auto-approval
 */
router.post('/pto/workflow/check-auto-approval', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: CheckAutoApprovalRequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.employee_id) {
      res.status(400).json({ success: false, error: 'employee_id is required' });
      return;
    }
    if (!request.department_id) {
      res.status(400).json({ success: false, error: 'department_id is required' });
      return;
    }
    if (!request.pto_type) {
      res.status(400).json({ success: false, error: 'pto_type is required' });
      return;
    }
    if (!request.start_date) {
      res.status(400).json({ success: false, error: 'start_date is required' });
      return;
    }
    if (!request.end_date) {
      res.status(400).json({ success: false, error: 'end_date is required' });
      return;
    }

    const result = await ptoApprovalWorkflowService.checkAutoApprovalEligibility(request);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in POST /pto/workflow/check-auto-approval:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/pto/workflow/pending-approvals
 * Get pending approvals for a manager
 */
router.get('/pto/workflow/pending-approvals', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: GetPendingApprovalsRequest = {
      organization_id: req.query.organization_id as string,
      approver_id: req.query.approver_id as string,
      department_id: req.query.department_id as string | undefined,
      include_delegated: req.query.include_delegated === 'true',
    };

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.approver_id) {
      res.status(400).json({ success: false, error: 'approver_id is required' });
      return;
    }

    const result = await ptoApprovalWorkflowService.getPendingApprovals(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /pto/workflow/pending-approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/pto/workflow/delegate
 * Delegate approval authority to another user
 */
router.post('/pto/workflow/delegate', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: DelegateApprovalRequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.delegator_id) {
      res.status(400).json({ success: false, error: 'delegator_id is required' });
      return;
    }
    if (!request.delegate_id) {
      res.status(400).json({ success: false, error: 'delegate_id is required' });
      return;
    }
    if (!request.start_date) {
      res.status(400).json({ success: false, error: 'start_date is required' });
      return;
    }
    if (!request.end_date) {
      res.status(400).json({ success: false, error: 'end_date is required' });
      return;
    }

    const result = await ptoApprovalWorkflowService.delegateApproval(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in POST /pto/workflow/delegate:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/labor-actions/pto/workflow/analytics
 * Get approval workflow analytics
 */
router.get('/pto/workflow/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: PTOApprovalAnalyticsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string | undefined,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
    };

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.start_date) {
      res.status(400).json({ success: false, error: 'start_date is required' });
      return;
    }
    if (!request.end_date) {
      res.status(400).json({ success: false, error: 'end_date is required' });
      return;
    }

    const result = await ptoApprovalWorkflowService.getApprovalAnalytics(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /pto/workflow/analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/labor-actions/pto/workflow/rules
 * Create auto-approval rule
 */
router.post('/pto/workflow/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: CreateApprovalRuleRequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ success: false, error: 'organization_id is required' });
      return;
    }
    if (!request.rule_name) {
      res.status(400).json({ success: false, error: 'rule_name is required' });
      return;
    }
    if (!request.pto_types || request.pto_types.length === 0) {
      res.status(400).json({ success: false, error: 'pto_types is required and must not be empty' });
      return;
    }

    const result = await ptoApprovalWorkflowService.createApprovalRule(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in POST /pto/workflow/rules:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /api/labor-actions/pto/workflow/rules/:id
 * Update auto-approval rule
 */
router.put('/pto/workflow/rules/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: UpdateApprovalRuleRequest = {
      rule_id: req.params.id as string,
      ...req.body,
    };

    const result = await ptoApprovalWorkflowService.updateApprovalRule(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in PUT /pto/workflow/rules/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// =============================================
// UPT (UNPAID TIME) TRACKING ENDPOINTS
// =============================================

/**
 * POST /upt/detect-exceptions
 * Detect attendance exceptions from attendance data
 */
router.post('/upt/detect-exceptions', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('POST /labor-actions/upt/detect-exceptions', { body: req.body });

    const request: DetectExceptionsRequest = req.body;

    // Validate required fields
    if (!request.organization_id) {
      res.status(400).json({
        success: false,
        error: 'organization_id is required',
      });
      return;
    }

    if (!request.start_date || !request.end_date) {
      res.status(400).json({
        success: false,
        error: 'start_date and end_date are required',
      });
      return;
    }

    const result = await uptTrackingService.detectExceptions(request);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in POST /upt/detect-exceptions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /upt/exceptions
 * Record a UPT exception manually
 */
router.post('/upt/exceptions', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('POST /labor-actions/upt/exceptions', { body: req.body });

    const request: RecordExceptionRequest = req.body;

    // Validate required fields
    if (!request.organization_id || !request.employee_id || !request.exception_type || 
        !request.exception_date || !request.occurrence_time || request.minutes_missed === undefined) {
      res.status(400).json({
        success: false,
        error: 'organization_id, employee_id, exception_type, exception_date, occurrence_time, and minutes_missed are required',
      });
      return;
    }

    const result = await uptTrackingService.recordException(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in POST /upt/exceptions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /upt/exceptions/:exception_id/excuse
 * Excuse a UPT exception (refund UPT hours)
 */
router.post('/upt/exceptions/:exception_id/excuse', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('POST /labor-actions/upt/exceptions/:exception_id/excuse', { params: req.params, body: req.body });

    const request: ExcuseExceptionRequest = {
      ...req.body,
      exception_id: req.params.exception_id,
    };

    // Validate required fields
    if (!request.organization_id || !request.excuse_reason || !request.approved_by) {
      res.status(400).json({
        success: false,
        error: 'organization_id, excuse_reason, and approved_by are required',
      });
      return;
    }

    const result = await uptTrackingService.excuseException(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in POST /upt/exceptions/:exception_id/excuse:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /upt/balance
 * Get UPT balance for an employee
 */
router.get('/upt/balance', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('GET /labor-actions/upt/balance', { query: req.query });

    const request: GetUPTBalanceRequest = {
      organization_id: req.query.organization_id as string,
      employee_id: req.query.employee_id as string,
    };

    // Validate required fields
    if (!request.organization_id || !request.employee_id) {
      res.status(400).json({
        success: false,
        error: 'organization_id and employee_id are required',
      });
      return;
    }

    const result = await uptTrackingService.getUPTBalance(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /upt/balance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /upt/exceptions
 * List UPT exceptions with filters
 */
router.get('/upt/exceptions', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('GET /labor-actions/upt/exceptions', { query: req.query });

    const request: ListExceptionsRequest = {
      organization_id: req.query.organization_id as string,
      employee_id: req.query.employee_id as string | undefined,
      department_id: req.query.department_id as string | undefined,
      exception_types: req.query.exception_types ? (req.query.exception_types as string).split(',') as any : undefined,
      severity: req.query.severity as any | undefined,
      is_excused: req.query.is_excused === 'true' ? true : req.query.is_excused === 'false' ? false : undefined,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
      balance_status: req.query.balance_status as any | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      sort_by: req.query.sort_by as any | undefined,
      sort_order: req.query.sort_order as any | undefined,
    };

    // Validate required fields
    if (!request.organization_id) {
      res.status(400).json({
        success: false,
        error: 'organization_id is required',
      });
      return;
    }

    const result = await uptTrackingService.listExceptions(request);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /upt/exceptions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /upt/analytics
 * Get UPT analytics
 */
router.get('/upt/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('GET /labor-actions/upt/analytics', { query: req.query });

    const request: UPTAnalyticsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string | undefined,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      group_by: req.query.group_by as any | undefined,
    };

    // Validate required fields
    if (!request.organization_id || !request.start_date || !request.end_date) {
      res.status(400).json({
        success: false,
        error: 'organization_id, start_date, and end_date are required',
      });
      return;
    }

    const result = await uptTrackingService.getAnalytics(request);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /upt/analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /upt/employees-at-risk
 * Get employees with low UPT balance
 */
router.get('/upt/employees-at-risk', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('GET /labor-actions/upt/employees-at-risk', { query: req.query });

    const request: EmployeesAtRiskRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string | undefined,
      status_filter: req.query.status_filter ? (req.query.status_filter as string).split(',') as any : undefined,
      min_exceptions: req.query.min_exceptions ? parseInt(req.query.min_exceptions as string) : undefined,
      sort_by: req.query.sort_by as any | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    // Validate required fields
    if (!request.organization_id) {
      res.status(400).json({
        success: false,
        error: 'organization_id is required',
      });
      return;
    }

    const result = await uptTrackingService.getEmployeesAtRisk(request);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /upt/employees-at-risk:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /upt/balance/adjust
 * Manually adjust UPT balance (admin override)
 */
router.post('/upt/balance/adjust', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('POST /labor-actions/upt/balance/adjust', { body: req.body });

    const request: AdjustUPTBalanceRequest = req.body;

    // Validate required fields
    if (!request.organization_id || !request.employee_id || request.adjustment_hours === undefined || 
        !request.reason || !request.adjusted_by) {
      res.status(400).json({
        success: false,
        error: 'organization_id, employee_id, adjustment_hours, reason, and adjusted_by are required',
      });
      return;
    }

    const result = await uptTrackingService.adjustBalance(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in POST /upt/balance/adjust:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /upt/policies
 * Create UPT policy
 */
router.post('/upt/policies', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('POST /labor-actions/upt/policies', { body: req.body });

    const request: CreateUPTPolicyRequest = req.body;

    // Validate required fields
    if (!request.organization_id || !request.policy_name || request.initial_upt_hours === undefined ||
        request.warning_threshold_hours === undefined || request.critical_threshold_hours === undefined ||
        request.termination_threshold_hours === undefined || !request.effective_date) {
      res.status(400).json({
        success: false,
        error: 'Required fields: organization_id, policy_name, initial_upt_hours, warning_threshold_hours, critical_threshold_hours, termination_threshold_hours, effective_date',
      });
      return;
    }

    const result = await uptTrackingService.createPolicy(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in POST /upt/policies:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /upt/policies/:policy_id
 * Update UPT policy
 */
router.put('/upt/policies/:policy_id', async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('PUT /labor-actions/upt/policies/:policy_id', { params: req.params, body: req.body });

    const request: UpdateUPTPolicyRequest = {
      ...req.body,
      policy_id: req.params.policy_id,
    };

    const result = await uptTrackingService.updatePolicy(request);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in PUT /upt/policies/:policy_id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export { router };