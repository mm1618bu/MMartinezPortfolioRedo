import React, { useState, useEffect } from 'react';
import { SLAWindow } from '../../types/slaWindow';
import { slaWindowService } from '../../services/slaWindowService';
import SLAWindowForm from './SLAWindowForm';
import './SLAWindowManagement.css';

interface SLAWindowManagementProps {
  organizationId: string;
  departmentId?: string;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export const SLAWindowManagement: React.FC<SLAWindowManagementProps> = ({
  organizationId,
  departmentId,
}) => {
  const [slas, setSLAs] = useState<SLAWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSLA, setEditingSLA] = useState<SLAWindow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch SLA windows
  const fetchSLAs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await slaWindowService.getAll({
        organizationId,
        departmentId,
        dayOfWeek: filterDay || undefined,
        priority: filterPriority || undefined,
        isActive: filterActive ?? undefined,
        search: searchTerm || undefined,
      });
      setSLAs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SLA windows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSLAs();
  }, [organizationId, departmentId, filterDay, filterPriority, filterActive]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreate = async (data: Partial<SLAWindow>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await slaWindowService.create(data as any);
      setShowForm(false);
      setEditingSLA(null);
      fetchSLAs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create SLA window');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: Partial<SLAWindow>) => {
    if (!editingSLA) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await slaWindowService.update(editingSLA.id, data);
      setEditingSLA(null);
      setShowForm(false);
      fetchSLAs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SLA window');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this SLA window?')) return;
    try {
      setError(null);
      await slaWindowService.delete(id);
      fetchSLAs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete SLA window');
    }
  };

  const handleEditClick = (sla: SLAWindow) => {
    setEditingSLA(sla);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSLA(null);
    setError(null);
  };

  const filteredSLAs = slas.filter(sla =>
    sla.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sla.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sla-window-management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">SLA Windows</h2>
        <button
          onClick={() => {
            setEditingSLA(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          {showForm ? 'Cancel' : 'Create SLA Window'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingSLA ? 'Edit SLA Window' : 'Create New SLA Window'}
          </h3>
          <SLAWindowForm
            slaWindow={editingSLA}
            onSubmit={editingSLA ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
            organizationId={organizationId}
            departmentId={departmentId}
            isLoading={isSubmitting}
          />
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or description"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">All Days</option>
              {DAYS_OF_WEEK.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterActive === null ? '' : filterActive ? 'active' : 'inactive'}
              onChange={(e) => {
                if (e.target.value === '') setFilterActive(null);
                else setFilterActive(e.target.value === 'active');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading SLA windows...</div>
      ) : filteredSLAs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No SLA windows found
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSLAs.map(sla => (
            <div
              key={sla.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{sla.name}</h3>
                  <p className="text-sm text-gray-600">{sla.description}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    sla.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {sla.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    PRIORITY_COLORS[sla.priority]
                  }`}>
                    {sla.priority.charAt(0).toUpperCase() + sla.priority.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Day:</span>
                  <p className="font-semibold">{sla.day_of_week}</p>
                </div>
                <div>
                  <span className="text-gray-500">Time Window:</span>
                  <p className="font-semibold">{sla.start_time} - {sla.end_time}</p>
                </div>
                <div>
                  <span className="text-gray-500">Coverage Required:</span>
                  <p className="font-semibold">{sla.required_coverage_percentage}%</p>
                </div>
                {sla.minimum_staff_count !== null && (
                  <div>
                    <span className="text-gray-500">Min Staff:</span>
                    <p className="font-semibold">{sla.minimum_staff_count}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Effective:</span>
                  <p className="font-semibold text-xs">{sla.effective_date}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(sla)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(sla.id)}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SLAWindowManagement;
