/**
 * Attendance Snapshot Ingestion API Routes
 * Handles intraday console attendance tracking and analytics
 */

import express, { Request, Response, Router } from 'express';
import { attendanceSnapshotService } from '../services/attendance-snapshot.service';
import { logger } from '../utils/logger';
import type {
  IngestAttendanceSnapshotRequest,
  BatchIngestAttendanceRequest,
  ListAttendanceSnapshotsRequest,
  GetAttendanceTrendRequest,
  AttendanceAnalyticsRequest,
  CreateAttendanceAlertRequest,
} from '../types/attendanceSnapshot';

const router: Router = express.Router();

// ==============================================
// SNAPSHOT INGESTION
// ==============================================

/**
 * POST /api/intraday/attendance/ingest
 * Ingest a single attendance snapshot
 */
router.post('/ingest', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: IngestAttendanceSnapshotRequest = req.body;

    // Validate required fields
    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }
    if (!request.employee_id) {
      res.status(400).json({ error: 'employee_id is required' });
      return;
    }
    if (!request.employee_name) {
      res.status(400).json({ error: 'employee_name is required' });
      return;
    }
    if (!request.snapshot_time) {
      res.status(400).json({ error: 'snapshot_time is required' });
      return;
    }
    if (!request.attendance_status) {
      res.status(400).json({ error: 'attendance_status is required' });
      return;
    }

    const result = await attendanceSnapshotService.ingestSnapshot(request);
    res.status(result.success ? 201 : 409).json(result);
  } catch (error) {
    logger.error('Error in POST /ingest:', error);
    res.status(500).json({
      error: 'Failed to ingest attendance snapshot',
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/intraday/attendance/batch-ingest
 * Batch ingest multiple attendance snapshots
 */
router.post('/batch-ingest', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: BatchIngestAttendanceRequest = req.body;

    if (!request.snapshots || !Array.isArray(request.snapshots)) {
      res.status(400).json({ error: 'snapshots array is required' });
      return;
    }

    if (request.snapshots.length === 0) {
      res.status(400).json({ error: 'snapshots array cannot be empty' });
      return;
    }

    if (request.snapshots.length > 100) {
      res.status(400).json({ error: 'Maximum 100 snapshots per batch' });
      return;
    }

    const result = await attendanceSnapshotService.batchIngestSnapshots(request);
    res.status(result.success ? 201 : 207).json(result);
  } catch (error) {
    logger.error('Error in POST /batch-ingest:', error);
    res.status(500).json({
      error: 'Failed to batch ingest snapshots',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// SNAPSHOT RETRIEVAL
// ==============================================

/**
 * GET /api/intraday/attendance/snapshots
 * List attendance snapshots with filtering
 */
router.get('/snapshots', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ListAttendanceSnapshotsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      site_id: req.query.site_id as string,
      employee_id: req.query.employee_id as string,
      shift_id: req.query.shift_id as string,
      attendance_status: req.query.attendance_status as any,
      is_present: req.query.is_present === 'true' ? true : req.query.is_present === 'false' ? false : undefined,
      is_absent: req.query.is_absent === 'true' ? true : req.query.is_absent === 'false' ? false : undefined,
      is_late: req.query.is_late === 'true' ? true : req.query.is_late === 'false' ? false : undefined,
      start_time: req.query.start_time as string,
      end_time: req.query.end_time as string,
      page: parseInt(req.query.page as string) || 1,
      page_size: parseInt(req.query.page_size as string) || 50,
      sort_by: req.query.sort_by as any,
      sort_order: req.query.sort_order as 'asc' | 'desc',
    };

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    const result = await attendanceSnapshotService.listSnapshots(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /snapshots:', error);
    res.status(500).json({
      error: 'Failed to list snapshots',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/intraday/attendance/trend
 * Get attendance trend data over time
 */
router.get('/trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: GetAttendanceTrendRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      site_id: req.query.site_id as string,
      start_time: req.query.start_time as string,
      end_time: req.query.end_time as string,
      interval: req.query.interval as 'hour' | 'day' | 'week',
    };

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }
    if (!request.start_time) {
      res.status(400).json({ error: 'start_time is required' });
      return;
    }
    if (!request.end_time) {
      res.status(400).json({ error: 'end_time is required' });
      return;
    }

    const result = await attendanceSnapshotService.getAttendanceTrend(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /trend:', error);
    res.status(500).json({
      error: 'Failed to get attendance trend',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// ANALYTICS
// ==============================================

/**
 * GET /api/intraday/attendance/analytics
 * Get comprehensive attendance analytics
 */
router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: AttendanceAnalyticsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      site_id: req.query.site_id as string,
      shift_id: req.query.shift_id as string,
      time_period: req.query.time_period as any,
      start_time: req.query.start_time as string,
      end_time: req.query.end_time as string,
    };

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    const result = await attendanceSnapshotService.getAttendanceAnalytics(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /analytics:', error);
    res.status(500).json({
      error: 'Failed to get analytics',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// ALERTING
// ==============================================

/**
 * POST /api/intraday/attendance/alerts
 * Create an attendance alert rule
 */
router.post('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: CreateAttendanceAlertRequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }
    if (!request.rule_name) {
      res.status(400).json({ error: 'rule_name is required' });
      return;
    }
    if (!request.alert_type) {
      res.status(400).json({ error: 'alert_type is required' });
      return;
    }
    if (request.threshold === undefined || request.threshold === null) {
      res.status(400).json({ error: 'threshold is required' });
      return;
    }

    const result = await attendanceSnapshotService.createAlertRule(request);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in POST /alerts:', error);
    res.status(500).json({
      error: 'Failed to create alert rule',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/intraday/attendance/health
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'healthy',
    service: 'attendance-snapshot-ingestion',
    timestamp: new Date().toISOString(),
  });
});

export default router;
