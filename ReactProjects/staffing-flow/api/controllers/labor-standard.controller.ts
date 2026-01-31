import { Request, Response } from 'express';
import { laborStandardService } from '../services/labor-standard.service';
import { 
  createLaborStandardSchema, 
  updateLaborStandardSchema, 
  laborStandardQuerySchema 
} from '../schemas/labor-standard.schema';
import { ValidationError } from '../errors';

export const laborStandardController = {
  /**
   * Get all labor standards with optional filtering
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const query = (req as any).validatedQuery || req.query || {};
      const result = await laborStandardService.getAll(query);
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch labor standards',
        details: error.details,
      });
    }
  },

  /**
   * Get a single labor standard by ID
   */
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const laborStandard = await laborStandardService.getById(id as string);
      
      if (!laborStandard) {
        return res.status(404).json({ error: 'Labor standard not found' });
      }
      
      return res.json(laborStandard);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch labor standard',
      });
    }
  },

  /**
   * Create a new labor standard
   */
  create: async (req: Request, res: Response) => {
    try {
      const validation = createLaborStandardSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid labor standard data', validation.error.issues);
      }

      const laborStandard = await laborStandardService.create(validation.data);
      res.status(201).json(laborStandard);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to create labor standard',
        details: error.details,
      });
    }
  },

  /**
   * Update an existing labor standard
   */
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validation = updateLaborStandardSchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new ValidationError('Invalid labor standard data', validation.error.issues);
      }

      const laborStandard = await laborStandardService.update(id as string, validation.data);
      res.json(laborStandard);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update labor standard',
        details: error.details,
      });
    }
  },

  /**
   * Delete a labor standard
   */
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await laborStandardService.delete(id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete labor standard',
      });
    }
  },

  /**
   * Get active labor standard for a specific task type and date
   */
  getActiveStandard: async (req: Request, res: Response) => {
    try {
      const { taskType, departmentId, effectiveDate } = req.query;
      
      if (!taskType || !departmentId || !effectiveDate) {
        return res.status(400).json({ 
          error: 'Task type, department ID, and effective date are required' 
        });
      }

      const standard = await laborStandardService.getActiveStandard(
        taskType as string,
        departmentId as string,
        effectiveDate as string
      );

      if (!standard) {
        return res.status(404).json({ error: 'No active labor standard found' });
      }

      return res.json(standard);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch active labor standard',
      });
    }
  },

  /**
   * Get all task types
   */
  getTaskTypes: async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.query;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }

      const taskTypes = await laborStandardService.getTaskTypes(organizationId as string);
      return res.json({ taskTypes });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch task types',
      });
    }
  },

  /**
   * Calculate productivity based on a standard
   */
  calculateProductivity: async (req: Request, res: Response) => {
    try {
      const { standardId } = req.params;
      const { actualUnits, actualHours } = req.body;

      if (!actualUnits || !actualHours) {
        return res.status(400).json({ 
          error: 'Actual units and actual hours are required' 
        });
      }

      const productivity = await laborStandardService.calculateProductivity(
        standardId as string,
        Number(actualUnits),
        Number(actualHours)
      );

      return res.json(productivity);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to calculate productivity',
      });
    }
  },
};
