import React, { useState, useEffect } from 'react';
import { StaffingPlan } from '../../types/staffingPlan';
import { staffingPlanService } from '../../services/staffingPlanService';

interface StaffingPlanDashboardProps {
  organizationId: string;
  departmentId?: string;
}

interface MetricCard {
  label: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
}

interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

interface PriorityBreakdown {
  priority: string;
  count: number;
}

export const StaffingPlanDashboard: React.FC<StaffingPlanDashboardProps> = ({
  organizationId,
  departmentId,
}) => {
  const [plans, setPlans] = useState<StaffingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [organizationId, departmentId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await staffingPlanService.getAll({
        organizationId,
        departmentId,
      });
      setPlans(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (): MetricCard[] => {
    const totalPlans = plans.length;
    const activePlans = plans.filter(p => p.status === 'active').length;
    const totalHeadcount = plans.reduce((sum, p) => sum + (p.planned_headcount || 0), 0);
    const totalAssignments = plans.reduce((sum, p) => sum + (p.current_assignments || 0), 0);
    const coveragePercentage = totalHeadcount > 0 ? Math.round((totalAssignments / totalHeadcount) * 100) : 0;

    return [
      {
        label: 'Total Plans',
        value: totalPlans,
        color: 'bg-blue-50',
        icon: '📋',
      },
      {
        label: 'Active Plans',
        value: activePlans,
        change: activePlans > 0 ? Math.round((activePlans / totalPlans) * 100) : 0,
        color: 'bg-green-50',
        icon: '✅',
      },
      {
        label: 'Total Positions',
        value: totalHeadcount,
        color: 'bg-purple-50',
        icon: '👥',
      },
      {
        label: 'Staffing Coverage',
        value: `${coveragePercentage}%`,
        color: 'bg-orange-50',
        icon: '📊',
      },
    ];
  };

  const getStatusBreakdown = (): StatusBreakdown[] => {
    const statusCounts: Record<string, number> = {};
    plans.forEach(plan => {
      statusCounts[plan.status] = (statusCounts[plan.status] || 0) + 1;
    });

    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        count,
        percentage: plans.length > 0 ? Math.round((count / plans.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getPriorityBreakdown = (): PriorityBreakdown[] => {
    const priorityCounts: Record<string, number> = {};
    plans.forEach(plan => {
      priorityCounts[plan.priority] = (priorityCounts[plan.priority] || 0) + 1;
    });

    return Object.entries(priorityCounts)
      .map(([priority, count]) => ({
        priority,
        count,
      }))
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
      });
  };

  const getUpcomingPlans = (): StaffingPlan[] => {
    const today = new Date();
    return plans
      .filter(p => new Date(p.start_date) > today && (p.status === 'draft' || p.status === 'pending_approval'))
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5);
  };

  const getMetricsNeedingAttention = (): StaffingPlan[] => {
    return plans.filter(p => {
      if (p.status === 'pending_approval') return true;
      if (p.planned_headcount && p.current_assignments < p.planned_headcount * 0.7) return true;
      return false;
    }).slice(0, 5);
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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  const metrics = calculateMetrics();
  const statusBreakdown = getStatusBreakdown();
  const priorityBreakdown = getPriorityBreakdown();
  const upcomingPlans = getUpcomingPlans();
  const plansNeedingAttention = getMetricsNeedingAttention();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Staffing Plans Dashboard</h1>
        <button
          onClick={loadDashboardData}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className={`rounded-lg p-6 border border-gray-200 ${metric.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                {metric.change !== undefined && (
                  <p className="text-green-600 text-sm mt-1">{metric.change}% of total</p>
                )}
              </div>
              <span className="text-3xl">{metric.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Status Breakdown</h2>
          {statusBreakdown.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No plans yet</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(item => (
                <div key={item.status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.status.replace('_', ' ')}</span>
                    <span className="text-sm font-bold text-gray-900">{item.count} plans ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Priority Distribution</h2>
          {priorityBreakdown.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No plans yet</p>
          ) : (
            <div className="space-y-2">
              {priorityBreakdown.map(item => (
                <div key={item.priority} className="flex items-center justify-between">
                  <span className="capitalize text-sm font-medium text-gray-700">{item.priority}</span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(item.priority)}`}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Plans & Attention Needed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Plans */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Plans</h2>
          {upcomingPlans.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming plans</p>
          ) : (
            <div className="space-y-3">
              {upcomingPlans.map(plan => (
                <div key={plan.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{plan.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Starts: {new Date(plan.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(plan.status)}`}>
                      {plan.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attention Needed */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Needs Attention</h2>
          {plansNeedingAttention.length === 0 ? (
            <p className="text-green-600 text-center py-4">All plans are on track!</p>
          ) : (
            <div className="space-y-3">
              {plansNeedingAttention.map(plan => (
                <div key={plan.id} className="border-l-4 border-yellow-400 bg-yellow-50 rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{plan.name}</p>
                      {plan.status === 'pending_approval' && (
                        <p className="text-xs text-yellow-700 mt-1">⏳ Awaiting approval</p>
                      )}
                      {plan.planned_headcount && plan.current_assignments < plan.planned_headcount * 0.7 && (
                        <p className="text-xs text-yellow-700 mt-1">
                          📊 Only {plan.current_assignments}/{plan.planned_headcount} assigned
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Total Plans</p>
            <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Total Positions</p>
            <p className="text-2xl font-bold text-gray-900">{plans.reduce((sum, p) => sum + (p.planned_headcount || 0), 0)}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Assigned Staff</p>
            <p className="text-2xl font-bold text-gray-900">{plans.reduce((sum, p) => sum + (p.current_assignments || 0), 0)}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Avg Plan Duration</p>
            <p className="text-2xl font-bold text-gray-900">
              {plans.length > 0
                ? Math.round(
                    plans.reduce((sum, p) => {
                      const start = new Date(p.start_date);
                      const end = new Date(p.end_date);
                      return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    }, 0) / plans.length
                  )
                : 0}
              d
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffingPlanDashboard;
