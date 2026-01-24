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

export default router;
