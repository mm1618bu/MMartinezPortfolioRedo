import React, { useState, useEffect } from 'react';
import { StaffingPlan } from '../../types/staffingPlan';

interface StaffingPlanFormProps {
  plan?: StaffingPlan | null;
  organizationId?: string;
  departmentId?: string;
  onSubmit: (data: Partial<StaffingPlan>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const StaffingPlanForm: React.FC<StaffingPlanFormProps> = ({
  plan,
  organizationId,
  departmentId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    planned_headcount: '',
    status: 'draft',
    priority: 'medium',
    notes: '',
    internal_comments: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        start_date: plan.start_date || '',
        end_date: plan.end_date || '',
        planned_headcount: plan.planned_headcount?.toString() || '',
        status: plan.status || 'draft',
        priority: plan.priority || 'medium',
        notes: plan.notes || '',
        internal_comments: plan.internal_comments || '',
      });
    }
  }, [plan]);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Plan name is required';
        if (value.length > 200) return 'Name must be 200 characters or less';
        return '';
      case 'start_date':
        if (!value) return 'Start date is required';
        return '';
      case 'end_date':
        if (!value) return 'End date is required';
        if (formData.start_date && new Date(value) < new Date(formData.start_date)) {
          return 'End date must be after or equal to start date';
        }
        return '';
      case 'planned_headcount':
        if (value && (isNaN(value) || value < 1)) return 'Must be at least 1';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    const payload: Partial<StaffingPlan> = {
      name: formData.name,
      description: formData.description || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      planned_headcount: formData.planned_headcount ? parseInt(formData.planned_headcount) : null,
      status: formData.status as any,
      priority: formData.priority as any,
      notes: formData.notes || null,
      internal_comments: formData.internal_comments || null,
    };

    if (!plan) {
      payload.organization_id = organizationId!;
      payload.department_id = departmentId || null;
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      // Error handled by parent component
    }
  };

  const renderError = (fieldName: string) => {
    if (!touched[fieldName]) return null;
    return errors[fieldName] ? (
      <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>
    ) : null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plan Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g., Q1 2024 Staffing Plan"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 ${
              errors.name && touched.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {renderError('name')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Describe the purpose and scope of this staffing plan"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 ${
              errors.start_date && touched.start_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {renderError('start_date')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 ${
              errors.end_date && touched.end_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {renderError('end_date')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Planned Headcount</label>
          <input
            type="number"
            name="planned_headcount"
            value={formData.planned_headcount}
            onChange={handleChange}
            onBlur={handleBlur}
            min="1"
            placeholder="Optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          />
          {renderError('planned_headcount')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          >
            {PRIORITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Plan notes visible to all users"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Internal Comments</label>
        <textarea
          name="internal_comments"
          value={formData.internal_comments}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Internal notes not visible to all users"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default StaffingPlanForm;
