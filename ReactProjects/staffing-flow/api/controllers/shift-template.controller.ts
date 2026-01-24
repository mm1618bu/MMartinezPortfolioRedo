import { Request, Response } from 'express';
import { shiftTemplateService } from '../services/shift-template.service';
import { 
  createShiftTemplateSchema, 
  updateShiftTemplateSchema, 
  shiftTemplateQuerySchema 
} from '../schemas/shift-template.schema';
import { ValidationError } from '../errors';

export const shiftTemplateController = {
  /**
   * Get all shift templates with optional filtering
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const queryValidation = shiftTemplateQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters', queryValidation.error.issues);
      }

      const result = await shiftTemplateService.getAll(queryValidation.data);
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch shift templates',
        details: error.details,
      });
    }
  },

  /**
   * Get a single shift template by ID
   */
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const shiftTemplate = await shiftTemplateService.getById(id as string);
      
      if (!shiftTemplate) {
        return res.status(404).json({ error: 'Shift template not found' });
      }
      
      return res.json(shiftTemplate);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch shift template',
      });
    }
  },

  /**
   * Create a new shift template
   */
  create: async (req: Request, res: Response) => {
    try {
      const validation = createShiftTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid shift template data', validation.error.issues);
      }

      const shiftTemplate = await shiftTemplateService.create(validation.data);
      res.status(201).json(shiftTemplate);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to create shift template',
        details: error.details,
      });
    }
  },

  /**
   * Update an existing shift template
   */
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validation = updateShiftTemplateSchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new ValidationError('Invalid shift template data', validation.error.issues);
      }

      const shiftTemplate = await shiftTemplateService.update(id as string, validation.data);
      res.json(shiftTemplate);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update shift template',
        details: error.details,
      });
    }
  },

  /**
   * Delete a shift template
   */
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await shiftTemplateService.delete(id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete shift template',
      });
    }
  },

  /**
   * Duplicate a shift template
   */
  duplicate: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newName } = req.body;

      if (!newName) {
        return res.status(400).json({ error: 'New name is required for duplication' });
      }

      const shiftTemplate = await shiftTemplateService.duplicate(id as string, newName);
      return res.status(201).json(shiftTemplate);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to duplicate shift template',
      });
    }
  },

  /**
   * Get shift templates by time range
   */
  getByTimeRange: async (req: Request, res: Response) => {
    try {
      const { organizationId, startTime, endTime } = req.query;

      if (!organizationId || !startTime || !endTime) {
        return res.status(400).json({ 
          error: 'Organization ID, start time, and end time are required' 
        });
      }

      const templates = await shiftTemplateService.getByTimeRange(
        organizationId as string,
        startTime as string,
        endTime as string
      );

      return res.json(templates);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch shift templates by time range',
      });
    }
  },

  /**
   * Get shift assignments using this template
   */
  getAssignments: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const assignments = await shiftTemplateService.getAssignments(
        id as string,
        startDate as string | undefined,
        endDate as string | undefined
      );

      res.json(assignments);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch shift assignments',
      });
    }
  },

  /**
   * Find employees eligible for shift template
   */
  findEligibleEmployees: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { organizationId } = req.query;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }

      const employees = await shiftTemplateService.findEligibleEmployees(
        id as string,
        organizationId as string
      );

      return res.json(employees);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch eligible employees',
      });
    }
  },
};
