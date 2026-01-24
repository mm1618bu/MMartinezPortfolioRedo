import { Router } from 'express';
import { laborStandardController } from '../controllers/labor-standard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateUuidParam } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all labor standards
router.get(
  '/',
  authorize(['admin', 'manager', 'viewer']),
  laborStandardController.getAll
);

// Get active labor standard
router.get(
  '/active',
  authorize(['admin', 'manager', 'viewer']),
  laborStandardController.getActiveStandard
);

// Get task types
router.get(
  '/task-types',
  authorize(['admin', 'manager', 'viewer']),
  laborStandardController.getTaskTypes
);

// Get labor standard by ID
router.get(
  '/:id',
  authorize(['admin', 'manager', 'viewer']),
  validateUuidParam('id'),
  laborStandardController.getById
);

// Calculate productivity
router.post(
  '/:id/calculate-productivity',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  laborStandardController.calculateProductivity
);

// Create new labor standard
router.post(
  '/',
  authorize(['admin']),
  laborStandardController.create
);

// Update labor standard
router.put(
  '/:id',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  laborStandardController.update
);

// Delete labor standard
router.delete(
  '/:id',
  authorize(['admin']),
  validateUuidParam('id'),
  laborStandardController.delete
);

export default router;
