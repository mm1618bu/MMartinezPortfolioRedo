/**
 * Alert Rules Engine API Routes
 * Centralized alerting infrastructure endpoints
 */

import express, { Request, Response, Router } from 'express';
import { alertRulesEngineService } from '../services/alert-rules-engine.service';
import { logger } from '../utils/logger';
import type {
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
  ListAlertRulesRequest,
  EvaluateRulesRequest,
  ListAlertsRequest,
  AcknowledgeAlertRequest,
  ResolveAlertRequest,
  AlertAnalyticsRequest,
} from '../types/alertRulesEngine';

const router: Router = express.Router();

// ==============================================
// ALERT RULE MANAGEMENT
// ==============================================

/**
 * POST /api/alerts/rules
 * Create a new alert rule
 */
router.post('/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: CreateAlertRuleRequest = req.body;

    // Validate required fields
    if (!request.rule_name) {
      res.status(400).json({ error: 'rule_name is required' });
      return;
    }
    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }
    if (!request.source) {
      res.status(400).json({ error: 'source is required' });
      return;
    }
    if (!request.alert_type) {
      res.status(400).json({ error: 'alert_type is required' });
      return;
    }
    if (!request.condition) {
      res.status(400).json({ error: 'condition is required' });
      return;
    }
    if (!request.notification_channels || request.notification_channels.length === 0) {
      res.status(400).json({ error: 'notification_channels is required' });
      return;
    }
    if (!request.notification_recipients || request.notification_recipients.length === 0) {
      res.status(400).json({ error: 'notification_recipients is required' });
      return;
    }

    const rule = await alertRulesEngineService.createRule(request);
    res.status(201).json(rule);
  } catch (error) {
    logger.error('Error in POST /rules:', error);
    res.status(500).json({
      error: 'Failed to create alert rule',
      details: (error as Error).message,
    });
  }
});

/**
 * PUT /api/alerts/rules/:ruleId
 * Update an existing alert rule
 */
