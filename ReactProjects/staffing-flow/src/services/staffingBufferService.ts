import { config } from '../config';
import { StaffingBuffer, CreateStaffingBufferInput, StaffingBufferQueryParams } from '../types/staffingBuffer';

class StaffingBufferService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/staffing-buffers`;
  }

  async getAll(params?: StaffingBufferQueryParams): Promise<StaffingBuffer[]> {
    try {
      const queryString = new URLSearchParams();
      if (params?.organizationId) queryString.append('organizationId', params.organizationId);
      if (params?.departmentId) queryString.append('departmentId', params.departmentId);
      if (params?.isActive !== undefined) queryString.append('isActive', params.isActive ? 'true' : 'false');
      if (params?.search) queryString.append('search', params.search);
      if (params?.page) queryString.append('page', params.page.toString());
      if (params?.limit) queryString.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseURL}?${queryString}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch staffing buffers: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingBufferService.getAll:', error);
      throw new Error(`Failed to fetch staffing buffers: ${error.message}`);
    }
  }

  async getById(id: string): Promise<StaffingBuffer> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch staffing buffer: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingBufferService.getById:', error);
      throw new Error(`Failed to fetch staffing buffer: ${error.message}`);
    }
  }

  async create(data: CreateStaffingBufferInput): Promise<StaffingBuffer> {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create staffing buffer: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingBufferService.create:', error);
      throw new Error(`Failed to create staffing buffer: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<StaffingBuffer>): Promise<StaffingBuffer> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update staffing buffer: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingBufferService.update:', error);
      throw new Error(`Failed to update staffing buffer: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete staffing buffer: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error in staffingBufferService.delete:', error);
      throw new Error(`Failed to delete staffing buffer: ${error.message}`);
    }
  }
}

export const staffingBufferService = new StaffingBufferService();
