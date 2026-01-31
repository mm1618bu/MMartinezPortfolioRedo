import { config } from '../config';
import { SLAWindow, CreateSLAWindowInput, SLAWindowQueryParams } from '../types/slaWindow';

class SLAWindowService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/sla-windows`;
  }

  async getAll(params?: SLAWindowQueryParams): Promise<SLAWindow[]> {
    try {
      const queryString = new URLSearchParams();
      if (params?.organizationId) queryString.append('organizationId', params.organizationId);
      if (params?.departmentId) queryString.append('departmentId', params.departmentId);
      if (params?.dayOfWeek) queryString.append('dayOfWeek', params.dayOfWeek);
      if (params?.priority) queryString.append('priority', params.priority);
      if (params?.isActive !== undefined) queryString.append('isActive', params.isActive ? 'true' : 'false');
      if (params?.search) queryString.append('search', params.search);
      if (params?.page) queryString.append('page', params.page.toString());
      if (params?.limit) queryString.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseURL}?${queryString}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch SLA windows: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in slaWindowService.getAll:', error);
      throw new Error(`Failed to fetch SLA windows: ${error.message}`);
    }
  }

  async getById(id: string): Promise<SLAWindow> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch SLA window: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in slaWindowService.getById:', error);
      throw new Error(`Failed to fetch SLA window: ${error.message}`);
    }
  }

  async create(data: CreateSLAWindowInput): Promise<SLAWindow> {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create SLA window: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in slaWindowService.create:', error);
      throw new Error(`Failed to create SLA window: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<SLAWindow>): Promise<SLAWindow> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update SLA window: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in slaWindowService.update:', error);
      throw new Error(`Failed to update SLA window: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete SLA window: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error in slaWindowService.delete:', error);
      throw new Error(`Failed to delete SLA window: ${error.message}`);
    }
  }
}

export const slaWindowService = new SLAWindowService();
