import { Request, Response } from 'express';
import { scheduleService } from '../services/schedule.service';
import { handleError } from '../utils/error-handler';

export const scheduleController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const { organizationId, departmentId, startDate, endDate } = req.query;
      const schedules = await scheduleService.getAll({
        organizationId: organizationId as string | undefined,
        departmentId: departmentId as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });
      res.json(schedules);
    } catch (error) {
      handleError(res, error);
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const schedule = await scheduleService.getById(id as string);
      if (!schedule) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }
      res.json(schedule);
    } catch (error) {
      handleError(res, error);
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const schedule = await scheduleService.create(data);
      res.status(201).json(schedule);
    } catch (error) {
      handleError(res, error);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const schedule = await scheduleService.update(id as string, data);
      if (!schedule) {
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }
      res.json(schedule);
    } catch (error) {
      handleError(res, error);
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await scheduleService.delete(id as string);
      res.status(204).send();
    } catch (error) {
      handleError(res, error);
    }
  },

  assignShift: async (req: Request, res: Response) => {
    try {
      const { employeeId, shiftTemplateId, shiftDate } = req.body;
      const assignment = await scheduleService.assignShift({
        employeeId,
        shiftTemplateId,
        shiftDate,
      });
      res.status(201).json(assignment);
    } catch (error) {
      handleError(res, error);
    }
  },

  bulkAssign: async (req: Request, res: Response) => {
    try {
      const { assignments } = req.body;
      const result = await scheduleService.bulkAssign(assignments);
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  },
};
