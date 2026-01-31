import { Router } from 'express';
import healthRoutes from './health.routes';
import staffRoutes from './staff.routes';
import scheduleRoutes from './schedule.routes';
import departmentRoutes from './department.routes';
import authRoutes from './auth.routes';
import siteRoutes from './site.routes';
import skillRoutes from './skill.routes';
import laborStandardRoutes from './labor-standard.routes';
import shiftTemplateRoutes from './shift-template.routes';
import demandRoutes from './demand.routes';
import demandGridRoutes from './demand-grid.routes';
import staffingBufferRoutes from './staffing-buffers';
import slaWindowRoutes from './sla-windows';
import staffingPlanRoutes from './staffing-plans';
import shiftConstraintRoutes from './shift-constraints';
import scheduleGenerationRoutes from './schedule-generation';
import coverageScoringRoutes from './coverage-scoring';
import scheduleAPIRoutes from './schedule-api';

const router = Router();

// Register all routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/departments', departmentRoutes);
router.use('/sites', siteRoutes);
router.use('/skills', skillRoutes);
router.use('/labor-standards', laborStandardRoutes);
router.use('/shift-templates', shiftTemplateRoutes);
router.use('/demands', demandRoutes);
router.use('/demands', demandGridRoutes); // Grid-specific endpoints
router.use('/staffing-buffers', staffingBufferRoutes);
router.use('/sla-windows', slaWindowRoutes);
router.use('/staffing-plans', staffingPlanRoutes);
router.use('/shift-constraints', shiftConstraintRoutes);
router.use('/schedule-generation', scheduleGenerationRoutes);
router.use('/coverage-scoring', coverageScoringRoutes);
router.use('/schedules-api', scheduleAPIRoutes);

export default router;
