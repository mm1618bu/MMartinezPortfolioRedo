/**
 * Live KPI API Routes
 * Real-time operational metrics for intraday console
 */

import express, { Request, Response, Router } from 'express';
import { liveKPIService } from '../services/live-kpi.service';
import { logger } from '../utils/logger';
import type {
  ComputeLiveKPIsRequest,
  GetKPIHistoryRequest,
  KPIDashboardRequest,
  CreateKPIAlertRequest,
} from '../types/liveKpi';

const router: Router = express.Router();

// ==============================================
// LIVE KPI COMPUTATION
// ==============================================

/**
 * POST /api/intraday/kpi/compute
 * Compute live KPIs for a queue/department
 */
router.post('/compute', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ComputeLiveKPIsRequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    const result = await liveKPIService.computeLiveKPIs(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in POST /compute:', error);
    res.status(500).json({
      error: 'Failed to compute live KPIs',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/intraday/kpi/compute
 * Compute live KPIs via GET request (query params)
 */
router.get('/compute', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ComputeLiveKPIsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      site_id: req.query.site_id as string,
      queue_name: req.query.queue_name as string,
      as_of_time: req.query.as_of_time as string,
      include_comparison: req.query.include_comparison === 'true',
      comparison_period_minutes: req.query.comparison_period_minutes 
        ? parseInt(req.query.comparison_period_minutes as string)
        : undefined,
    };

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    const result = await liveKPIService.computeLiveKPIs(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /compute:', error);
    res.status(500).json({
      error: 'Failed to compute live KPIs',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// KPI HISTORY
// ==============================================

/**
 * GET /api/intraday/kpi/history
 * Get historical KPI data
 */
router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: GetKPIHistoryRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      site_id: req.query.site_id as string,
      queue_name: req.query.queue_name as string,
      start_time: req.query.start_time as string,
      end_time: req.query.end_time as string,
      interval: req.query.interval as 'minute' | '5min' | '15min' | 'hour',
      metrics: req.query.metrics 
        ? (req.query.metrics as string).split(',') as any[]
        : undefined,
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

    const result = await liveKPIService.getKPIHistory(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /history:', error);
    res.status(500).json({
      error: 'Failed to get KPI history',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// KPI DASHBOARD
// ==============================================

/**
 * GET /api/intraday/kpi/dashboard
 * Get KPI dashboard for multiple queues
 */
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: KPIDashboardRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      site_id: req.query.site_id as string,
      queue_names: req.query.queue_names 
        ? (req.query.queue_names as string).split(',')
        : undefined,
      as_of_time: req.query.as_of_time as string,
    };

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    const result = await liveKPIService.getKPIDashboard(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /dashboard:', error);
    res.status(500).json({
      error: 'Failed to get KPI dashboard',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// ALERT RULES
// ==============================================

/**
 * POST /api/intraday/kpi/alerts
 * Create a KPI alert rule
 */
router.post('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: CreateKPIAlertRequest = req.body;

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
    if (request.threshold_value === undefined) {
      res.status(400).json({ error: 'threshold_value is required' });
      return;
    }

    const result = await liveKPIService.createAlertRule(request);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in POST /alerts:', error);
    res.status(500).json({
      error: 'Failed to create KPI alert rule',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// QUICK METRICS
// ==============================================

/**
 * GET /api/intraday/kpi/quick
 * Get quick KPI summary (lightweight, cached)
 */
router.get('/quick', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.query.organization_id as string;
    const queueName = req.query.queue_name as string;

    if (!organizationId) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    // Return minimal KPI data for quick polling
    const request: ComputeLiveKPIsRequest = {
      organization_id: organizationId,
      queue_name: queueName,
      include_comparison: false,
    };

    const result = await liveKPIService.computeLiveKPIs(request);

    // Return condensed response
    res.status(200).json({
      success: true,
      timestamp: result.snapshot.timestamp,
      health_score: result.snapshot.overall_health_score,
      utilization: result.snapshot.utilization.current_utilization,
      headcount_gap: result.snapshot.headcount_gap.headcount_gap,
      risk_level: result.snapshot.sla_risk.risk_level,
      critical_alerts: result.snapshot.critical_alerts,
    });
  } catch (error) {
    logger.error('Error in GET /quick:', error);
    res.status(500).json({
      error: 'Failed to get quick KPIs',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/intraday/kpi/health
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'healthy',
    service: 'live-kpi-computation',
    timestamp: new Date().toISOString(),
  });
});

export default router;
