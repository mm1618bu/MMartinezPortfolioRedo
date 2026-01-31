/**
 * Backlog Snapshot Ingestion API Routes
 * Handles intraday console backlog tracking and analytics
 */

import express, { Request, Response, Router } from 'express';
import { backlogSnapshotService } from '../services/backlog-snapshot.service';
import { logger } from '../utils/logger';
import type {
  IngestBacklogSnapshotRequest,
  BatchIngestBacklogRequest,
  ListBacklogSnapshotsRequest,
  GetBacklogTrendRequest,
  BacklogAnalyticsRequest,
  CreateBacklogAlertRequest,
} from '../types/backlogSnapshot';

const router: Router = express.Router();

// ==============================================
// SNAPSHOT INGESTION
// ==============================================

/**
 * POST /api/intraday/backlog/ingest
 * Ingest a single backlog snapshot
 */
router.post('/ingest', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: IngestBacklogSnapshotRequest = req.body;

    // Validate required fields
    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }
    if (!request.queue_name) {
      res.status(400).json({ error: 'queue_name is required' });
      return;
    }
    if (!request.snapshot_time) {
      res.status(400).json({ error: 'snapshot_time is required' });
      return;
    }

    const result = await backlogSnapshotService.ingestSnapshot(request);
    res.status(result.success ? 201 : 409).json(result);
  } catch (error) {
    logger.error('Error in POST /ingest:', error);
    res.status(500).json({
      error: 'Failed to ingest backlog snapshot',
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/intraday/backlog/batch-ingest
 * Batch ingest multiple backlog snapshots
 */
router.post('/batch-ingest', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: BatchIngestBacklogRequest = req.body;

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

    const result = await backlogSnapshotService.batchIngestSnapshots(request);
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
 * GET /api/intraday/backlog/snapshots
 * List backlog snapshots with filtering
 */
router.get('/snapshots', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ListBacklogSnapshotsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      site_id: req.query.site_id as string,
      queue_name: req.query.queue_name as string,
      start_time: req.query.start_time as string,
      end_time: req.query.end_time as string,
      page: parseInt(req.query.page as string) || 1,
      page_size: parseInt(req.query.page_size as string) || 50,
      sort_by: req.query.sort_by as 'snapshot_time' | 'total_items' | 'avg_wait_time_minutes',
      sort_order: req.query.sort_order as 'asc' | 'desc',
    };

    const result = await backlogSnapshotService.listSnapshots(request);
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
 * GET /api/intraday/backlog/trend
 * Get backlog trend data over time
 */
router.get('/trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: GetBacklogTrendRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      queue_name: req.query.queue_name as string,
      start_time: req.query.start_time as string,
      end_time: req.query.end_time as string,
      interval: req.query.interval as 'hour' | '15min' | '5min',
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

    const result = await backlogSnapshotService.getBacklogTrend(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /trend:', error);
    res.status(500).json({
      error: 'Failed to get backlog trend',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// ANALYTICS
// ==============================================

/**
 * GET /api/intraday/backlog/analytics
 * Get comprehensive backlog analytics
 */
router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: BacklogAnalyticsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      queue_name: req.query.queue_name as string,
      time_period: req.query.time_period as 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'custom',
      start_time: req.query.start_time as string,
      end_time: req.query.end_time as string,
    };

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    const result = await backlogSnapshotService.getBacklogAnalytics(request);
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
 * POST /api/intraday/backlog/alerts
 * Create a backlog alert rule
 */
router.post('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: CreateBacklogAlertRequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }
    if (!request.queue_name) {
      res.status(400).json({ error: 'queue_name is required' });
      return;
    }
    if (!request.alert_type) {
      res.status(400).json({ error: 'alert_type is required' });
      return;
    }

    const result = await backlogSnapshotService.createAlertRule(request);
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
 * GET /api/intraday/backlog/health
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'healthy',
    service: 'backlog-snapshot-ingestion',
    timestamp: new Date().toISOString(),
  });
});

export default router;
