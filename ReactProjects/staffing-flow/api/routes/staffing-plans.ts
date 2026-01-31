import { Router } from 'express';
import { staffingPlanService, staffingPlanAssignmentService } from '../services/staffing-plan.service';
import { createStaffingPlanSchema, updateStaffingPlanSchema, createStaffingPlanAssignmentSchema, updateStaffingPlanAssignmentSchema } from '../schemas/staffing-plan.schema';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// =============================================
// STAFFING PLANS ENDPOINTS
// =============================================

/**
 * GET /api/staffing-plans
 * Get all staffing plans with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query as any;
    const plans = await staffingPlanService.getAll(query);
    res.json(plans);
  } catch (error: any) {
    console.error('Error fetching staffing plans:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/staffing-plans/range/:startDate/:endDate
 * Get staffing plans within a date range
 */
router.get('/range/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const organizationId = req.query.organizationId as string;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const plans = await staffingPlanService.getPlansByDateRange(organizationId, startDate, endDate);
    return res.json(plans);
  } catch (error: any) {
    console.error('Error fetching plans by date range:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/staffing-plans/active/:date
 * Get active staffing plans for a specific date
 */
router.get('/active/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const organizationId = req.query.organizationId as string;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const plans = await staffingPlanService.getActivePlans(organizationId, date);
    return res.json(plans);
  } catch (error: any) {
    console.error('Error fetching active plans:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/staffing-plans/:id
 * Get a single staffing plan by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const plan = await staffingPlanService.getById(req.params.id);
    res.json(plan);
  } catch (error: any) {
    console.error('Error fetching staffing plan:', error);
    res.status(404).json({ error: 'Staffing plan not found' });
  }
});

/**
 * POST /api/staffing-plans
 * Create a new staffing plan
 */
router.post('/', validate(createStaffingPlanSchema), async (req, res) => {
  try {
    const plan = await staffingPlanService.create(req.body);
    return res.status(201).json(plan);
  } catch (error: any) {
    console.error('Error creating staffing plan:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/staffing-plans/:id
 * Update a staffing plan
 */
router.put('/:id', validate(updateStaffingPlanSchema), async (req, res) => {
  try {
    const plan = await staffingPlanService.update(String(req.params.id), req.body);
    return res.json(plan);
  } catch (error: any) {
    console.error('Error updating staffing plan:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/staffing-plans/:id/status
 * Update staffing plan status (with approval tracking)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, approvedBy } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const plan = await staffingPlanService.updateStatus(req.params.id, status, approvedBy);
    return res.json(plan);
  } catch (error: any) {
    console.error('Error updating plan status:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/staffing-plans/:id
 * Delete a staffing plan
 */
router.delete('/:id', async (req, res) => {
  try {
    await staffingPlanService.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting staffing plan:', error);
    res.status(400).json({ error: error.message });
  }
});

// =============================================
// STAFFING PLAN ASSIGNMENTS ENDPOINTS
// =============================================

/**
 * GET /api/staffing-plans/assignments/list
 * Get all assignments with optional filtering
 */
router.get('/assignments/list', async (req, res) => {
  try {
    const query = req.query as any;
    const assignments = await staffingPlanAssignmentService.getAll(query);
    res.json(assignments);
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/staffing-plans/:planId/assignments
 * Get all assignments for a specific plan
 */
router.get('/:planId/assignments', async (req, res) => {
  try {
    const assignments = await staffingPlanAssignmentService.getAllByPlan(req.params.planId);
    res.json(assignments);
  } catch (error: any) {
    console.error('Error fetching plan assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/staffing-plans/assignments/:id
 * Get a single assignment by ID
 */
router.get('/assignments/:id', async (req, res) => {
  try {
    const assignment = await staffingPlanAssignmentService.getById(req.params.id);
    res.json(assignment);
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    res.status(404).json({ error: 'Assignment not found' });
  }
});

/**
 * POST /api/staffing-plans/:planId/assignments
 * Create a new assignment for a plan
 */
router.post('/:planId/assignments', validate(createStaffingPlanAssignmentSchema), async (req, res) => {
  try {
    const data = {
      ...req.body,
      staffing_plan_id: req.params.planId,
    };

    const assignment = await staffingPlanAssignmentService.create(data);
    return res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/staffing-plans/:planId/assignments/bulk
 * Create multiple assignments at once
 */
router.post('/:planId/assignments/bulk', async (req, res) => {
  try {
    const { assignments } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'assignments array is required and must not be empty' });
    }

    // Add planId to each assignment
    const assignmentsWithPlanId = assignments.map(a => ({
      ...a,
      staffing_plan_id: req.params.planId,
    }));

    const created = await staffingPlanAssignmentService.createBulk(assignmentsWithPlanId);
    return res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating bulk assignments:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/staffing-plans/assignments/:id
 * Update an assignment
 */
router.put('/assignments/:id', validate(updateStaffingPlanAssignmentSchema), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id || '';
    if (!id) {
      return res.status(400).json({ error: 'Assignment ID is required' });
    }
    const assignment = await staffingPlanAssignmentService.update(id, req.body);
    return res.json(assignment);
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/staffing-plans/assignments/:id/status
 * Update assignment status (with confirmation tracking)
 */
router.patch('/assignments/:id/status', async (req, res) => {
  try {
    const { status, confirmedBy } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const assignment = await staffingPlanAssignmentService.updateStatus(req.params.id, status, confirmedBy);
    return res.json(assignment);
  } catch (error: any) {
    console.error('Error updating assignment status:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/staffing-plans/assignments/:id
 * Delete an assignment
 */
router.delete('/assignments/:id', async (req, res) => {
  try {
    await staffingPlanAssignmentService.delete(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
