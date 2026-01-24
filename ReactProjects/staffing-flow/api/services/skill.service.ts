import { supabase } from '../lib/supabase';
import { CreateSkillInput, UpdateSkillInput, SkillQueryInput, CreateEmployeeSkillInput, UpdateEmployeeSkillInput } from '../schemas/skill.schema';
import { DatabaseError } from '../errors';

export const skillService = {
  /**
   * Get all skills with optional filtering
   */
  getAll: async (query: SkillQueryInput = {}) => {
    let dbQuery = supabase.from('skills').select('*', { count: 'exact' });

    if (query.organizationId) {
      dbQuery = dbQuery.eq('organization_id', query.organizationId);
    }

    if (query.category) {
      dbQuery = dbQuery.eq('category', query.category);
    }

    if (query.isActive !== undefined) {
      dbQuery = dbQuery.eq('is_active', query.isActive === 'true');
    }

    if (query.search) {
      dbQuery = dbQuery.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    dbQuery = dbQuery.range(from, to).order('name', { ascending: true });

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new DatabaseError(`Failed to fetch skills: ${error.message}`);
    }

    return {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },

  /**
   * Get a single skill by ID
   */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch skill: ${error.message}`);
    }

    return data;
  },

  /**
   * Create a new skill
   */
  create: async (skillData: CreateSkillInput) => {
    const { data, error } = await supabase
      .from('skills')
      .insert({
        ...skillData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create skill: ${error.message}`);
    }

    return data;
  },

  /**
   * Update an existing skill
   */
  update: async (id: string, skillData: UpdateSkillInput) => {
    const { data, error } = await supabase
      .from('skills')
      .update({
        ...skillData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update skill: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete a skill
   */
  delete: async (id: string) => {
    const { error } = await supabase.from('skills').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete skill: ${error.message}`);
    }
  },

  /**
   * Get all categories
   */
  getCategories: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('skills')
      .select('category')
      .eq('organization_id', organizationId)
      .not('category', 'is', null)
      .order('category');

    if (error) {
      throw new DatabaseError(`Failed to fetch categories: ${error.message}`);
    }

    // Get unique categories
    const categories = [...new Set(data.map((item) => item.category))];
    return categories;
  },

  // ============================================
  // Employee Skills Management
  // ============================================

  /**
   * Get all skills for an employee
   */
  getEmployeeSkills: async (employeeId: string) => {
    const { data, error } = await supabase
      .from('employee_skills')
      .select('*, skill:skills(*)')
      .eq('employee_id', employeeId)
      .order('acquired_date', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch employee skills: ${error.message}`);
    }

    return data;
  },

  /**
   * Add a skill to an employee
   */
  addEmployeeSkill: async (employeeSkillData: CreateEmployeeSkillInput) => {
    const { data, error } = await supabase
      .from('employee_skills')
      .insert({
        ...employeeSkillData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*, skill:skills(*)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to add employee skill: ${error.message}`);
    }

    return data;
  },

  /**
   * Update an employee's skill proficiency
   */
  updateEmployeeSkill: async (id: string, employeeSkillData: UpdateEmployeeSkillInput) => {
    const { data, error } = await supabase
      .from('employee_skills')
      .update({
        ...employeeSkillData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, skill:skills(*)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update employee skill: ${error.message}`);
    }

    return data;
  },

  /**
   * Remove a skill from an employee
   */
  removeEmployeeSkill: async (id: string) => {
    const { error } = await supabase.from('employee_skills').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to remove employee skill: ${error.message}`);
    }
  },

  /**
   * Get all employees with a specific skill
   */
  getEmployeesWithSkill: async (skillId: string, organizationId: string) => {
    const { data, error } = await supabase
      .from('employee_skills')
      .select('*, employee:employees!inner(id, first_name, last_name, email, department_id)')
      .eq('skill_id', skillId)
      .eq('employee.organization_id', organizationId)
      .order('proficiency_level', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch employees with skill: ${error.message}`);
    }

    return data;
  },
};
