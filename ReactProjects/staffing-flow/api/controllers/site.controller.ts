import { Request, Response } from 'express';
import { siteService } from '../services/site.service';
import { createSiteSchema, updateSiteSchema, siteQuerySchema } from '../schemas/site.schema';
import { ValidationError } from '../errors';

export const siteController = {
  /**
   * Get all sites with optional filtering
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const queryValidation = siteQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters', queryValidation.error.issues);
      }

      const result = await siteService.getAll(queryValidation.data);
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch sites',
        details: error.details,
      });
    }
  },

  /**
   * Get a single site by ID
   */
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const site = await siteService.getById(id as string);
      
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }
      
      return res.json(site);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch site',
      });
    }
  },

  /**
   * Create a new site
   */
  create: async (req: Request, res: Response) => {
    try {
      const validation = createSiteSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid site data', validation.error.issues);
      }

      const site = await siteService.create(validation.data);
      res.status(201).json(site);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to create site',
        details: error.details,
      });
    }
  },

  /**
   * Update an existing site
   */
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validation = updateSiteSchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new ValidationError('Invalid site data', validation.error.issues);
      }

      const site = await siteService.update(id as string, validation.data);
      res.json(site);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update site',
        details: error.details,
      });
    }
  },

  /**
   * Delete a site
   */
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await siteService.delete(id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete site',
      });
    }
  },

  /**
   * Get site statistics
   */
  getStatistics: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const statistics = await siteService.getStatistics(id as string);
      res.json(statistics);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch site statistics',
      });
    }
  },
};
