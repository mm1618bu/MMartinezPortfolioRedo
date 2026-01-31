import React, { useState, useEffect } from 'react';
import { StaffingBuffer } from '../../types/staffingBuffer';
import { staffingBufferService } from '../../services/staffingBufferService';
import StaffingBufferForm from './StaffingBufferForm';
import './StaffingBufferManagement.css';

interface StaffingBufferManagementProps {
  organizationId: string;
  departmentId?: string;
}

export const StaffingBufferManagement: React.FC<StaffingBufferManagementProps> = ({
  organizationId,
  departmentId,
}) => {
  const [buffers, setBuffers] = useState<StaffingBuffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBuffer, setEditingBuffer] = useState<StaffingBuffer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch buffers
  const fetchBuffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffingBufferService.getAll({
        organizationId,
        departmentId,
        isActive: filterActive ?? undefined,
        search: searchTerm || undefined,
      });
      setBuffers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staffing buffers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuffers();
  }, [organizationId, departmentId, filterActive]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreate = async (data: Partial<StaffingBuffer>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await staffingBufferService.create(data as any);
      setShowForm(false);
      setEditingBuffer(null);
      fetchBuffers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create buffer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: Partial<StaffingBuffer>) => {
    if (!editingBuffer) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await staffingBufferService.update(editingBuffer.id, data);
      setEditingBuffer(null);
      setShowForm(false);
      fetchBuffers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update buffer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this buffer?')) return;
    try {
      setError(null);
      await staffingBufferService.delete(id);
      fetchBuffers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete buffer');
    }
  };

  const handleEditClick = (buffer: StaffingBuffer) => {
    setEditingBuffer(buffer);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingBuffer(null);
    setError(null);
  };

  const filteredBuffers = buffers.filter(buffer =>
    buffer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buffer.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="staffing-buffer-management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Staffing Buffers</h2>
        <button
          onClick={() => {
            setEditingBuffer(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        >
          {showForm ? 'Cancel' : 'Create Buffer'}
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
            {editingBuffer ? 'Edit Buffer' : 'Create New Buffer'}
          </h3>
          <StaffingBufferForm
            buffer={editingBuffer}
            onSubmit={editingBuffer ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
            organizationId={organizationId}
            departmentId={departmentId}
            isLoading={isSubmitting}
          />
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="text-center py-8 text-gray-500">Loading staffing buffers...</div>
      ) : filteredBuffers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No staffing buffers found
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBuffers.map(buffer => (
            <div
              key={buffer.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{buffer.name}</h3>
                  <p className="text-sm text-gray-600">{buffer.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  buffer.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {buffer.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Buffer %:</span>
                  <p className="font-semibold">{buffer.buffer_percentage}%</p>
                </div>
                {buffer.buffer_minimum_count !== null && (
                  <div>
                    <span className="text-gray-500">Min Staff:</span>
                    <p className="font-semibold">{buffer.buffer_minimum_count}</p>
                  </div>
                )}
                {buffer.day_of_week && (
                  <div>
                    <span className="text-gray-500">Day:</span>
                    <p className="font-semibold">{buffer.day_of_week}</p>
                  </div>
                )}
                {buffer.start_time && buffer.end_time && (
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <p className="font-semibold">{buffer.start_time} - {buffer.end_time}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(buffer)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(buffer.id)}
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

export default StaffingBufferManagement;
