import React, { useState, useEffect } from 'react';
import { StaffingPlan } from '../../types/staffingPlan';
import { staffingPlanService } from '../../services/staffingPlanService';
import StaffingPlanForm from './StaffingPlanForm';

interface StaffingPlanManagementProps {
  organizationId: string;
  departmentId?: string;
}

interface FilterState {
  status: string;
  priority: string;
  searchTerm: string;
}

export const StaffingPlanManagement: React.FC<StaffingPlanManagementProps> = ({
  organizationId,
  departmentId,
}) => {
  const [plans, setPlans] = useState<StaffingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StaffingPlan | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    status: '',
    priority: '',
    searchTerm: '',
  });

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await staffingPlanService.getAll({
        organizationId,
        departmentId,
        status: (filters.status || undefined) as any,
        priority: (filters.priority || undefined) as any,
      });
      setPlans(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staffing plans');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [organizationId, departmentId, filters]);

  const handleCreateClick = () => {
    setEditingPlan(null);
    setShowForm(true);
  };

  const handleEditClick = (plan: StaffingPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: Partial<StaffingPlan>) => {
    setFormLoading(true);
    try {
      if (editingPlan) {
        await staffingPlanService.update(editingPlan.id, data);
      } else {
        await staffingPlanService.create(data as any);
      }
      setShowForm(false);
      setEditingPlan(null);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
      console.error('Error saving plan:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this staffing plan?')) {
      return;
    }

    try {
      await staffingPlanService.delete(planId);
      await loadPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
      console.error('Error deleting plan:', err);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-purple-100 text-purple-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      archived: 'bg-gray-200 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-50 text-blue-700 border border-blue-200',
      medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      high: 'bg-orange-50 text-orange-700 border border-orange-200',
      critical: 'bg-red-50 text-red-700 border border-red-200',
    };
    return colors[priority] || 'bg-gray-50 text-gray-700';
  };

  const filteredPlans = plans.filter(plan => {
    if (filters.searchTerm && !plan.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {editingPlan ? 'Edit Staffing Plan' : 'Create New Staffing Plan'}
          </h2>
        </div>
        <StaffingPlanForm
          plan={editingPlan}
          organizationId={organizationId}
          departmentId={departmentId}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingPlan(null);
          }}
          isLoading={formLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Staffing Plans</h1>
        <button
          onClick={handleCreateClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          + Create Plan
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-gray-900">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search plan name..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters(prev => ({ ...prev, searchTerm: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters(prev => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters(prev => ({ ...prev, priority: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plans List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading staffing plans...</div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No staffing plans found. {!filters.status && !filters.priority && !filters.searchTerm && 'Create one to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Priority</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Duration</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Headcount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Assignments</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map(plan => {
                  const startDate = new Date(plan.start_date).toLocaleDateString();
                  const endDate = new Date(plan.end_date).toLocaleDateString();
                  return (
                    <tr key={plan.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{plan.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(plan.status)}`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityBadgeColor(plan.priority)}`}>
                          {plan.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {startDate} to {endDate}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {plan.planned_headcount || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="font-medium">{plan.current_assignments || 0}</span>
                        {plan.planned_headcount && (
                          <span className="text-gray-400"> / {plan.planned_headcount}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditClick(plan)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(plan.id)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffingPlanManagement;
