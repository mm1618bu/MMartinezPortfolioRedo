import { config } from '../config';
import {
  calculateHeadcountSummary,
  calculateHeadcountByDepartment,
  calculateHeadcountByShiftType,
  calculateHeadcountByPriority,
  calculateHeadcountBySkill,
  calculateHeadcountByDate,
  calculateProjectedHeadcount,
  type HeadcountSummary,
  type DepartmentHeadcount,
  type ShiftTypeHeadcount,
  type PriorityHeadcount,
  type SkillHeadcount,
  type DailyHeadcount,
} from '../utils/headcountCalculations';
import {
  applyBufferToHeadcount,
  applyBufferToDemands,
  calculateBufferedHeadcountSummary,
  calculateBufferStatistics,
  getBufferRecommendations,
  type BufferedHeadcountSummary,
  type DemandWithBuffer,
  type BufferStatistics,
  type BufferRecommendation,
} from '../utils/bufferSlaCalculations';
import {
  BufferSlaConfiguration,
  validateBufferConfig,
  validateSlaWindow,
} from '../utils/bufferSlaConfig';

export interface Demand {
  id: string;
  date: string;
  shift_type: 'all_day' | 'morning' | 'evening' | 'night';
  start_time?: string;
  end_time?: string;
  required_employees: number;
  required_skills?: string[];
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  organization_id: string;
  department_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateDemandInput {
  date: string;
  shift_type: 'all_day' | 'morning' | 'evening' | 'night';
  start_time?: string;
  end_time?: string;
  required_employees: number;
  required_skills?: string[];
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  organization_id: string;
  department_id?: string;
}

export interface UpdateDemandInput {
  date?: string;
  shift_type?: 'all_day' | 'morning' | 'evening' | 'night';
  start_time?: string;
  end_time?: string;
  required_employees?: number;
  required_skills?: string[];
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  department_id?: string;
}

export interface DemandGridQuery {
  organizationId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'department' | 'shift_type' | 'required_employees' | 'priority' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  departmentIds?: string[];
  shiftTypes?: string[];
  priorities?: string[];
  startDate?: string;
  endDate?: string;
  minEmployees?: number;
  maxEmployees?: number;
  search?: string;
}

export interface DemandGridResponse {
  data: Demand[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    applied: Record<string, any>;
    available: {
      departments: Array<{ id: string; name: string }>;
      shiftTypes: string[];
      priorities: string[];
    };
  };
  sort: {
    field: string;
    order: string;
  };
}

export interface DemandSummary {
  totalRecords: number;
  totalEmployeesNeeded: number;
  averagePerDay: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface BulkUpdateRequest {
  ids: string[];
  updates: {
    priority?: 'low' | 'medium' | 'high';
    shift_type?: 'all_day' | 'morning' | 'evening' | 'night';
    notes?: string;
  };
}

export interface BulkDeleteRequest {
  ids: string[];
}

const API_BASE_URL = `${config.api.baseUrl}/demands`;

class DemandService {
  // Get grid data with filtering, sorting, pagination
  async getGridData(query: DemandGridQuery = {}): Promise<DemandGridResponse> {
    const params = new URLSearchParams();

    if (query.organizationId) params.append('organizationId', query.organizationId);
    if (query.page) params.append('page', query.page.toString());
    if (query.pageSize) params.append('pageSize', query.pageSize.toString());
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.minEmployees) params.append('minEmployees', query.minEmployees.toString());
    if (query.maxEmployees) params.append('maxEmployees', query.maxEmployees.toString());
    if (query.search) params.append('search', query.search);

    // Array parameters
    if (query.departmentIds?.length) {
      query.departmentIds.forEach(id => params.append('departmentIds', id));
    }
    if (query.shiftTypes?.length) {
      query.shiftTypes.forEach(type => params.append('shiftTypes', type));
    }
    if (query.priorities?.length) {
      query.priorities.forEach(priority => params.append('priorities', priority));
    }

    const response = await fetch(`${API_BASE_URL}/grid?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to fetch grid data: ${response.statusText}`);
    return response.json();
  }

  // Get single demand
  async getDemandById(id: string): Promise<Demand> {
    const response = await fetch(`${API_BASE_URL}/grid/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to fetch demand: ${response.statusText}`);
    return response.json();
  }