router.put('/rules/:ruleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: UpdateAlertRuleRequest = {
      rule_id: req.params.ruleId,
      ...req.body,
    };

    const rule = await alertRulesEngineService.updateRule(request);
    res.status(200).json(rule);
  } catch (error) {
    logger.error('Error in PUT /rules/:ruleId:', error);
    res.status(500).json({
      error: 'Failed to update alert rule',
      details: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/alerts/rules/:ruleId
 * Delete an alert rule
 */
router.delete('/rules/:ruleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const ruleId = req.params.ruleId;
    if (!ruleId || Array.isArray(ruleId)) {
      res.status(400).json({ error: 'Invalid ruleId' });
      return;
    }
    await alertRulesEngineService.deleteRule(ruleId);
    res.status(204).send();
  } catch (error) {
    logger.error('Error in DELETE /rules/:ruleId:', error);
    res.status(500).json({
      error: 'Failed to delete alert rule',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/alerts/rules
 * List alert rules
 */
router.get('/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ListAlertRulesRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      source: req.query.source as any,
      enabled: req.query.enabled === 'true',
      severity: req.query.severity ? (req.query.severity as string).split(',') as any[] : undefined,
      page: parseInt(req.query.page as string) || 1,
      page_size: parseInt(req.query.page_size as string) || 50,
    };

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    const result = await alertRulesEngineService.listRules(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /rules:', error);
    res.status(500).json({
      error: 'Failed to list alert rules',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// RULE EVALUATION
// ==============================================

/**
 * POST /api/alerts/evaluate
 * Evaluate alert rules
 */
router.post('/evaluate', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: EvaluateRulesRequest = req.body;

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    const result = await alertRulesEngineService.evaluateRules(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in POST /evaluate:', error);
    res.status(500).json({
      error: 'Failed to evaluate rules',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/alerts/evaluate
 * Evaluate alert rules via GET (for scheduled jobs)
 */
router.get('/evaluate', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: EvaluateRulesRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      queue_name: req.query.queue_name as string,
      source: req.query.source as any,
      force: req.query.force === 'true',
    };

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    const result = await alertRulesEngineService.evaluateRules(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /evaluate:', error);
    res.status(500).json({
      error: 'Failed to evaluate rules',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// ALERT MANAGEMENT
// ==============================================

/**
 * GET /api/alerts
 * List alerts
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: ListAlertsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      queue_name: req.query.queue_name as string,
      status: req.query.status ? (req.query.status as string).split(',') as any[] : undefined,
      severity: req.query.severity ? (req.query.severity as string).split(',') as any[] : undefined,
      source: req.query.source as any,
      start_time: req.query.start_time as string,
      end_time: req.query.end_time as string,
      page: parseInt(req.query.page as string) || 1,
      page_size: parseInt(req.query.page_size as string) || 50,
      sort_by: req.query.sort_by as any,
      sort_order: req.query.sort_order as any,
    };

    if (!request.organization_id) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    const result = await alertRulesEngineService.listAlerts(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /alerts:', error);
    res.status(500).json({
      error: 'Failed to list alerts',
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
router.post('/:alertId/acknowledge', async (req: Request, res: Response): Promise<void> => {
  try {
    const alertId = req.params.alertId;
    if (!alertId || Array.isArray(alertId)) {
      res.status(400).json({ error: 'Invalid alertId' });
      return;
    }
    
    const request: AcknowledgeAlertRequest = {
      alert_id: alertId,
      acknowledged_by: req.body.acknowledged_by,
      notes: req.body.notes,
    };

    if (!request.acknowledged_by) {
      res.status(400).json({ error: 'acknowledged_by is required' });
      return;
    }

    const alert = await alertRulesEngineService.acknowledgeAlert(request);
    res.status(200).json(alert);
  } catch (error) {
    logger.error('Error in POST /:alertId/acknowledge:', error);
    res.status(500).json({
      error: 'Failed to acknowledge alert',
      details: (error as Error).message,
    });
  }
});

/**
 * POST /api/alerts/:alertId/resolve
 * Resolve an alert
 */
router.post('/:alertId/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const alertId = req.params.alertId;
    if (!alertId || Array.isArray(alertId)) {
      res.status(400).json({ error: 'Invalid alertId' });
      return;
    }
    
    const request: ResolveAlertRequest = {
      alert_id: alertId,
      resolved_by: req.body.resolved_by,
      resolution_notes: req.body.resolution_notes,
    };

    if (!request.resolved_by) {
      res.status(400).json({ error: 'resolved_by is required' });
      return;
    }

    const alert = await alertRulesEngineService.resolveAlert(request);
    res.status(200).json(alert);
  } catch (error) {
    logger.error('Error in POST /:alertId/resolve:', error);
    res.status(500).json({
      error: 'Failed to resolve alert',
      details: (error as Error).message,
    });
  }
});

// ==============================================
// ANALYTICS
// ==============================================

/**
 * GET /api/alerts/analytics
 * Get alert analytics
 */
router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: AlertAnalyticsRequest = {
      organization_id: req.query.organization_id as string,
      department_id: req.query.department_id as string,
      start_time: req.query.start_time as string,
      end_time: req.query.end_time as string,
      group_by: req.query.group_by ? (req.query.group_by as string).split(',') as any[] : undefined,
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

    const result = await alertRulesEngineService.getAlertAnalytics(request);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in GET /analytics:', error);
    res.status(500).json({
      error: 'Failed to get alert analytics',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/alerts/summary
 * Get quick alert summary (for dashboard)
 */
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = req.query.organization_id as string;

    if (!organizationId) {
      res.status(400).json({ error: 'organization_id is required' });
      return;
    }

    // Get active alerts count
    const activeResult = await alertRulesEngineService.listAlerts({
      organization_id: organizationId,
      status: ['active'],
      page: 1,
      page_size: 1,
    });

    // Get critical alerts count
    const criticalResult = await alertRulesEngineService.listAlerts({
      organization_id: organizationId,
      severity: ['critical'],
      status: ['active'],
      page: 1,
      page_size: 1,
    });

    // Get unacknowledged count
    const unacknowledgedResult = await alertRulesEngineService.listAlerts({
      organization_id: organizationId,
      status: ['active', 'pending'],
      page: 1,
      page_size: 100,
    });

    const unacknowledged = unacknowledgedResult.alerts.filter(a => !a.acknowledged_at).length;

    res.status(200).json({
      success: true,
      active_alerts: activeResult.total_count,
      critical_alerts: criticalResult.total_count,
      unacknowledged_alerts: unacknowledged,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error in GET /summary:', error);
    res.status(500).json({
      error: 'Failed to get alert summary',
      details: (error as Error).message,
    });
  }
});

/**
 * GET /api/alerts/health
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'healthy',
    service: 'alert-rules-engine',
    timestamp: new Date().toISOString(),
  });
});

export default router;
