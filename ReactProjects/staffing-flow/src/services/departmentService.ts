import { config } from '../config';

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentInput {
  name: string;
  description?: string;
  manager_id?: string;
  organization_id: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
  manager_id?: string;
}

export interface DepartmentQueryParams {
  organizationId?: string;
  managerId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface DepartmentStatistics {
  employeeCount: number;
  activeEmployees: number;
  shiftsThisWeek: number;
}

class DepartmentService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/departments`;
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

  private buildQueryString(params: DepartmentQueryParams): string {
    const queryParams = new URLSearchParams();
    
    if (params.organizationId) {
      queryParams.append('organizationId', params.organizationId);
    }
    if (params.managerId) {
      queryParams.append('managerId', params.managerId);
    }
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }

    return queryParams.toString();
  }

  async getAll(params: DepartmentQueryParams = {}): Promise<Department[]> {
    const queryString = this.buildQueryString(params);
    const url = queryString ? `${this.baseURL}?${queryString}` : this.baseURL;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch departments' }));
      throw new Error(error.message || 'Failed to fetch departments');
    }

    return response.json();
  }

  async getById(id: string): Promise<Department> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch department' }));
      throw new Error(error.message || 'Failed to fetch department');
    }

    return response.json();
  }

  async getStatistics(id: string): Promise<DepartmentStatistics> {
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

  async create(data: CreateDepartmentInput): Promise<Department> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create department' }));
      throw new Error(error.message || 'Failed to create department');
    }

    return response.json();
  }

  async update(id: string, data: UpdateDepartmentInput): Promise<Department> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update department' }));
      throw new Error(error.message || 'Failed to update department');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete department' }));
      throw new Error(error.message || 'Failed to delete department');
    }
  }
}

export const departmentService = new DepartmentService();
