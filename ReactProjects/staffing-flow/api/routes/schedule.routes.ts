import { Router } from 'express';
import { scheduleController } from '../controllers/schedule.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate, validateQuery, validateUuidParam } from '../middleware/validation.middleware';
import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleQuerySchema,
  assignShiftSchema,
  bulkAssignSchema,
} from '../schemas/schedule.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get(
  '/',
  authorize(['admin', 'manager', 'viewer']),
  validateQuery(scheduleQuerySchema),
  scheduleController.getAll
);
router.get(
  '/:id',
  authorize(['admin', 'manager', 'viewer']),
  validateUuidParam('id'),
  scheduleController.getById
);
router.post(
  '/',
  authorize(['admin', 'manager']),
  validate(createScheduleSchema),
  scheduleController.create
);
router.put(
  '/:id',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  validate(updateScheduleSchema),
  scheduleController.update
);
router.delete('/:id', authorize(['admin']), validateUuidParam('id'), scheduleController.delete);

// Additional schedule operations
router.post(
  '/assign',
  authorize(['admin', 'manager']),
  validate(assignShiftSchema),
  scheduleController.assignShift
);
router.post(
  '/bulk-assign',
  authorize(['admin', 'manager']),
  validate(bulkAssignSchema),
  scheduleController.bulkAssign
);

export default router;
