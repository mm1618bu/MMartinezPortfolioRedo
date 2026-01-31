import { config } from '../config';
import { StaffingPlan, CreateStaffingPlanInput, StaffingPlanQueryParams, StaffingPlanAssignment, CreateStaffingPlanAssignmentInput, StaffingPlanAssignmentQueryParams } from '../types/staffingPlan';

class StaffingPlanService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/staffing-plans`;
  }

  async getAll(params?: StaffingPlanQueryParams): Promise<StaffingPlan[]> {
    try {
      const queryString = new URLSearchParams();
      if (params?.organizationId) queryString.append('organizationId', params.organizationId);
      if (params?.departmentId) queryString.append('departmentId', params.departmentId);
      if (params?.status) queryString.append('status', params.status);
      if (params?.priority) queryString.append('priority', params.priority);
      if (params?.startDate) queryString.append('startDate', params.startDate);
      if (params?.endDate) queryString.append('endDate', params.endDate);
      if (params?.search) queryString.append('search', params.search);
      if (params?.page) queryString.append('page', params.page.toString());
      if (params?.limit) queryString.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseURL}?${queryString}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch staffing plans: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingPlanService.getAll:', error);
      throw new Error(`Failed to fetch staffing plans: ${error.message}`);
    }
  }

  async getById(id: string): Promise<StaffingPlan> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch staffing plan: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingPlanService.getById:', error);
      throw new Error(`Failed to fetch staffing plan: ${error.message}`);
    }
  }

  async create(data: CreateStaffingPlanInput): Promise<StaffingPlan> {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create staffing plan: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingPlanService.create:', error);
      throw new Error(`Failed to create staffing plan: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<StaffingPlan>): Promise<StaffingPlan> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update staffing plan: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingPlanService.update:', error);
      throw new Error(`Failed to update staffing plan: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete staffing plan: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error in staffingPlanService.delete:', error);
      throw new Error(`Failed to delete staffing plan: ${error.message}`);
    }
  }

  async updateStatus(id: string, status: string, approvedBy?: string): Promise<StaffingPlan> {
    try {
      const response = await fetch(`${this.baseURL}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approvedBy }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update plan status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingPlanService.updateStatus:', error);
      throw new Error(`Failed to update plan status: ${error.message}`);
    }
  }

  async getPlansByDateRange(organizationId: string, startDate: string, endDate: string): Promise<StaffingPlan[]> {
    try {
      const response = await fetch(`${this.baseURL}/range/${startDate}/${endDate}?organizationId=${organizationId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingPlanService.getPlansByDateRange:', error);
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }
  }

  async getActivePlans(organizationId: string, date: string): Promise<StaffingPlan[]> {
    try {
      const response = await fetch(`${this.baseURL}/active/${date}?organizationId=${organizationId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active plans: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in staffingPlanService.getActivePlans:', error);
      throw new Error(`Failed to fetch active plans: ${error.message}`);
    }
  }
}

export const staffingPlanService = new StaffingPlanService();

/**
 * Staffing Plan Assignment Service
 */
class StaffingPlanAssignmentService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${config.api.baseUrl}/staffing-plans`;
  }

  async getByPlanId(planId: string): Promise<StaffingPlanAssignment[]> {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/assignments`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in assignmentService.getByPlanId:', error);
      throw new Error(`Failed to fetch assignments: ${error.message}`);
    }
  }

  async getAll(params?: StaffingPlanAssignmentQueryParams): Promise<StaffingPlanAssignment[]> {
    try {
      const queryString = new URLSearchParams();
      if (params?.staffingPlanId) queryString.append('staffingPlanId', params.staffingPlanId);
      if (params?.employeeId) queryString.append('employeeId', params.employeeId);
      if (params?.organizationId) queryString.append('organizationId', params.organizationId);
      if (params?.status) queryString.append('status', params.status);
      if (params?.fromDate) queryString.append('fromDate', params.fromDate);
      if (params?.toDate) queryString.append('toDate', params.toDate);
      if (params?.page) queryString.append('page', params.page.toString());
      if (params?.limit) queryString.append('limit', params.limit.toString());

      const response = await fetch(`${this.baseURL}/assignments/list?${queryString}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in assignmentService.getAll:', error);
      throw new Error(`Failed to fetch assignments: ${error.message}`);
    }
  }

  async getById(id: string): Promise<StaffingPlanAssignment> {
    try {
      const response = await fetch(`${this.baseURL}/assignments/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in assignmentService.getById:', error);
      throw new Error(`Failed to fetch assignment: ${error.message}`);
    }
  }

  async create(planId: string, data: CreateStaffingPlanAssignmentInput): Promise<StaffingPlanAssignment> {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create assignment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in assignmentService.create:', error);
      throw new Error(`Failed to create assignment: ${error.message}`);
    }
  }

  async createBulk(planId: string, assignments: CreateStaffingPlanAssignmentInput[]): Promise<StaffingPlanAssignment[]> {
    try {
      const response = await fetch(`${this.baseURL}/${planId}/assignments/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create assignments: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in assignmentService.createBulk:', error);
      throw new Error(`Failed to create assignments: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<StaffingPlanAssignment>): Promise<StaffingPlanAssignment> {
    try {
      const response = await fetch(`${this.baseURL}/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update assignment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in assignmentService.update:', error);
      throw new Error(`Failed to update assignment: ${error.message}`);
    }
  }

  async updateStatus(id: string, status: string, confirmedBy?: string): Promise<StaffingPlanAssignment> {
    try {
      const response = await fetch(`${this.baseURL}/assignments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, confirmedBy }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update assignment status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error in assignmentService.updateStatus:', error);
      throw new Error(`Failed to update assignment status: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/assignments/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete assignment: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error in assignmentService.delete:', error);
      throw new Error(`Failed to delete assignment: ${error.message}`);
    }
  }
}

export const staffingPlanAssignmentService = new StaffingPlanAssignmentService();
