import { Request, Response } from 'express';
import { demandGridService } from '../services/demand-grid.service';
import {
  demandGridQuerySchema,
  bulkDeleteSchema,
  bulkUpdateSchema,
  exportSchema,
} from '../schemas/demand-grid.schema';
import { demandRecordSchema } from '../schemas/demand.schema';
import { DemandValidator, DemandErrorFormatter, DemandWarning } from '../utils/demand-validation';

export const demandGridController = {
  /**
   * Get grid data with advanced filtering and pagination
   */
  getGridData: async (req: Request, res: Response) => {
    try {
      const queryValidation = demandGridQuerySchema.safeParse(req.query);

      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: queryValidation.error.issues,
        });
      }

      const result = await demandGridService.getGridData(queryValidation.data);
      return res.json(result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch grid data',
        details: error.details,
      });
    }
  },

  /**
   * Get a single demand by ID
   */
  getDemandById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { organizationId } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID parameter' });
      }

      if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const demand = await demandGridService.getDemandById(id, organizationId);
      return res.json(demand);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch demand',
      });
    }
  },

  /**
   * Create a new demand
   */
  createDemand: async (req: Request, res: Response) => {
    try {
      // Validate with Zod schema
      const validation = demandRecordSchema.safeParse(req.body);

      if (!validation.success) {
        const errors = DemandErrorFormatter.formatZodError(validation.error);
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }

      // Perform business rule validation
      const businessValidation = DemandValidator.validateDemandRecord({
        date: validation.data.date,
        required_employees: validation.data.required_employees,
        shift_type: validation.data.shift_type,
        start_time: validation.data.start_time,
        end_time: validation.data.end_time,
      });

      if (!businessValidation.isValid) {
        return res.status(400).json({
          error: 'Business rule validation failed',
          details: businessValidation.errors,
          warnings: businessValidation.warnings,
        });
      }

      const demand = await demandGridService.createDemand(validation.data);

      return res.status(201).json({
        data: demand,
        warnings: businessValidation.warnings.length > 0 ? businessValidation.warnings : undefined,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to create demand',
      });
    }
  },

  /**
   * Update an existing demand
   */
  updateDemand: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { organizationId, ...updateData } = req.body;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID parameter' });
      }

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Validate update data
      const validation = demandRecordSchema.partial().safeParse(updateData);

      if (!validation.success) {
        const errors = DemandErrorFormatter.formatZodError(validation.error);
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }

      // Business rule validation if date/time/employees are being updated
      let warnings: DemandWarning[] = [];
      if (
        updateData.date ||
        updateData.required_employees ||
        updateData.start_time ||
        updateData.end_time
      ) {
        const businessValidation = DemandValidator.validateDemandRecord({
          date: updateData.date || '2026-01-01', // Placeholder if not updating
          required_employees: updateData.required_employees || 1,
          shift_type: updateData.shift_type,
          start_time: updateData.start_time,
          end_time: updateData.end_time,
        });

        if (!businessValidation.isValid) {
          return res.status(400).json({
            error: 'Business rule validation failed',
            details: businessValidation.errors,
          });
        }

        warnings = businessValidation.warnings;
      }

      const demand = await demandGridService.updateDemand(id, organizationId, validation.data);

      return res.json({
        data: demand,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update demand',
      });
    }
  },

  /**
   * Delete a demand
   */
  deleteDemand: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { organizationId } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID parameter' });
      }

      if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      await demandGridService.deleteDemand(id, organizationId);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete demand',
      });
    }
  },

  /**
   * Bulk delete demands
   */
  bulkDelete: async (req: Request, res: Response) => {
    try {
      const validation = bulkDeleteSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request',
          details: validation.error.issues,
        });
      }

      const result = await demandGridService.bulkDelete(validation.data);
      return res.json(result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to bulk delete',
      });
    }
  },

  /**
   * Bulk update demands
   */
  bulkUpdate: async (req: Request, res: Response) => {
    try {
      const validation = bulkUpdateSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request',
          details: validation.error.issues,
        });
      }

      const result = await demandGridService.bulkUpdate(validation.data);
      return res.json(result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to bulk update',
      });
    }
  },

  /**
   * Export grid data
   */
  exportData: async (req: Request, res: Response) => {
    try {
      const validation = exportSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid export request',
          details: validation.error.issues,
        });
      }

      const result = await demandGridService.exportData(validation.data);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

      return res.send(result.data);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to export data',
      });
    }
  },

  /**
   * Get grid summary statistics
   */
  getGridSummary: async (req: Request, res: Response) => {
    try {
      const { organizationId, ...filters } = req.query;

      if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const summary = await demandGridService.getGridSummary(organizationId, filters);
      return res.json(summary);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch summary',
      });
    }
  },

  /**
   * Get filter options for dropdowns
   */
  getFilterOptions: async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.query;

      if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const options = await demandGridService.getFilterOptions(organizationId);
      return res.json(options);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch filter options',
      });
    }
  },
};
