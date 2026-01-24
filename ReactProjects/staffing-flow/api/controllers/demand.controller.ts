import { Request, Response } from 'express';
import { demandService } from '../services/demand.service';
import {
  uploadDemandCSVSchema,
  demandQuerySchema,
} from '../schemas/demand.schema';
import { ValidationError } from '../errors';
import { generateCSVTemplate } from '../utils/csv-parser';

export const demandController = {
  /**
   * Get all demand records with optional filtering
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const queryValidation = demandQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters', queryValidation.error.issues);
      }

      const result = await demandService.getAll(queryValidation.data);
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch demands',
        details: error.details,
      });
    }
  },

  /**
   * Get a single demand record by ID
   */
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID parameter' });
      }
      const demand = await demandService.getById(id);

      if (!demand) {
        return res.status(404).json({ error: 'Demand record not found' });
      }

      return res.json(demand);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch demand',
      });
    }
  },

  /**
   * Create a new demand record
   */
  create: async (req: Request, res: Response) => {
    try {
      const demand = await demandService.create(req.body);
      return res.status(201).json(demand);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to create demand',
      });
    }
  },

  /**
   * Update an existing demand record
   */
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID parameter' });
      }
      const demand = await demandService.update(id, req.body);
      return res.json(demand);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update demand',
      });
    }
  },

  /**
   * Delete a demand record
   */
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID parameter' });
      }
      await demandService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete demand',
      });
    }
  },

  /**
   * Upload CSV file with demand data
   */
  uploadCSV: async (req: Request, res: Response) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please upload a CSV file',
        });
      }

      // Validate request body
      const bodyValidation = uploadDemandCSVSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({
          error: 'Invalid request parameters',
          details: bodyValidation.error.issues,
        });
      }

      // Get CSV content from uploaded file
      const csvContent = req.file.buffer.toString('utf-8');

      // Process CSV
      const result = await demandService.uploadCSV(csvContent, bodyValidation.data);

      // Return appropriate status based on success
      const statusCode = result.success ? 200 : 207; // 207 = Multi-Status
      return res.status(statusCode).json(result);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to upload CSV',
        details: error.details,
      });
    }
  },

  /**
   * Download CSV template
   */
  downloadTemplate: async (_req: Request, res: Response) => {
    try {
      const template = generateCSVTemplate();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=demand_template.csv');
      res.send(template);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to generate template',
      });
    }
  },

  /**
   * Get demand statistics
   */
  getStatistics: async (req: Request, res: Response) => {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({
          error: 'organizationId is required',
        });
      }

      const stats = await demandService.getStatistics(
        organizationId,
        startDate as string | undefined,
        endDate as string | undefined
      );

      return res.json(stats);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch statistics',
      });
    }
  },
};
