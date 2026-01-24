import { config } from '../config';

export interface Employee {
  id: string;
  user_id?: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hire_date: string;
  department_id: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  skills?: string[];
  certifications?: string[];
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeInput {
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hire_date: string;
  department_id: string;
  position: string;
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated';
  skills?: string[];
  certifications?: string[];
  organization_id: string;
}

export interface UpdateEmployeeInput {
  employee_number?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  hire_date?: string;
  department_id?: string;
  position?: string;
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated';
  skills?: string[];
  certifications?: string[];
}

export interface EmployeeQueryParams {
  organizationId?: string;
  departmentId?: string;
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated';
  page?: number;
  limit?: number;
  search?: string;
}

export interface EmployeeStatistics {
  totalShifts: number;
  upcomingShifts: number;
  skillCount: number;
  certificationCount: number;
}

class EmployeeService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/staff`;
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

  private buildQueryString(params: EmployeeQueryParams): string {
    const queryParams = new URLSearchParams();
    
    if (params.organizationId) {
      queryParams.append('organizationId', params.organizationId);
    }
    if (params.departmentId) {
      queryParams.append('departmentId', params.departmentId);
    }
    if (params.status) {
      queryParams.append('status', params.status);
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

  async getAll(params: EmployeeQueryParams = {}): Promise<Employee[]> {
    const queryString = this.buildQueryString(params);
    const url = queryString ? `${this.baseURL}?${queryString}` : this.baseURL;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch employees' }));
      throw new Error(error.message || 'Failed to fetch employees');
    }

    return response.json();
  }

  async getById(id: string): Promise<Employee> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch employee' }));
      throw new Error(error.message || 'Failed to fetch employee');
    }

    return response.json();
  }

  async getStatistics(id: string): Promise<EmployeeStatistics> {
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

  async create(data: CreateEmployeeInput): Promise<Employee> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create employee' }));
      throw new Error(error.message || 'Failed to create employee');
    }

    return response.json();
  }

  async update(id: string, data: UpdateEmployeeInput): Promise<Employee> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update employee' }));
      throw new Error(error.message || 'Failed to update employee');
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete employee' }));
      throw new Error(error.message || 'Failed to delete employee');
    }
  }
}

export const employeeService = new EmployeeService();
