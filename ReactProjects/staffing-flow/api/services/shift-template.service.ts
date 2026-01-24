import { supabase } from '../lib/supabase';
import { CreateShiftTemplateInput, UpdateShiftTemplateInput, ShiftTemplateQueryInput } from '../schemas/shift-template.schema';
import { DatabaseError } from '../errors';

export const shiftTemplateService = {
  /**
   * Get all shift templates with optional filtering
   */
  getAll: async (query: ShiftTemplateQueryInput = {}) => {
    let dbQuery = supabase
      .from('shift_templates')
      .select('*, department:departments(id, name)', { count: 'exact' });

    if (query.organizationId) {
      dbQuery = dbQuery.eq('organization_id', query.organizationId);
    }

    if (query.departmentId) {
      dbQuery = dbQuery.eq('department_id', query.departmentId);
    }

    if (query.shiftType) {
      dbQuery = dbQuery.eq('shift_type', query.shiftType);
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
      throw new DatabaseError(`Failed to fetch shift templates: ${error.message}`);
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
   * Get a single shift template by ID
   */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('shift_templates')
      .select('*, department:departments(id, name)')
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to fetch shift template: ${error.message}`);
    }

    // Fetch required skills if present
    if (data.required_skills && data.required_skills.length > 0) {
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, category')
        .in('id', data.required_skills);

      if (!skillsError) {
        data.skills = skillsData;
      }
    }

    // Fetch required certifications if present
    if (data.required_certifications && data.required_certifications.length > 0) {
      const { data: certsData, error: certsError } = await supabase
        .from('certifications')
        .select('id, name')
        .in('id', data.required_certifications);

      if (!certsError) {
        data.certifications = certsData;
      }
    }

    return data;
  },

  /**
   * Create a new shift template
   */
  create: async (shiftTemplateData: CreateShiftTemplateInput) => {
    const { data, error } = await supabase
      .from('shift_templates')
      .insert({
        ...shiftTemplateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*, department:departments(id, name)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create shift template: ${error.message}`);
    }

    return data;
  },

  /**
   * Update an existing shift template
   */
  update: async (id: string, shiftTemplateData: UpdateShiftTemplateInput) => {
    const { data, error } = await supabase
      .from('shift_templates')
      .update({
        ...shiftTemplateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, department:departments(id, name)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update shift template: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete a shift template
   */
  delete: async (id: string) => {
    const { error } = await supabase.from('shift_templates').delete().eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete shift template: ${error.message}`);
    }
  },

  /**
   * Duplicate a shift template
   */
  duplicate: async (id: string, newName: string) => {
    const original = await shiftTemplateService.getById(id);

    if (!original) {
      throw new DatabaseError('Shift template not found');
    }

    // Remove fields that shouldn't be duplicated
    const { id: _id, created_at, updated_at, skills, certifications, ...templateData } = original;

    const { data, error } = await supabase
      .from('shift_templates')
      .insert({
        ...templateData,
        name: newName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*, department:departments(id, name)')
      .single();

    if (error) {
      throw new DatabaseError(`Failed to duplicate shift template: ${error.message}`);
    }

    return data;
  },

  /**
   * Get shift templates by time range
   */
  getByTimeRange: async (organizationId: string, startTime: string, endTime: string) => {
    const { data, error } = await supabase
      .from('shift_templates')
      .select('*, department:departments(id, name)')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .gte('start_time', startTime)
      .lte('end_time', endTime)
      .order('start_time', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch shift templates by time range: ${error.message}`);
    }

    return data;
  },

  /**
   * Get shift assignments using this template
   */
  getAssignments: async (templateId: string, startDate?: string, endDate?: string) => {
    let query = supabase
      .from('shift_assignments')
      .select('*, employee:employees(id, first_name, last_name, email)')
      .eq('shift_template_id', templateId);

    if (startDate) {
      query = query.gte('shift_date', startDate);
    }

    if (endDate) {
      query = query.lte('shift_date', endDate);
    }

    query = query.order('shift_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError(`Failed to fetch shift assignments: ${error.message}`);
    }

    return data;
  },

  /**
   * Find employees eligible for shift template (based on skills/certs)
   */
  findEligibleEmployees: async (templateId: string, organizationId: string) => {
    const template = await shiftTemplateService.getById(templateId);

    if (!template) {
      throw new DatabaseError('Shift template not found');
    }

    let query = supabase
      .from('employees')
      .select('id, first_name, last_name, email, employee_number, position')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    // If template requires specific skills, filter by those
    if (template.required_skills && template.required_skills.length > 0) {
      const { data: skillMatches, error: skillError } = await supabase
        .from('employee_skills')
        .select('employee_id')
        .in('skill_id', template.required_skills)
        .in('proficiency_level', ['intermediate', 'advanced', 'expert']);

      if (skillError) {
        throw new DatabaseError(`Failed to fetch employee skills: ${skillError.message}`);
      }

      const employeeIds = [...new Set(skillMatches.map((m) => m.employee_id))];
      query = query.in('id', employeeIds);
    }

    // If template requires certifications, filter by those
    if (template.required_certifications && template.required_certifications.length > 0) {
      const { data: certMatches, error: certError } = await supabase
        .from('employee_certifications')
        .select('employee_id')
        .in('certification_id', template.required_certifications)
        .eq('status', 'active');

      if (certError) {
        throw new DatabaseError(`Failed to fetch employee certifications: ${certError.message}`);
      }

      const employeeIds = [...new Set(certMatches.map((m) => m.employee_id))];
      query = query.in('id', employeeIds);
    }

    const { data, error } = await query.order('last_name', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch eligible employees: ${error.message}`);
    }

    return data;
  },
};
