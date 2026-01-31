import {
  ConstraintRule,
  ConstraintViolation,
  CreateConstraintRuleInput,
  UpdateConstraintRuleInput,
  ValidateShiftAssignmentInput,
  ValidationResult,
  BatchValidationResult,
} from '../types/shiftConstraints';
import { config } from '../config';

/**
 * Shift Constraint Rules Service
 * Frontend service for managing and validating shift assignment constraints
 */

class ShiftConstraintRuleService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/shift-constraints`;
  }

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
      const searchParams = new URLSearchParams();
      if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
      if (params?.departmentId) searchParams.append('departmentId', params.departmentId);
      if (params?.constraintType) searchParams.append('constraintType', params.constraintType);
      if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

      const response = await fetch(`${this.baseURL}/rules?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch constraint rules');
      return await response.json();
    } catch (error) {
      console.error('Error fetching constraint rules:', error);
      throw error;
    }
  }

  /**
   * Get single constraint rule by ID
   */
  async getById(id: string): Promise<ConstraintRule | null> {
    try {
      const response = await fetch(`${this.baseURL}/rules/${id}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch constraint rule');
      return await response.json();
    } catch (error) {
      console.error('Error fetching constraint rule:', error);
      throw error;
    }
  }

  /**
   * Create new constraint rule
   */
  async create(data: CreateConstraintRuleInput): Promise<ConstraintRule> {
    try {
      const response = await fetch(`${this.baseURL}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create constraint rule');
      return await response.json();
    } catch (error) {
      console.error('Error creating constraint rule:', error);
      throw error;
    }
  }

  /**
   * Update constraint rule
   */
  async update(id: string, data: UpdateConstraintRuleInput): Promise<ConstraintRule> {
    try {
      const response = await fetch(`${this.baseURL}/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update constraint rule');
      return await response.json();
    } catch (error) {
      console.error('Error updating constraint rule:', error);
      throw error;
    }
  }

  /**
   * Delete constraint rule
   */
  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/rules/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete constraint rule');
    } catch (error) {
      console.error('Error deleting constraint rule:', error);
      throw error;
    }
  }

  /**
   * Validate single shift assignment
   */
  async validateAssignment(
    assignment: ValidateShiftAssignmentInput
  ): Promise<ValidationResult> {
    try {
      const response = await fetch(`${this.baseURL}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });
      if (!response.ok) throw new Error('Failed to validate assignment');
      return await response.json();
    } catch (error) {
      console.error('Error validating assignment:', error);
      throw error;
    }
  }

  /**
   * Validate multiple shift assignments
   */
  async validateBatchAssignments(
    assignments: ValidateShiftAssignmentInput[]
  ): Promise<BatchValidationResult> {
    try {
      const response = await fetch(`${this.baseURL}/validate-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignments,
          organization_id: assignments[0]?.organization_id || '',
          department_id: assignments[0]?.department_id,
        }),
      });
      if (!response.ok) throw new Error('Failed to validate batch assignments');
      return await response.json();
    } catch (error) {
      console.error('Error validating batch assignments:', error);
      throw error;
    }
  }
}

export const shiftConstraintRuleService = new ShiftConstraintRuleService();

/**
 * Shift Constraint Validator Service
 * Frontend service for validating assignments and handling violations
 */

class ShiftConstraintValidator {
  /**
   * Check if assignment has violations
   */
  hasViolations(result: ValidationResult, severityFilter?: string[]): boolean {
    if (!severityFilter) return result.violations.length > 0;
    return result.violations.some(v => severityFilter.includes(v.severity));
  }

  /**
   * Check if assignment has hard violations (blocking)
   */
  hasHardViolations(result: ValidationResult): boolean {
    return result.violations.some(v => v.severity === 'hard');
  }

  /**
   * Check if assignment has soft violations (warnings)
   */
  hasSoftViolations(result: ValidationResult): boolean {
    return result.violations.some(v => v.severity === 'soft');
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(result: ValidationResult, severity: string): ConstraintViolation[] {
    return result.violations.filter(v => v.severity === severity);
  }

  /**
   * Get violation messages
   */
  getViolationMessages(violations: ConstraintViolation[]): string[] {
    return violations.map(v => v.message);
  }

  /**
   * Format violations for display
   */
  formatViolationsForDisplay(result: ValidationResult): {
    hard: string[];
    soft: string[];
    warning: string[];
  } {
    return {
      hard: this.getViolationMessages(this.getViolationsBySeverity(result, 'hard')),
      soft: this.getViolationMessages(this.getViolationsBySeverity(result, 'soft')),
      warning: this.getViolationMessages(this.getViolationsBySeverity(result, 'warning')),
    };
  }

  /**
   * Check if assignment can proceed (ignoring soft constraints)
   */
  canProceedWithOverride(result: ValidationResult): boolean {
    return !this.hasHardViolations(result);
  }
}

export const shiftConstraintValidator = new ShiftConstraintValidator();
