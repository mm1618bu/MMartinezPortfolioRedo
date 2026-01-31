import { config } from '../config';

export interface ShiftTemplate {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  days_of_week?: string[];
  is_full_day: boolean;
  is_active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateShiftTemplateInput {
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  days_of_week?: string[];
  is_full_day?: boolean;
  is_active?: boolean;
  organization_id: string;
}

export interface UpdateShiftTemplateInput {
  name?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  days_of_week?: string[];
  is_full_day?: boolean;
  is_active?: boolean;
}

export interface ShiftTemplateQueryParams {
  organizationId?: string;
  shiftType?: 'morning' | 'afternoon' | 'evening' | 'night' | 'split';
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ShiftTemplateStatistics {
  totalTemplates: number;
  activeTemplates: number;
  totalCapacity: number;
  averageDuration: number;
}

class ShiftTemplateService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/shift-templates`;
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

  private buildQueryString(params: ShiftTemplateQueryParams): string {
    const searchParams = new URLSearchParams();

    if (params.organizationId) searchParams.append('organizationId', params.organizationId);
    if (params.departmentId) searchParams.append('departmentId', params.departmentId);
    if (params.shiftType) searchParams.append('shiftType', params.shiftType);
    if (params.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('limit', String(params.limit));

    return searchParams.toString();
  }

  async getAll(params: ShiftTemplateQueryParams = {}): Promise<ShiftTemplate[]> {
    const queryString = this.buildQueryString(params);
    const url = queryString ? `${this.baseURL}?${queryString}` : this.baseURL;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch shift templates: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  async getById(id: string): Promise<ShiftTemplate> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch shift template: ${response.statusText}`);
    }

    return response.json();
  }

  async getStatistics(): Promise<ShiftTemplateStatistics> {
    const response = await fetch(`${this.baseURL}/statistics`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }

    return response.json();
  }

  async create(data: CreateShiftTemplateInput): Promise<ShiftTemplate> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create shift template: ${response.statusText}`);
    }

    return response.json();
  }

  async update(id: string, data: UpdateShiftTemplateInput): Promise<ShiftTemplate> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update shift template: ${response.statusText}`);
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete shift template: ${response.statusText}`);
    }
  }

  async duplicate(id: string, newName: string): Promise<ShiftTemplate> {
    const response = await fetch(`${this.baseURL}/${id}/duplicate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ newName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to duplicate shift template: ${response.statusText}`);
    }

    return response.json();
  }
}

export const shiftTemplateService = new ShiftTemplateService();
