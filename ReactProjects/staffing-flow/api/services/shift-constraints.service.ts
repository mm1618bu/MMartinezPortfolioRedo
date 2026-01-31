import { supabase } from '../lib/supabase';
import type {
  ConstraintRule,
  ConstraintViolation,
  CreateConstraintRuleInput,
  UpdateConstraintRuleInput,
  ValidateShiftAssignmentInput,
  ValidateBatchAssignmentsInput,
} from '../schemas/shift-constraints.schema';

interface DatabaseError extends Error {
  name: 'DatabaseError';
}

/**
 * Constraint Rules Service
 * Manages shift assignment constraint rules and validates assignments against them
 */

// =============================================
// CONSTRAINT RULES MANAGEMENT
// =============================================

export const constraintRuleService = {
  /**
   * Get all constraint rules with optional filtering
   */
  async getAll(params?: {
    organizationId?: string;
    departmentId?: string;
    constraintType?: string;
    isActive?: boolean;
  }): Promise<ConstraintRule[]> {
    try {
      let query = supabase.from('shift_constraint_rules').select('*');

      if (params?.organizationId) {
        query = query.eq('organization_id', params.organizationId);
      }
      if (params?.departmentId) {
        query = query.eq('department_id', params.departmentId);
      }
      if (params?.constraintType) {
        query = query.eq('constraint_type', params.constraintType);
      }
      if (params?.isActive !== undefined) {
        query = query.eq('is_active', params.isActive);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching constraint rules:', error);
      const err = new Error('Failed to fetch constraint rules') as DatabaseError;
      err.name = 'DatabaseError';
      throw err;
    }
  },

  /**
   * Get single constraint rule by ID
   */
  async getById(id: string): Promise<ConstraintRule | null> {
    try {
      const { data, error } = await supabase
        .from('shift_constraint_rules')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data || null;
    } catch (error) {
      console.error('Error fetching constraint rule:', error);
      const err = new Error('Failed to fetch constraint rule') as DatabaseError;
      err.name = 'DatabaseError';
      throw err;
    }
  },

  /**
   * Create new constraint rule
   */
  async create(data: CreateConstraintRuleInput): Promise<ConstraintRule> {
    try {
      const { data: created, error } = await supabase
        .from('shift_constraint_rules')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return created;
    } catch (error) {
      console.error('Error creating constraint rule:', error);
      const err = new Error('Failed to create constraint rule') as DatabaseError;
      err.name = 'DatabaseError';
      throw err;
    }
  },

  /**
   * Update constraint rule
   */
  async update(id: string, data: UpdateConstraintRuleInput): Promise<ConstraintRule> {
    try {
      const { data: updated, error } = await supabase
        .from('shift_constraint_rules')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      console.error('Error updating constraint rule:', error);
      const err = new Error('Failed to update constraint rule') as DatabaseError;
      err.name = 'DatabaseError';
      throw err;
    }
  },

  /**
   * Delete constraint rule
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shift_constraint_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting constraint rule:', error);
      const err = new Error('Failed to delete constraint rule') as DatabaseError;
      err.name = 'DatabaseError';
      throw err;
    }
  },
};

// =============================================
// SHIFT ASSIGNMENT VALIDATION
// =============================================

export const shiftConstraintValidator = {
  /**
   * Validate single shift assignment against all applicable constraints
   */
  async validateAssignment(
    input: ValidateShiftAssignmentInput
  ): Promise<{ valid: boolean; violations: ConstraintViolation[] }> {
    try {
      // Get all active constraints for the organization/department
      const constraints = await constraintRuleService.getAll({
        organizationId: input.organization_id,
        departmentId: input.department_id,
        isActive: true,
      });

      // Filter applicable constraints
      const applicableConstraints = constraints.filter(c => {
        // Check if rule applies to employee
        if (c.applies_to_employees && c.applies_to_employees.length > 0) {
          if (!c.applies_to_employees.includes(input.employee_id)) return false;
        }

        // Check if rule applies to role
        if (c.applies_to_roles && c.applies_to_roles.length > 0 && input.assigned_role) {
          if (!c.applies_to_roles.includes(input.assigned_role)) return false;
        }

        // Check excluded employees
        if (c.excluded_employees && c.excluded_employees.includes(input.employee_id)) {
          return false;
        }

        // Check effective dates
        const now = new Date();
        if (c.effective_from && new Date(c.effective_from) > now) return false;
        if (c.effective_until && new Date(c.effective_until) < now) return false;

        return true;
      });

      const violations: ConstraintViolation[] = [];

      for (const constraint of applicableConstraints) {
        const violation = await validateConstraint(constraint, input);
        if (violation) {
          violations.push({
            ...violation,
            override_requested: false,
          });
        }
      }

      // Determine if assignment is valid
      const hasHardViolations = violations.some(v => v.severity === 'hard');

      return {
        valid: !hasHardViolations,
        violations,
      };
    } catch (error) {
      console.error('Error validating assignment:', error);
      return {
        valid: false,
        violations: [
          {
            constraint_rule_id: '',
            assignment_id: '',
            employee_id: input.employee_id,
            violation_type: 'validation_error',
            severity: 'hard',
            message: 'Error validating assignment constraints',
            override_requested: false,
            suggested_action: 'Please try again or contact administrator',
            violation_details: { error: error instanceof Error ? error.message : 'Unknown error' },
          },
        ],
      };
    }
  },

  /**
   * Validate batch of shift assignments
   */
  async validateBatchAssignments(
    input: ValidateBatchAssignmentsInput
  ): Promise<{
    valid: boolean;
    results: Array<{
      assignment: ValidateShiftAssignmentInput;
      valid: boolean;
      violations: ConstraintViolation[];
    }>;
  }> {
    try {
      const results = await Promise.all(
        input.assignments.map(async assignment => ({
          assignment,
          ...(await this.validateAssignment(assignment)),
        }))
      );

      const valid = results.every(r => r.valid);

      return { valid, results };
    } catch (error) {
      console.error('Error validating batch assignments:', error);
      return {
        valid: false,
        results: input.assignments.map(assignment => ({
          assignment,
          valid: false,
          violations: [
            {
              constraint_rule_id: '',
              assignment_id: '',
              employee_id: assignment.employee_id,
              violation_type: 'batch_validation_error',
              severity: 'hard',
              message: 'Error validating batch constraints',
              override_requested: false,
              suggested_action: 'Please try again or contact administrator',
              violation_details: { error: error instanceof Error ? error.message : 'Unknown error' },
            },
          ],
        })),
      };
    }
  },
};

// =============================================
// CONSTRAINT VALIDATION HELPERS
// =============================================

/**
 * Validate a single constraint against an assignment
 */
async function validateConstraint(
  constraint: ConstraintRule,
  assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  switch (constraint.constraint_type) {
    case 'no_double_booking':
      return await checkDoubleBooking(constraint, assignment);

    case 'max_consecutive_shifts':
      return await checkConsecutiveShifts(constraint, assignment);

    case 'min_rest_between_shifts':
      return await checkRestBetweenShifts(constraint, assignment);

    case 'max_hours_per_day':
      return await checkMaxHoursPerDay(constraint, assignment);

    case 'max_hours_per_week':
      return await checkMaxHoursPerWeek(constraint, assignment);

    case 'employee_availability':
      return await checkEmployeeAvailability(constraint, assignment);

    case 'employee_time_off':
      return await checkEmployeeTimeOff(constraint, assignment);

    case 'required_skill':
      return await checkRequiredSkill(constraint, assignment);

    case 'min_coverage':
      return await checkMinCoverage(constraint, assignment);

    case 'max_coverage':
      return await checkMaxCoverage(constraint, assignment);

    default:
      return null;
  }
}

/**
 * Check if employee is already assigned to a shift at the same time
 */
async function checkDoubleBooking(
  constraint: ConstraintRule,
  assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  try {
    const { data: existing } = await supabase
      .from('staffing_plan_assignments')
      .select('id')
      .eq('employee_id', assignment.employee_id)
      .eq('organization_id', assignment.organization_id)
      .gte('assignment_date', assignment.assignment_date)
      .lte('assignment_date', assignment.assignment_end_date || assignment.assignment_date)
      .eq('status', 'confirmed');

    if (existing && existing.length > 0) {
      return {
        constraint_rule_id: constraint.id!,
        assignment_id: '',
        employee_id: assignment.employee_id,
        violation_type: 'double_booking',
        severity: constraint.severity,
        message: `Employee is already assigned to a shift on ${assignment.assignment_date}`,
        suggested_action: 'Choose a different date or employee',
        violation_details: { existing_assignments: existing.length },
        override_requested: false,
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking double booking:', error);
    return null;
  }
}

/**
 * Check maximum consecutive shifts constraint
 */
async function checkConsecutiveShifts(
  constraint: ConstraintRule,
  assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  try {
    const maxConsecutive = (constraint.parameters?.max_days as number) || 5;

    // Get employee's recent assignments
    const { data: assignments } = await supabase
      .from('staffing_plan_assignments')
      .select('assignment_date')
      .eq('employee_id', assignment.employee_id)
      .eq('organization_id', assignment.organization_id)
      .gte('assignment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('assignment_date', { ascending: false });

    if (!assignments || assignments.length < maxConsecutive) {
      return null;
    }

    // Check if assignments are consecutive
    let consecutive = 1;
    for (let i = 1; i < assignments.length; i++) {
      const curr = new Date(assignments[i]!.assignment_date);
      const prev = new Date(assignments[i - 1]!.assignment_date);
      const dayDiff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        consecutive++;
      } else {
        break;
      }
    }

    if (consecutive >= maxConsecutive) {
      return {
        constraint_rule_id: constraint.id!,
        assignment_id: '',
        employee_id: assignment.employee_id,
        violation_type: 'consecutive_shifts_exceeded',
        severity: constraint.severity,
        message: `Employee would exceed maximum ${maxConsecutive} consecutive shifts`,
        suggested_action: 'Schedule a rest day or choose a different employee',
        violation_details: { consecutive_shifts: consecutive, max_allowed: maxConsecutive },
        override_requested: false,
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking consecutive shifts:', error);
    return null;
  }
}

/**
 * Check minimum rest between shifts constraint
 */
async function checkRestBetweenShifts(
  constraint: ConstraintRule,
  assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  try {
    const minRestHours = (constraint.parameters?.min_rest_hours as number) || 11;

    // Get employee's last assignment before this date
    const { data: lastAssignments } = await supabase
      .from('staffing_plan_assignments')
      .select('assignment_end_date')
      .eq('employee_id', assignment.employee_id)
      .eq('organization_id', assignment.organization_id)
      .lt('assignment_date', assignment.assignment_date)
      .order('assignment_end_date', { ascending: false })
      .limit(1);

    if (!lastAssignments || lastAssignments.length === 0) {
      return null;
    }

    const lastEndDate = new Date(lastAssignments[0]!.assignment_end_date);
    const newStartDate = new Date(assignment.assignment_date);
    const restHours = (newStartDate.getTime() - lastEndDate.getTime()) / (1000 * 60 * 60);

    if (restHours < minRestHours) {
      return {
        constraint_rule_id: constraint.id!,
        assignment_id: '',
        employee_id: assignment.employee_id,
        violation_type: 'insufficient_rest',
        severity: constraint.severity,
        message: `Employee would have only ${Math.round(restHours)} hours rest (minimum ${minRestHours} required)`,
        suggested_action: 'Schedule assignment at least after required rest period',
        violation_details: { rest_hours: restHours, min_required: minRestHours },
        override_requested: false,
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking rest between shifts:', error);
    return null;
  }
}

/**
 * Check maximum hours per day constraint
 */
async function checkMaxHoursPerDay(
  _constraint: ConstraintRule,
  _assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  // This would require shift template duration data
  // Placeholder for demonstration
  return null;
}

/**
 * Check maximum hours per week constraint
 */
async function checkMaxHoursPerWeek(
  _constraint: ConstraintRule,
  _assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  // This would require shift template duration data and week calculation
  // Placeholder for demonstration
  return null;
}

/**
 * Check employee availability constraint
 */
async function checkEmployeeAvailability(
  constraint: ConstraintRule,
  assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  try {
    // Get employee's availability
    const { data: employee } = await supabase
      .from('staff')
      .select('status')
      .eq('id', assignment.employee_id)
      .single();

    if (employee && employee.status !== 'active') {
      return {
        constraint_rule_id: constraint.id!,
        assignment_id: '',
        employee_id: assignment.employee_id,
        violation_type: 'employee_unavailable',
        severity: constraint.severity,
        message: `Employee is not active (status: ${employee.status})`,
        suggested_action: 'Choose an active employee',
        violation_details: { employee_status: employee.status },
        override_requested: false,
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking employee availability:', error);
    return null;
  }
}

/**
 * Check employee time off constraint
 */
async function checkEmployeeTimeOff(
  constraint: ConstraintRule,
  assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  try {
    const { data: timeOff } = await supabase
      .from('time_off')
      .select('id')
      .eq('staff_id', assignment.employee_id)
      .eq('status', 'approved')
      .lte('start_date', assignment.assignment_date)
      .gte('end_date', assignment.assignment_date);

    if (timeOff && timeOff.length > 0) {
      return {
        constraint_rule_id: constraint.id!,
        assignment_id: '',
        employee_id: assignment.employee_id,
        violation_type: 'employee_on_time_off',
        severity: constraint.severity,
        message: `Employee has approved time off on ${assignment.assignment_date}`,
        suggested_action: 'Choose a different date or employee',
        violation_details: { time_off_count: timeOff.length },
        override_requested: false,
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking time off:', error);
    return null;
  }
}

/**
 * Check required skill constraint
 */
async function checkRequiredSkill(
  constraint: ConstraintRule,
  assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  try {
    const requiredSkill = constraint.parameters?.skill_name;
    if (!requiredSkill) return null;

    // Check if employee has the required skill
    const { data: skills } = await supabase
      .from('employee_skills')
      .select('id')
      .eq('employee_id', assignment.employee_id)
      .eq('skill_name', requiredSkill)
      .eq('is_certified', true);

    if (!skills || skills.length === 0) {
      return {
        constraint_rule_id: constraint.id!,
        assignment_id: '',
        employee_id: assignment.employee_id,
        violation_type: 'missing_skill',
        severity: constraint.severity,
        message: `Employee does not have the required skill: ${requiredSkill}`,
        suggested_action: 'Assign employee to training or choose a different employee',
        violation_details: { required_skill: requiredSkill },
        override_requested: false,
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking required skill:', error);
    return null;
  }
}

/**
 * Check minimum coverage constraint
 */
async function checkMinCoverage(
  constraint: ConstraintRule,
  assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  try {
    const minStaff = (constraint.parameters?.min_staff as number) || 1;

    // Get current confirmed assignments for this shift/date
    const { data: currentAssignments } = await supabase
      .from('staffing_plan_assignments')
      .select('id')
      .eq('assignment_date', assignment.assignment_date)
      .eq('organization_id', assignment.organization_id)
      .eq('status', 'confirmed');

    // This check passes - just informational
    if (!currentAssignments || (currentAssignments?.length || 0) < minStaff + 1) {
      return {
        constraint_rule_id: constraint.id!,
        assignment_id: '',
        employee_id: assignment.employee_id,
        violation_type: 'below_minimum_coverage',
        severity: 'warning',
        message: `Adding this assignment would approach minimum coverage of ${minStaff} staff`,
        violation_details: { current_staff: currentAssignments?.length || 0, min_required: minStaff },
        override_requested: false,
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking min coverage:', error);
    return null;
  }
}

/**
 * Check maximum coverage constraint
 */
async function checkMaxCoverage(
  constraint: ConstraintRule,
  assignment: ValidateShiftAssignmentInput
): Promise<ConstraintViolation | null> {
  try {
    const maxStaff = (constraint.parameters?.max_staff as number) || 10;

    // Get current confirmed assignments for this shift/date
    const { data: currentAssignments } = await supabase
      .from('staffing_plan_assignments')
      .select('id')
      .eq('assignment_date', assignment.assignment_date)
      .eq('organization_id', assignment.organization_id)
      .eq('status', 'confirmed');

    if (currentAssignments && currentAssignments.length >= maxStaff) {
      return {
        constraint_rule_id: constraint.id!,
        assignment_id: '',
        employee_id: assignment.employee_id,
        violation_type: 'exceeds_maximum_coverage',
        severity: constraint.severity,
        message: `Adding this assignment would exceed maximum coverage of ${maxStaff} staff`,
        suggested_action: 'Reduce staffing levels or postpone assignment',
        violation_details: { current_staff: currentAssignments.length, max_allowed: maxStaff },
        override_requested: false,
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking max coverage:', error);
    return null;
  }
}
