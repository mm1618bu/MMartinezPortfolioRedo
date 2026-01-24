import { Request, Response } from 'express';
import { skillService } from '../services/skill.service';
import { 
  createSkillSchema, 
  updateSkillSchema, 
  skillQuerySchema,
  createEmployeeSkillSchema,
  updateEmployeeSkillSchema
} from '../schemas/skill.schema';
import { ValidationError } from '../errors';

export const skillController = {
  /**
   * Get all skills with optional filtering
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const queryValidation = skillQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters', queryValidation.error.issues);
      }

      const result = await skillService.getAll(queryValidation.data);
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch skills',
        details: error.details,
      });
    }
  },

  /**
   * Get a single skill by ID
   */
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const skill = await skillService.getById(id as string);
      
      if (!skill) {
        return res.status(404).json({ error: 'Skill not found' });
      }
      
      return res.json(skill);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch skill',
      });
    }
  },

  /**
   * Create a new skill
   */
  create: async (req: Request, res: Response) => {
    try {
      const validation = createSkillSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid skill data', validation.error.issues);
      }

      const skill = await skillService.create(validation.data);
      res.status(201).json(skill);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to create skill',
        details: error.details,
      });
    }
  },

  /**
   * Update an existing skill
   */
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validation = updateSkillSchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new ValidationError('Invalid skill data', validation.error.issues);
      }

      const skill = await skillService.update(id as string, validation.data);
      res.json(skill);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update skill',
        details: error.details,
      });
    }
  },

  /**
   * Delete a skill
   */
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await skillService.delete(id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to delete skill',
      });
    }
  },

  /**
   * Get all skill categories
   */
  getCategories: async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.query;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }

      const categories = await skillService.getCategories(organizationId as string);
      return res.json({ categories });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch skill categories',
      });
    }
  },

  // ============================================
  // Employee Skills Endpoints
  // ============================================

  /**
   * Get all skills for an employee
   */
  getEmployeeSkills: async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const skills = await skillService.getEmployeeSkills(employeeId as string);
      res.json(skills);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch employee skills',
      });
    }
  },

  /**
   * Add a skill to an employee
   */
  addEmployeeSkill: async (req: Request, res: Response) => {
    try {
      const validation = createEmployeeSkillSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError('Invalid employee skill data', validation.error.issues);
      }

      const employeeSkill = await skillService.addEmployeeSkill(validation.data);
      res.status(201).json(employeeSkill);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to add employee skill',
        details: error.details,
      });
    }
  },

  /**
   * Update an employee's skill proficiency
   */
  updateEmployeeSkill: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validation = updateEmployeeSkillSchema.safeParse(req.body);
      
      if (!validation.success) {
        throw new ValidationError('Invalid employee skill data', validation.error.issues);
      }

      const employeeSkill = await skillService.updateEmployeeSkill(id as string, validation.data);
      res.json(employeeSkill);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to update employee skill',
        details: error.details,
      });
    }
  },

  /**
   * Remove a skill from an employee
   */
  removeEmployeeSkill: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await skillService.removeEmployeeSkill(id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to remove employee skill',
      });
    }
  },

  /**
   * Get all employees with a specific skill
   */
  getEmployeesWithSkill: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { organizationId } = req.query;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }

      const employees = await skillService.getEmployeesWithSkill(id as string, organizationId as string);
      return res.json(employees);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Failed to fetch employees with skill',
      });
    }
  },
};
