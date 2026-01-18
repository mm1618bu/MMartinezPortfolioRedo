import { Request, Response } from 'express';
import { staffService } from '../services/staff.service';
import { handleError } from '../utils/error-handler';

export const staffController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const { organizationId, departmentId, status } = req.query;
      const staff = await staffService.getAll({
        organizationId: organizationId as string | undefined,
        departmentId: departmentId as string | undefined,
        status: status as string | undefined,
      });
      res.json(staff);
    } catch (error) {
      handleError(res, error);
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const staff = await staffService.getById(id as string);
      if (!staff) {
        res.status(404).json({ error: 'Staff member not found' });
        return;
      }
      res.json(staff);
    } catch (error) {
      handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const staff = await staffService.create(data);
      res.status(201).json(staff);
    } catch (error) {
      handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const staff = await staffService.update(id as string, data);
      if (!staff) {
        res.status(404).json({ error: 'Staff member not found' });
        return;
      }
      res.json(staff);
    } catch (error) {
      handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await staffService.delete(id as string);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  },

  importCSV: async (req: Request, res: Response) => {
    try {
      const { data, organizationId } = req.body;
      const result = await staffService.importCSV(data, organizationId);
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  },
};
