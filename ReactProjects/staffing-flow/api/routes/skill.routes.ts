import { Router } from 'express';
import { skillController } from '../controllers/skill.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { validateUuidParam } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Skill Routes
// ============================================

// Get all skills
router.get(
  '/',
  authorize(['admin', 'manager', 'viewer']),
  skillController.getAll
);

// Get skill categories
router.get(
  '/categories',
  authorize(['admin', 'manager', 'viewer']),
  skillController.getCategories
);

// Get skill by ID
router.get(
  '/:id',
  authorize(['admin', 'manager', 'viewer']),
  validateUuidParam('id'),
  skillController.getById
);

// Get employees with specific skill
router.get(
  '/:id/employees',
  authorize(['admin', 'manager', 'viewer']),
  validateUuidParam('id'),
  skillController.getEmployeesWithSkill
);

// Create new skill
router.post(
  '/',
  authorize(['admin']),
  skillController.create
);

// Update skill
router.put(
  '/:id',
  authorize(['admin']),
  validateUuidParam('id'),
  skillController.update
);

// Delete skill
router.delete(
  '/:id',
  authorize(['admin']),
  validateUuidParam('id'),
  skillController.delete
);

// ============================================
// Employee Skills Routes
// ============================================

// Get employee's skills
router.get(
  '/employee/:employeeId',
  authorize(['admin', 'manager', 'viewer', 'staff']),
  validateUuidParam('employeeId'),
  skillController.getEmployeeSkills
);

// Add skill to employee
router.post(
  '/employee',
  authorize(['admin', 'manager']),
  skillController.addEmployeeSkill
);

// Update employee skill
router.put(
  '/employee/:id',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  skillController.updateEmployeeSkill
);

// Remove skill from employee
router.delete(
  '/employee/:id',
  authorize(['admin', 'manager']),
  validateUuidParam('id'),
  skillController.removeEmployeeSkill
);

export default router;
