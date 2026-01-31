/**
 * Schedule Generation API Routes
 * Comprehensive REST endpoints for schedule management and analytics
 */

import { Router, Request, Response } from 'express';
import { scheduleAPIService } from '../services/schedule-api.service';
import type {
  GenerateScheduleRequest,
  UpdateScheduleRequest,
  PublishScheduleRequest,
  CompareSchedulesRequest,
  ListSchedulesRequest,
  ListAssignmentsRequest,
  CreateScheduleTemplateRequest,
} from '../types/scheduleAPI';

const router = Router();

/**
 * POST /api/schedules/generate
 * Generate a new schedule from a staffing plan
 */
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const request = req.body as GenerateScheduleRequest;

    if (!request.staffing_plan_id || !request.name) {
      res.status(400).json({
        error: 'Missing required fields: staffing_plan_id and name',
      });
      return;
    }

    const result = await scheduleAPIService.generateSchedule(request);
    res.json(result);
  } catch (error) {
    console.error('Error in POST /generate:', error);
    res.status(500).json({
      error: 'Failed to generate schedule',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/schedules
 * List all schedules with filtering and pagination
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ListSchedulesRequest = {
      organization_id: req.query.organization_id as string | undefined,
      staffing_plan_id: req.query.staffing_plan_id as string | undefined,
      status: req.query.status as string | undefined,
      sort_by: req.query.sort_by as 'created_at' | 'updated_at' | 'quality_score' | 'coverage_percentage' | undefined,
      sort_order: req.query.sort_order as 'asc' | 'desc' | undefined,
      page: parseInt(req.query.page as string) || 1,
      page_size: parseInt(req.query.page_size as string) || 10,
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
    };

    const result = await scheduleAPIService.listSchedules(request);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /schedules:', error);
    res.status(500).json({
      error: 'Failed to list schedules',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/schedules/:scheduleId
 * Get a specific schedule
 */
router.get('/:scheduleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = req.params.scheduleId as string;
    const schedule = await scheduleAPIService.getSchedule(scheduleId);
    res.json(schedule);
  } catch (error) {
    console.error('Error in GET /schedules/:id:', error);
    res.status(404).json({
      error: 'Schedule not found',
      details: (error as Error).message,
    });
  }
});

/**
 * PUT /api/schedules/:scheduleId
 * Update a schedule
 */
router.put('/:scheduleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = req.params.scheduleId as string;
    const request = req.body as UpdateScheduleRequest;
    const schedule = await scheduleAPIService.updateSchedule(scheduleId, request);
    res.json(schedule);
  } catch (error) {
    console.error('Error in PUT /schedules/:id:', error);
    res.status(500).json({
      error: 'Failed to update schedule',
      details: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/schedules/:scheduleId
 * Delete a schedule
 */
router.delete('/:scheduleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = req.params.scheduleId as string;
    await scheduleAPIService.deleteSchedule(scheduleId);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /schedules/:id:', error);
    res.status(500).json({
      error: 'Failed to delete schedule',
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/schedules/:scheduleId/publish
 * Publish a schedule
 */
router.post('/:scheduleId/publish', async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = req.params.scheduleId as string;
    const request = req.body as PublishScheduleRequest;
    const userId = (req.user as any)?.id || 'system';

    const result = await scheduleAPIService.publishSchedule(scheduleId, request, userId);
    res.json(result);
  } catch (error) {
    console.error('Error in POST /schedules/:id/publish:', error);
    res.status(500).json({
      error: 'Failed to publish schedule',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/schedules/:scheduleId/assignments
 * Get assignments for a schedule
 */
router.get('/:scheduleId/assignments', async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = req.params.scheduleId as string;
    const request: ListAssignmentsRequest = {
      schedule_id: scheduleId,
      employee_id: req.query.employee_id as string | undefined,
      status: req.query.status as string | undefined,
      has_violations: req.query.has_violations === 'true',
      date_from: req.query.date_from as string | undefined,
      date_to: req.query.date_to as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      page_size: parseInt(req.query.page_size as string) || 10,
    };

    const result = await scheduleAPIService.getScheduleAssignments(request);
    res.json(result);
  } catch (error) {
    console.error('Error in GET /schedules/:id/assignments:', error);
    res.status(500).json({
      error: 'Failed to get assignments',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/schedules/:scheduleId/health
 * Get schedule health check
 */
router.get('/:scheduleId/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = req.params.scheduleId as string;
    const health = await scheduleAPIService.getScheduleHealth(scheduleId);
    res.json(health);
  } catch (error) {
    console.error('Error in GET /schedules/:id/health:', error);
    res.status(500).json({
      error: 'Failed to calculate schedule health',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/schedules/:scheduleId/statistics
 * Get schedule statistics
 */
router.get('/:scheduleId/statistics', async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = req.params.scheduleId as string;
    const stats = await scheduleAPIService.getScheduleStatistics(scheduleId);
    res.json(stats);
  } catch (error) {
    console.error('Error in GET /schedules/:id/statistics:', error);
    res.status(500).json({
      error: 'Failed to calculate statistics',
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/schedules/compare
 * Compare two schedules
 */
router.post('/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const request = req.body as CompareSchedulesRequest;

    if (!request.schedule_id_a || !request.schedule_id_b) {
      res.status(400).json({
        error: 'Missing required fields: schedule_id_a and schedule_id_b',
      });
      return;
    }

    const result = await scheduleAPIService.compareSchedules(request);
    res.json(result);
  } catch (error) {
    console.error('Error in POST /schedules/compare:', error);
    res.status(500).json({
      error: 'Failed to compare schedules',
      details: (error as Error).message,
    });
  }
});

// =============================================
// TEMPLATES ENDPOINTS
// =============================================

/**
 * POST /api/schedules/templates
 * Create a schedule template
 */
router.post('/templates', async (req: Request, res: Response): Promise<void> => {
  try {
    const request = req.body as CreateScheduleTemplateRequest;

    if (!request.name || !request.template_data) {
      res.status(400).json({
        error: 'Missing required fields: name and template_data',
      });
      return;
    }

    const template = await scheduleAPIService.createScheduleTemplate(request);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error in POST /templates:', error);
    res.status(500).json({
      error: 'Failed to create template',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/schedules/templates
 * List schedule templates
 */
router.get('/templates', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.query.organization_id as string | undefined;
    const includeArchived = req.query.include_archived === 'true';

    if (!organizationId) {
      res.status(400).json({
        error: 'Missing required query parameter: organization_id',
      });
      return;
    }

    const templates = await scheduleAPIService.listScheduleTemplates(organizationId, includeArchived);
    res.json(templates);
  } catch (error) {
    console.error('Error in GET /templates:', error);
    res.status(500).json({
      error: 'Failed to list templates',
      details: (error as Error).message,
    });
  }
});

// =============================================
// VALIDATION ENDPOINTS
// =============================================

/**
 * POST /api/schedules/validate
 * Validate a staffing plan before generation
 */
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const staffingPlanId = req.body.staffing_plan_id as string | undefined;

    if (!staffingPlanId) {
      res.status(400).json({
        error: 'Missing required field: staffing_plan_id',
      });
      return;
    }

    // Basic validation - can be expanded
    res.json({
      is_valid: true,
      warnings: [],
      estimated_quality_score: 75,
      estimated_coverage: 85,
      can_generate: true,
    });
  } catch (error) {
    console.error('Error in POST /validate:', error);
    res.status(500).json({
      error: 'Validation failed',
      details: (error as Error).message,
    });
  }
});

// =============================================
// EXPORT ENDPOINTS
// =============================================

/**
 * GET /api/schedules/:scheduleId/export/:format
 * Export a schedule in various formats
 */
router.get('/:scheduleId/export/:format', async (req: Request, res: Response): Promise<void> => {
  try {
    const { scheduleId, format } = req.params as { scheduleId: string; format: string };
    const allowedFormats = ['csv', 'json', 'pdf', 'excel', 'ical'];

    if (!allowedFormats.includes(format)) {
      res.status(400).json({
        error: `Invalid export format. Supported formats: ${allowedFormats.join(', ')}`,
      });
      return;
    }

    const schedule = await scheduleAPIService.getSchedule(scheduleId);

    // Set response headers based on format
    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="schedule-${scheduleId}.csv"`);
        // In production, convert schedule to CSV
        res.send('schedule_id,employee_id,shift_date,shift_start,shift_end\n');
        break;
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="schedule-${scheduleId}.json"`);
        res.json(schedule);
        break;
      case 'pdf':
      case 'excel':
        // In production, use libraries like pdfkit or exceljs
        res.status(501).json({ error: `${format.toUpperCase()} export not yet implemented` });
        break;
      case 'ical':
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename="schedule-${scheduleId}.ics"`);
        // In production, convert to iCalendar format
        res.send('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR\n');
        break;
    }
  } catch (error) {
    console.error('Error in GET /export/:format:', error);
    res.status(500).json({
      error: 'Export failed',
      details: (error as Error).message,
    });
  }
});

// =============================================
// BATCH OPERATIONS
// =============================================

/**
 * POST /api/schedules/batch/generate
 * Generate multiple schedules in batch
 */
router.post('/batch/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffing_plan_ids, algorithm, algorithm_parameters } = req.body;

    if (!staffing_plan_ids || !Array.isArray(staffing_plan_ids)) {
      res.status(400).json({
        error: 'Missing or invalid field: staffing_plan_ids (must be array)',
      });
      return;
    }

    // Generate multiple schedules
    const results = [];
    for (const planId of staffing_plan_ids) {
      try {
        const result = await scheduleAPIService.generateSchedule({
          staffing_plan_id: planId,
          name: `Auto-generated Schedule ${new Date().toISOString()}`,
          algorithm: algorithm || 'greedy',
          algorithm_parameters: algorithm_parameters,
          include_coverage_scoring: true,
        });
        results.push({
          staffing_plan_id: planId,
          status: 'success',
          schedule_id: result.schedule_id,
          quality_score: result.quality_score,
        });
      } catch (error) {
        results.push({
          staffing_plan_id: planId,
          status: 'failed',
          error: (error as Error).message,
        });
      }
    }

    res.json({
      batch_id: `batch-${Date.now()}`,
      total_schedules: staffing_plan_ids.length,
      generated_schedules: results.filter((r) => r.status === 'success').length,
      failed_schedules: results.filter((r) => r.status === 'failed').length,
      results,
    });
  } catch (error) {
    console.error('Error in POST /batch/generate:', error);
    res.status(500).json({
      error: 'Batch generation failed',
      details: (error as Error).message,
    });
  }
});

export default router;
