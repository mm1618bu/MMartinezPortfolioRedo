import { Router } from 'express';
import { shiftTemplateController } from '../controllers/shift-template.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateUuidParam } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all shift templates
router.get(
  '/',
  authorize(['admin', 'manager', 'viewer']),
  shiftTemplateController.getAll
);

// Get shift templates by time range
router.get(
  '/time-range',
  authorize(['admin', 'manager', 'viewer']),
  shiftTemplateController.getByTimeRange
);

// Get shift template by ID
router.get(
  '/:id',
  authorize(['admin', 'manager', 'viewer']),
  validateUuidParam('id'),
  shiftTemplateController.getById
);

// Get shift assignments for template
router.get(
  '/:id/assignments',
  authorize(['admin', 'manager', 'viewer']),
  validateUuidParam('id'),
  shiftTemplateController.getAssignments
);

// Find eligible employees for shift template
router.get(
  '/:id/eligible-employees',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  shiftTemplateController.findEligibleEmployees
);

// Duplicate shift template
router.post(
  '/:id/duplicate',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  shiftTemplateController.duplicate
);

// Create new shift template
router.post(
  '/',
  authorize(['admin', 'manager']),
  shiftTemplateController.create
);

// Update shift template
router.put(
  '/:id',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  shiftTemplateController.update
);

// Delete shift template
router.delete(
  '/:id',
  authorize(['admin']),
  validateUuidParam('id'),
  shiftTemplateController.delete
);

export default router;
