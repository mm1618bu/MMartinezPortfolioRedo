import { Router, Request, Response } from 'express';
import { scheduleGenerationService } from '../services/schedule-generation.service';
import { z } from 'zod';
import type {
  ScheduleGenerationRequest,
  ShiftTemplate,
  EmployeeAvailability,
} from '../types/scheduleGeneration';

const router = Router();

/**
 * Validation schema for schedule generation request
 */
const scheduleGenerationSchema = z.object({
  organization_id: z.string().uuid(),
  department_id: z.string().uuid(),
  shifts: z.array(
    z.object({
      shift_id: z.string(),
      shift_type: z.string(),
      department_id: z.string().uuid(),
      organization_id: z.string().uuid(),
      assignment_date: z.string().date(),
      shift_start_time: z.string().regex(/^\d{2}:\d{2}$/),
      shift_end_time: z.string().regex(/^\d{2}:\d{2}$/),
      required_role: z.string().optional(),
      required_skill: z.string().optional(),
      min_staffing: z.number().int().positive().optional(),
      max_staffing: z.number().int().positive().optional(),
      priority: z.enum(['critical', 'high', 'normal', 'low']).optional(),
    })
  ),
  employees: z.array(
    z.object({
      employee_id: z.string().uuid(),
      employee_name: z.string(),
      role: z.string(),
      available_dates: z.array(z.string().date()),
      unavailable_dates: z.array(z.string().date()).optional(),
      max_shifts_per_week: z.number().int().positive().optional(),
      preferred_shift_types: z.array(z.string()).optional(),
      skills: z.array(z.string()).optional(),
    })
  ),
  strategy: z.enum(['greedy', 'balanced', 'skills_first']).optional(),
  max_soft_violations: z.number().int().nonnegative().optional(),
  allow_hard_overrides: z.boolean().optional(),
});

/**
 * POST /generate
 * Generate a new schedule using greedy algorithm
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const validated = scheduleGenerationSchema.parse(req.body) as ScheduleGenerationRequest;

    const result = await scheduleGenerationService.generateSchedule(validated);

    // Optionally save to database
    try {
      await scheduleGenerationService.saveSchedule(result);
    } catch (saveError) {
      console.warn('Failed to persist schedule, returning result anyway:', saveError);
    }

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
    } else {
      console.error('Error generating schedule:', error);
      res.status(500).json({
        error: 'Failed to generate schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

/**
 * GET /schedules/:scheduleId
 * Retrieve a previously generated schedule
 */
router.get('/schedules/:scheduleId', async (req: Request, res: Response) => {
  try {
    const scheduleId = typeof req.params.scheduleId === 'string' ? req.params.scheduleId : '';

    const schedule = await scheduleGenerationService.getSchedule(scheduleId);

    if (!schedule) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error retrieving schedule:', error);
    res.status(500).json({
      error: 'Failed to retrieve schedule',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /schedules
 * List recent generated schedules for an organization
 */
router.get('/schedules', async (req: Request, res: Response) => {
  try {
    const { organization_id, limit } = req.query;

    if (!organization_id || typeof organization_id !== 'string') {
      res.status(400).json({ error: 'organization_id query parameter is required' });
      return;
    }

    const schedules = await scheduleGenerationService.listSchedules(
      organization_id,
      limit ? parseInt(limit as string, 10) : 10
    );

    res.json(schedules);
  } catch (error) {
    console.error('Error listing schedules:', error);
    res.status(500).json({
      error: 'Failed to list schedules',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /validate
 * Validate a schedule generation request without generating
 * Returns metrics and estimated outcomes
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const validated = scheduleGenerationSchema.parse(req.body) as ScheduleGenerationRequest;

    // Quick validation checks
    const metrics = {
      total_shifts: validated.shifts.length,
      total_employees: validated.employees.length,
      shifts_per_employee: validated.shifts.length / validated.employees.length,
      date_range: {
        start: validated.shifts.reduce((min, s) => (s.assignment_date < min ? s.assignment_date : min), '9999-12-31'),
        end: validated.shifts.reduce((max, s) => (s.assignment_date > max ? s.assignment_date : max), '0000-01-01'),
      },
      employee_coverage: calculateCoverageEstimate(validated.shifts, validated.employees),
      potential_issues: validateScheduleRequest(validated),
    };

    res.json(metrics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
    } else {
      console.error('Error validating schedule:', error);
      res.status(500).json({
        error: 'Failed to validate schedule',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

/**
 * Helper: Calculate estimated coverage percentage
 */
function calculateCoverageEstimate(shifts: ShiftTemplate[], employees: EmployeeAvailability[]): {
  estimated_coverage: number;
  critical_shifts_coverage: number;
} {
  if (shifts.length === 0) {
    return { estimated_coverage: 100, critical_shifts_coverage: 100 };
  }

  const criticalShifts = shifts.filter(s => s.priority === 'critical').length;
  const criticalCoverage = criticalShifts > 0 ? Math.min(100, (employees.length / (criticalShifts / 0.7)) * 100) : 100;

  const estimatedCoverage = Math.min(100, (employees.length / shifts.length) * 100);

  return {
    estimated_coverage: Math.round(estimatedCoverage * 100) / 100,
    critical_shifts_coverage: Math.round(criticalCoverage * 100) / 100,
  };
}

/**
 * Helper: Validate schedule request and return potential issues
 */
function validateScheduleRequest(request: ScheduleGenerationRequest): string[] {
  const issues: string[] = [];

  if (request.shifts.length === 0) {
    issues.push('No shifts provided');
  }

  if (request.employees.length === 0) {
    issues.push('No employees provided');
  }

  if (request.employees.length > 0 && request.shifts.length > 0) {
    const ratio = request.shifts.length / request.employees.length;
    if (ratio > 5) {
      issues.push(`High shift-to-employee ratio (${ratio.toFixed(1)}:1) - may struggle to cover all shifts`);
    }
  }

  // Check for shifts with no potentially available employees
  for (const shift of request.shifts) {
    const potentialEmployees = request.employees.filter(emp =>
      emp.available_dates.includes(shift.assignment_date) &&
      !emp.unavailable_dates?.includes(shift.assignment_date)
    );

    if (potentialEmployees.length === 0) {
      issues.push(`No available employees for shift on ${shift.assignment_date}`);
    }

    if (shift.required_skill) {
      const requiredSkill = shift.required_skill;
      const skillMatch = potentialEmployees.filter(emp => emp.skills?.includes(requiredSkill));
      if (skillMatch.length === 0) {
        issues.push(`No employees with required skill "${requiredSkill}" available for ${shift.assignment_date}`);
      }
    }
  }

  return issues;
}

export default router;
