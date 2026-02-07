import { Request, Response } from 'express';
import { simulationService } from '../services/simulation.service';
import { logger } from '../utils/logger';

export const simulationController = {
  // ============================================================================
  // Health & Info
  // ============================================================================

  getHealth: async (_req: Request, res: Response) => {
    try {
      const health = await simulationService.getHealth();
      res.json(health);
    } catch (error: any) {
      logger.error('Simulation health check failed:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Failed to check simulation service health',
        details: error.details,
      });
    }
  },

  getStats: async (_req: Request, res: Response) => {
    try {
      const stats = await simulationService.getStats();
      res.json(stats);
    } catch (error: any) {
      logger.error('Failed to get simulation stats:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Failed to get simulation statistics',
        details: error.details,
      });
    }
  },

  getScenarios: async (_req: Request, res: Response) => {
    try {
      const scenarios = await simulationService.getScenarios();
      res.json(scenarios);
    } catch (error: any) {
      logger.error('Failed to get scenarios:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Failed to get available scenarios',
        details: error.details,
      });
    }
  },

  // ============================================================================
  // Productivity Variance
  // ============================================================================

  getProductivityPresets: async (_req: Request, res: Response) => {
    try {
      const presets = await simulationService.getProductivityPresets();
      res.json(presets);
    } catch (error: any) {
      logger.error('Failed to get productivity presets:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Failed to get productivity presets',
        details: error.details,
      });
    }
  },

  getProductivityFactors: async (_req: Request, res: Response) => {
    try {
      const factors = await simulationService.getProductivityFactors();
      res.json(factors);
    } catch (error: any) {
      logger.error('Failed to get productivity factors:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Failed to get productivity factors',
        details: error.details,
      });
    }
  },

  runProductivityQuickAnalysis: async (req: Request, res: Response) => {
    try {
      const {
        scenario,
        days,
        baseline_units_per_hour,
        baseline_staff,
        start_date,
        end_date,
        organization_id,
      } = req.query;

      // Validate required parameters
      if (!scenario || !days || !baseline_units_per_hour || !baseline_staff) {
        return res.status(400).json({
          error: 'Missing required parameters',
          required: ['scenario', 'days', 'baseline_units_per_hour', 'baseline_staff'],
        });
      }

      const result = await simulationService.runProductivityQuickAnalysis({
        scenario: scenario as string,
        days: parseInt(days as string, 10),
        baseline_units_per_hour: parseFloat(baseline_units_per_hour as string),
        baseline_staff: parseInt(baseline_staff as string, 10),
        start_date: start_date as string | undefined,
        end_date: end_date as string | undefined,
        organization_id: organization_id as string | undefined,
      });

      return res.json(result);
    } catch (error: any) {
      logger.error('Productivity quick analysis failed:', error);
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to run productivity quick analysis',
        details: error.details,
      });
    }
  },

  runProductivityVariance: async (req: Request, res: Response) => {
    try {
      const result = await simulationService.runProductivityVariance(req.body);
      res.json(result);
    } catch (error: any) {
      logger.error('Productivity variance simulation failed:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Failed to run productivity variance simulation',
        details: error.details,
      });
    }
  },

  // ============================================================================
  // Backlog Propagation
  // ============================================================================

  getOverflowStrategies: async (_req: Request, res: Response) => {
    try {
      const strategies = await simulationService.getOverflowStrategies();
      res.json(strategies);
    } catch (error: any) {
      logger.error('Failed to get overflow strategies:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Failed to get overflow strategies',
        details: error.details,
      });
    }
  },

  getProfileTemplates: async (_req: Request, res: Response) => {
    try {
      const templates = await simulationService.getProfileTemplates();
      res.json(templates);
    } catch (error: any) {
      logger.error('Failed to get profile templates:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Failed to get profile templates',
        details: error.details,
      });
    }
  },

  runBacklogQuickScenarios: async (req: Request, res: Response) => {
    try {
      const {
        organization_id,
        start_date,
        days,
        daily_demand_count,
        daily_capacity_hours,
        initial_backlog_count,
      } = req.query;

      // Validate required parameters
      if (!organization_id || !start_date || !days || !daily_demand_count || !daily_capacity_hours) {
        return res.status(400).json({
          error: 'Missing required parameters',
          required: [
            'organization_id',
            'start_date',
            'days',
            'daily_demand_count',
            'daily_capacity_hours',
          ],
        });
      }

      const result = await simulationService.runBacklogQuickScenarios({
        organization_id: organization_id as string,
        start_date: start_date as string,
        days: parseInt(days as string, 10),
        daily_demand_count: parseInt(daily_demand_count as string, 10),
        daily_capacity_hours: parseFloat(daily_capacity_hours as string),
        initial_backlog_count: initial_backlog_count
          ? parseInt(initial_backlog_count as string, 10)
          : undefined,
      });

      return res.json(result);
    } catch (error: any) {
      logger.error('Backlog quick scenarios failed:', error);
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to run backlog quick scenarios',
        details: error.details,
      });
    }
  },

  runBacklogPropagation: async (req: Request, res: Response) => {
    try {
      const result = await simulationService.runBacklogPropagation(req.body);
      res.json(result);
    } catch (error: any) {
      logger.error('Backlog propagation simulation failed:', error);
      res.status(error.status || 500).json({
        error: error.message || 'Failed to run backlog propagation simulation',
        details: error.details,
      });
    }
  },
};

// Export both named and default for compatibility
export default simulationController;
