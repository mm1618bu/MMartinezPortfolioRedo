import { Router } from 'express';
import { constraintRuleService, shiftConstraintValidator } from '../services/shift-constraints.service';
import { validate } from '../middleware/validation.middleware';
import {
  createConstraintRuleSchema,
  updateConstraintRuleSchema,
  validateShiftAssignmentSchema,
  validateBatchAssignmentsSchema,
} from '../schemas/shift-constraints.schema';

const router = Router();

// =============================================
// CONSTRAINT RULES ENDPOINTS
// =============================================

/**
 * GET /api/shift-constraints/rules
 * Get all constraint rules with optional filtering
 */
router.get('/rules', async (req, res) => {
  try {
    const rules = await constraintRuleService.getAll({
      organizationId: req.query.organizationId as string,
      departmentId: req.query.departmentId as string,
      constraintType: req.query.constraintType as string,
      isActive: req.query.isActive === 'true',
    });
    return res.json(rules);
  } catch (error: any) {
    console.error('Error fetching constraint rules:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shift-constraints/rules/:id
 * Get single constraint rule
 */
router.get('/rules/:id', async (req, res) => {
  try {
    const rule = await constraintRuleService.getById(String(req.params.id));
    if (!rule) {
      return res.status(404).json({ error: 'Constraint rule not found' });
    }
    return res.json(rule);
  } catch (error: any) {
    console.error('Error fetching constraint rule:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shift-constraints/rules
 * Create new constraint rule
 */
router.post('/rules', validate(createConstraintRuleSchema), async (req, res) => {
  try {
    const rule = await constraintRuleService.create(req.body);
    return res.status(201).json(rule);
  } catch (error: any) {
    console.error('Error creating constraint rule:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/shift-constraints/rules/:id
 * Update constraint rule
 */
router.put('/rules/:id', validate(updateConstraintRuleSchema), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id || '';
    if (!id) {
      return res.status(400).json({ error: 'Rule ID is required' });
    }
    const rule = await constraintRuleService.update(id, req.body);
    return res.json(rule);
  } catch (error: any) {
    console.error('Error updating constraint rule:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/shift-constraints/rules/:id
 * Delete constraint rule
 */
router.delete('/rules/:id', async (req, res) => {
  try {
    await constraintRuleService.delete(String(req.params.id));
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting constraint rule:', error);
    return res.status(400).json({ error: error.message });
  }
});

// =============================================
// SHIFT ASSIGNMENT VALIDATION ENDPOINTS
// =============================================

/**
 * POST /api/shift-constraints/validate
 * Validate single shift assignment
 */
router.post('/validate', validate(validateShiftAssignmentSchema), async (req, res) => {
  try {
    const result = await shiftConstraintValidator.validateAssignment(req.body);
    return res.json(result);
  } catch (error: any) {
    console.error('Error validating assignment:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/shift-constraints/validate-batch
 * Validate multiple shift assignments
 */
router.post('/validate-batch', validate(validateBatchAssignmentsSchema), async (req, res) => {
  try {
    const result = await shiftConstraintValidator.validateBatchAssignments(req.body);
    return res.json(result);
  } catch (error: any) {
    console.error('Error validating batch assignments:', error);
    return res.status(400).json({ error: error.message });
  }
});

export default router;
