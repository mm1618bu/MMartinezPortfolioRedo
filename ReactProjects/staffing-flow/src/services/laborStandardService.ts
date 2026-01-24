import { config } from '../config';

export interface LaborStandard {
  id: string;
  name: string;
  description?: string;
  department_id?: string;
  task_type: string;
  standard_units_per_hour?: number;
  standard_hours_per_unit?: number;
  quality_threshold_percentage?: number;
  effective_date: string;
  end_date?: string;
  is_active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLaborStandardInput {
  name: string;
  description?: string;
  department_id?: string;
  task_type: string;
  standard_units_per_hour?: number;
  standard_hours_per_unit?: number;
  quality_threshold_percentage?: number;
  effective_date: string;
  end_date?: string;
  is_active?: boolean;
  organization_id: string;
}

export interface UpdateLaborStandardInput {
  name?: string;
  description?: string;
  department_id?: string;
  task_type?: string;
  standard_units_per_hour?: number;
  standard_hours_per_unit?: number;
  quality_threshold_percentage?: number;
  effective_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface LaborStandardQueryParams {
  organizationId?: string;
  departmentId?: string;
  taskType?: string;
  isActive?: boolean;
  effectiveDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LaborStandardStatistics {
  totalTasks: number;
  averageProductivity: number;
  complianceRate: number;
}

class LaborStandardService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/labor-standards`;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private buildQueryString(params: LaborStandardQueryParams): string {
    const queryParams = new URLSearchParams();
    
    if (params.organizationId) {
      queryParams.append('organizationId', params.organizationId);
    }
    if (params.departmentId) {
      queryParams.append('departmentId', params.departmentId);
    }
    if (params.taskType) {
      queryParams.append('taskType', params.taskType);
    }
    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }
    if (params.effectiveDate) {
      queryParams.append('effectiveDate', params.effectiveDate);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    return queryParams.toString();
  }

  async getAll(params: LaborStandardQueryParams = {}): Promise<LaborStandard[]> {
    const queryString = this.buildQueryString(params);
    const url = queryString ? `${this.baseURL}?${queryString}` : this.baseURL;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch labor standards' }));
      throw new Error(error.message || 'Failed to fetch labor standards');
    }

    const result = await response.json();
    return result.data || result;
  }

  async getById(id: string): Promise<LaborStandard> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch labor standard' }));
      throw new Error(error.message || 'Failed to fetch labor standard');
    }

    return response.json();
  }

  async getStatistics(id: string): Promise<LaborStandardStatistics> {
    const response = await fetch(`${this.baseURL}/${id}/statistics`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch statistics' }));
      throw new Error(error.message || 'Failed to fetch statistics');
    }

    return response.json();
  }

  async create(data: CreateLaborStandardInput): Promise<LaborStandard> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create labor standard' }));
      throw new Error(error.message || 'Failed to create labor standard');
    }

    return response.json();
  }

  async update(id: string, data: UpdateLaborStandardInput): Promise<LaborStandard> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update labor standard' }));
      throw new Error(error.message || 'Failed to update labor standard');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete labor standard' }));
      throw new Error(error.message || 'Failed to delete labor standard');
    }
  }
}

export const laborStandardService = new LaborStandardService();
