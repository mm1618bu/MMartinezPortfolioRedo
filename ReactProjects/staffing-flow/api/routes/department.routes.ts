import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validate, validateQuery, validateUuidParam } from '../middleware/validation.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentQuerySchema,
} from '../schemas/department.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get(
  '/',
  authorize(['admin', 'manager', 'viewer']),
  validateQuery(departmentQuerySchema),
  departmentController.getAll
);
router.get(
  '/:id',
  authorize(['admin', 'manager', 'viewer']),
  validateUuidParam('id'),
  departmentController.getById
);
router.post(
  '/',
  authorize(['admin']),
  validate(createDepartmentSchema),
  departmentController.create
);
router.put(
  '/:id',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  validate(updateDepartmentSchema),
  departmentController.update
);
router.delete('/:id', authorize(['admin']), validateUuidParam('id'), departmentController.delete);

export default router;
