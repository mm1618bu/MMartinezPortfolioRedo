import { Router } from 'express';
import { demandGridController } from '../controllers/demand-grid.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Grid data endpoints
router.get('/grid', demandGridController.getGridData);
router.get('/grid/summary', demandGridController.getGridSummary);
router.get('/grid/filters', demandGridController.getFilterOptions);

// CRUD operations
router.get('/grid/:id', demandGridController.getDemandById);
router.post('/grid', demandGridController.createDemand);
router.put('/grid/:id', demandGridController.updateDemand);
router.delete('/grid/:id', demandGridController.deleteDemand);

// Bulk operations
router.post('/grid/bulk-delete', demandGridController.bulkDelete);
router.post('/grid/bulk-update', demandGridController.bulkUpdate);

// Export
router.post('/grid/export', demandGridController.exportData);

export default router;
