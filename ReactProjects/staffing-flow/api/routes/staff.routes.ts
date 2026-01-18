import { Router } from 'express';
import { staffController } from '../controllers/staff.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate, validateQuery, validateUuidParam } from '../middleware/validation.middleware';
import {
  createStaffSchema,
  updateStaffSchema,
  staffQuerySchema,
  importStaffSchema,
} from '../schemas/staff.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get(
  '/',
  authorize(['admin', 'manager', 'viewer']),
  validateQuery(staffQuerySchema),
  staffController.getAll
);
router.get(
  '/:id',
  authorize(['admin', 'manager', 'viewer']),
  validateUuidParam('id'),
  staffController.getById
);
router.post(
  '/',
  authorize(['admin', 'manager']),
  validate(createStaffSchema),
  staffController.create
);
router.put(
  '/:id',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  validate(updateStaffSchema),
  staffController.update
);
router.delete('/:id', authorize(['admin']), validateUuidParam('id'), staffController.delete);

// Bulk operations
router.post(
  '/import',
  authorize(['admin', 'manager']),
  validate(importStaffSchema),
  staffController.importCSV
);

export default router;
