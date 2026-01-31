import { Request, Response } from 'express';
import { departmentService } from '../services/department.service';
import { handleError } from '../utils/error-handler';

export const departmentController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const validatedQuery = (req as any).validatedQuery || req.query;
      const { organizationId } = validatedQuery;
      const departments = await departmentService.getAll(organizationId as string | undefined);
      res.json(departments);
    } catch (error) {
      handleError(res, error);
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const validatedParams = (req as any).validatedParams || req.params;
      const { id } = validatedParams;
      const department = await departmentService.getById(id as string);
      if (!department) {
        res.status(404).json({ error: 'Department not found' });
        return;
      }
      res.json(department);
    } catch (error) {
      handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const department = await departmentService.create(data);
      res.status(201).json(department);
    } catch (error) {
      handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const department = await departmentService.update(id as string, data);
      if (!department) {
        res.status(404).json({ error: 'Department not found' });
        return;
      }
      res.json(department);
    } catch (error) {
      handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await departmentService.delete(id as string);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  },
};