  // Create demand
  async createDemand(input: CreateDemandInput): Promise<Demand> {
    const response = await fetch(`${API_BASE_URL}/grid`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error(`Failed to create demand: ${response.statusText}`);
    return response.json();
  }

  // Update demand
  async updateDemand(id: string, input: UpdateDemandInput): Promise<Demand> {
    const response = await fetch(`${API_BASE_URL}/grid/${id}`, {
      method: 'PUT',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) throw new Error(`Failed to update demand: ${response.statusText}`);
    return response.json();
  }

  // Delete demand
  async deleteDemand(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/grid/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to delete demand: ${response.statusText}`);
  }

  // Bulk delete demands
  async bulkDeleteDemands(ids: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/grid/bulk-delete`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) throw new Error(`Failed to bulk delete demands: ${response.statusText}`);
  }

  // Bulk update demands
  async bulkUpdateDemands(ids: string[], updates: UpdateDemandInput): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/grid/bulk-update`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, updates }),
    });

    if (!response.ok) throw new Error(`Failed to bulk update demands: ${response.statusText}`);
  }

  // Export demands
  async exportDemands(query: DemandGridQuery, format: 'csv' | 'json' | 'xlsx'): Promise<Blob> {
    const params = new URLSearchParams({ format });

    if (query.page) params.append('page', query.page.toString());
    if (query.pageSize) params.append('pageSize', query.pageSize.toString());
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.search) params.append('search', query.search);

    if (query.departmentIds?.length) {
      query.departmentIds.forEach(id => params.append('departmentIds', id));
    }
    if (query.shiftTypes?.length) {
      query.shiftTypes.forEach(type => params.append('shiftTypes', type));
    }
    if (query.priorities?.length) {
      query.priorities.forEach(priority => params.append('priorities', priority));
    }

    const response = await fetch(`${API_BASE_URL}/grid/export?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to export demands: ${response.statusText}`);
    return response.blob();
  }

  // Get grid summary/statistics
  async getGridSummary(query: { organizationId?: string } = {}): Promise<DemandSummary> {
    const params = new URLSearchParams();
    if (query.organizationId) params.append('organizationId', query.organizationId);
    
    const response = await fetch(`${API_BASE_URL}/grid/summary?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to fetch grid summary: ${response.statusText}`);
    return response.json();
  }

  // ==================== Headcount Calculation Methods ====================

  /**
   * Calculate comprehensive headcount summary for given demands
   */
  calculateHeadcountSummary(demands: Demand[], departments?: Array<{ id: string; name: string }>): HeadcountSummary {
    return calculateHeadcountSummary(demands, departments);
  }

  /**
   * Calculate headcount breakdown by department
   */
  calculateHeadcountByDepartment(demands: Demand[], departments?: Array<{ id: string; name: string }>): DepartmentHeadcount[] {
    return calculateHeadcountByDepartment(demands, departments);
  }

  /**
   * Calculate headcount breakdown by shift type
   */
  calculateHeadcountByShiftType(demands: Demand[]): ShiftTypeHeadcount[] {
    return calculateHeadcountByShiftType(demands);
  }

  /**
   * Calculate headcount breakdown by priority
   */
  calculateHeadcountByPriority(demands: Demand[]): PriorityHeadcount[] {
    return calculateHeadcountByPriority(demands);
  }

  /**
   * Calculate headcount breakdown by skill
   */
  calculateHeadcountBySkill(demands: Demand[]): SkillHeadcount[] {
    return calculateHeadcountBySkill(demands);
  }

  /**
   * Calculate headcount breakdown by date
   */
  calculateHeadcountByDate(demands: Demand[]): DailyHeadcount[] {
    return calculateHeadcountByDate(demands);
  }

  /**
   * Calculate projected headcount for future dates
   */
  calculateProjectedHeadcount(demands: Demand[], projectionDays?: number): DailyHeadcount[] {
    return calculateProjectedHeadcount(demands, projectionDays);
  }
  // Get available filter options
  async getFilterOptions() {
    const response = await fetch(`${API_BASE_URL}/grid/filters`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to fetch filter options: ${response.statusText}`);
    return response.json();
  }

  /**
   * Buffer and SLA Methods
   */

  // Apply buffer to headcount value
  applyBufferToValue(headcount: number, config: BufferSlaConfiguration, priority?: 'low' | 'medium' | 'high') {
    return applyBufferToHeadcount(headcount, config, priority);
  }

  // Apply buffer to demands array
  applyBufferToDemands(demands: DemandWithBuffer[], config: BufferSlaConfiguration): DemandWithBuffer[] {
    return applyBufferToDemands(demands, config);
  }

  // Calculate buffered headcount summary
  calculateBufferedSummary(demands: DemandWithBuffer[], config: BufferSlaConfiguration, baseSummary: HeadcountSummary): BufferedHeadcountSummary {
    return calculateBufferedHeadcountSummary(demands, config, baseSummary);
  }

  // Get buffer statistics
  getBufferStatistics(demandWithBuffer: DemandWithBuffer[]): BufferStatistics {
    return calculateBufferStatistics(demandWithBuffer);
  }

  // Get buffer recommendations
  getBufferRecommendations(stats: BufferStatistics, targetCompliance?: number): BufferRecommendation[] {
    return getBufferRecommendations(stats, targetCompliance);
  }

  // Validate buffer configuration
  validateBufferConfiguration(bufferConfig: any): { valid: boolean; errors: string[] } {
    return validateBufferConfig(bufferConfig);
  }

  // Validate SLA window configuration
  validateSlaWindowConfiguration(slaWindow: any): { valid: boolean; errors: string[] } {
    return validateSlaWindow(slaWindow);
  }

  // Check SLA compliance for demands
  checkSlaCompliance(demands: DemandWithBuffer[]) {
    return {
      totalDemands: demands.length,
      compliantDemands: demands.filter(d => d.meetsAllSla).length,
      nonCompliantDemands: demands.filter(d => !d.meetsAllSla).length,
      compliancePercentage: demands.length > 0 
        ? (demands.filter(d => d.meetsAllSla).length / demands.length) * 100 
        : 0,
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }
}

export const demandService = new DemandService();
