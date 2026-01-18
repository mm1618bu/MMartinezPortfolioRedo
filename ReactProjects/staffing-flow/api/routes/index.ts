import { Router } from 'express';
import healthRoutes from './health.routes';
import staffRoutes from './staff.routes';
import scheduleRoutes from './schedule.routes';
import departmentRoutes from './department.routes';
import authRoutes from './auth.routes';

const router = Router();

// Register all routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/departments', departmentRoutes);

export default router;
