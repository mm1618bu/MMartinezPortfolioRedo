/**
 * Simulation Routes
 * API routes for workforce simulation operations
 */

import { Router } from 'express';
import simulationController from '../controllers/simulation.controller';
// import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes (optional - uncomment for production)
// router.use(authenticate);

// ============================================================================
// Health & Info Endpoints
// ============================================================================

router.get('/health', simulationController.getHealth);
router.get('/stats', simulationController.getStats);
router.get('/scenarios', simulationController.getScenarios);

// ============================================================================
// Productivity Variance Endpoints
// ============================================================================

router.get('/productivity/presets', simulationController.getProductivityPresets);
router.get('/productivity/factors', simulationController.getProductivityFactors);
router.post('/productivity/quick-analysis', simulationController.runProductivityQuickAnalysis);
router.post('/productivity/variance', simulationController.runProductivityVariance);

// ============================================================================
// Backlog Propagation Endpoints
// ============================================================================

router.get('/backlog/overflow-strategies', simulationController.getOverflowStrategies);
router.get('/backlog/profile-templates', simulationController.getProfileTemplates);
router.post('/backlog/quick-scenarios', simulationController.runBacklogQuickScenarios);
router.post('/backlog/propagate', simulationController.runBacklogPropagation);

export default router;
