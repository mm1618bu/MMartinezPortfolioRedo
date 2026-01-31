import { Router, Request, Response } from 'express';
import { coverageScoringService } from '../services/coverage-scoring.service';
import { z } from 'zod';
import type { CalculateCoverageRequest, CompareSchedulesRequest } from '../../src/types/coverageScore';

const router = Router();

/**
 * Validation schema for coverage calculation request
 */
const calculateCoverageSchema = z.object({
  schedule_id: z.string().optional(),
  organization_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  schedule_result: z.any().optional(),
});

/**
 * Validation schema for schedule comparison
 */
const compareSchedulesSchema = z.object({
  schedule_id_1: z.string(),
  schedule_id_2: z.string(),
  organization_id: z.string().uuid(),
});

/**
 * POST /calculate
 * Calculate coverage metrics for a schedule
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const validated = calculateCoverageSchema.parse(req.body) as CalculateCoverageRequest;

    const metrics = await coverageScoringService.calculateCoverage(validated);

    res.json(metrics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
    } else {
      console.error('Error calculating coverage:', error);
      res.status(500).json({
        error: 'Failed to calculate coverage',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

/**
 * POST /report
 * Generate a comprehensive coverage analysis report
 */
router.post('/report', async (req: Request, res: Response) => {
  try {
    const validated = calculateCoverageSchema.parse(req.body) as CalculateCoverageRequest;

    // First calculate metrics
    const metrics = await coverageScoringService.calculateCoverage(validated);

    // Then generate report
    const report = await coverageScoringService.generateCoverageReport(metrics);

    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
    } else {
      console.error('Error generating coverage report:', error);
      res.status(500).json({
        error: 'Failed to generate coverage report',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

/**
 * POST /compare
 * Compare two schedules and provide recommendation
 */
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const validated = compareSchedulesSchema.parse(req.body) as CompareSchedulesRequest;

    const comparison = await coverageScoringService.compareSchedules(validated);

    res.json(comparison);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
    } else {
      console.error('Error comparing schedules:', error);
      res.status(500).json({
        error: 'Failed to compare schedules',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

/**
 * GET /schedules/:scheduleId/score
 * Get pre-calculated coverage score for a schedule
 */
router.get('/schedules/:scheduleId/score', async (req: Request, res: Response) => {
  try {
    const scheduleId = typeof req.params.scheduleId === 'string' ? req.params.scheduleId : '';
    const orgId = typeof req.query.org_id === 'string' ? req.query.org_id : '';

    if (!orgId) {
      res.status(400).json({ error: 'org_id query parameter is required' });
      return;
    }

    const metrics = await coverageScoringService.calculateCoverage({
      schedule_id: scheduleId,
      organization_id: orgId,
    });

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching coverage score:', error);
    res.status(500).json({
      error: 'Failed to fetch coverage score',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /schedules/:scheduleId/health
 * Get health status and alerts for a schedule
 */
router.get('/schedules/:scheduleId/health', async (req: Request, res: Response) => {
  try {
    const scheduleId = typeof req.params.scheduleId === 'string' ? req.params.scheduleId : '';
    const orgId = typeof req.query.org_id === 'string' ? req.query.org_id : '';

    if (!orgId) {
      res.status(400).json({ error: 'org_id query parameter is required' });
      return;
    }

    // Calculate metrics
    const metrics = await coverageScoringService.calculateCoverage({
      schedule_id: scheduleId,
      organization_id: orgId,
    });

    // Generate full report
    const report = await coverageScoringService.generateCoverageReport(metrics);

    // Return health status
    res.json({
      schedule_id: scheduleId,
      health_status: report.health_status,
      overall_score: metrics.overall_coverage_score,
      coverage_percentage: metrics.coverage_percentage,
      alerts: report.alerts,
      recommendations: report.recommendations,
    });
  } catch (error) {
    console.error('Error fetching schedule health:', error);
    res.status(500).json({
      error: 'Failed to fetch schedule health',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
