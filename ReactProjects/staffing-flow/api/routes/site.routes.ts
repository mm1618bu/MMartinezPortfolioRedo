import { Router } from 'express';
import { siteController } from '../controllers/site.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateUuidParam } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all sites
router.get(
  '/',
  authorize(['admin', 'manager', 'viewer']),
  siteController.getAll
);

// Get site by ID
router.get(
  '/:id',
  authorize(['admin', 'manager', 'viewer']),
  validateUuidParam('id'),
  siteController.getById
);

// Get site statistics
router.get(
  '/:id/statistics',
  authorize(['admin', 'manager', 'viewer']),
  validateUuidParam('id'),
  siteController.getStatistics
);

// Create new site
router.post(
  '/',
  authorize(['admin']),
  siteController.create
);

// Update site
router.put(
  '/:id',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  siteController.update
);

// Delete site
router.delete(
  '/:id',
  authorize(['admin']),
  validateUuidParam('id'),
  siteController.delete
);

export default router;
