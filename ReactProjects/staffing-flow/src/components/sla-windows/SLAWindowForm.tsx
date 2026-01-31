import React, { useState, useEffect } from 'react';
import { SLAWindow } from '../../types/slaWindow';

interface SLAWindowFormProps {
  slaWindow?: SLAWindow | null;
  organizationId?: string;
  departmentId?: string;
  onSubmit: (data: Partial<SLAWindow>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
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

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const SLAWindowForm: React.FC<SLAWindowFormProps> = ({
  slaWindow,
  organizationId,
  departmentId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    required_coverage_percentage: 100,
    minimum_staff_count: '',
    priority: 'medium',
    effective_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (slaWindow) {
      setFormData({
        name: slaWindow.name || '',
        description: slaWindow.description || '',
        day_of_week: slaWindow.day_of_week || '',
        start_time: slaWindow.start_time || '',
        end_time: slaWindow.end_time || '',
        required_coverage_percentage: slaWindow.required_coverage_percentage || 100,
        minimum_staff_count: slaWindow.minimum_staff_count?.toString() || '',
        priority: slaWindow.priority || 'medium',
        effective_date: slaWindow.effective_date || new Date().toISOString().split('T')[0],
        end_date: slaWindow.end_date || '',
        is_active: slaWindow.is_active !== false,
      });
    }
  }, [slaWindow]);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.length > 200) return 'Name must be 200 characters or less';
        return '';
      case 'day_of_week':
        if (!value) return 'Day of week is required';
        return '';
      case 'start_time':
        if (!value) return 'Start time is required';
        return '';
      case 'end_time':
        if (!value) return 'End time is required';
        if (formData.start_time && value <= formData.start_time) {
          return 'End time must be after start time';
        }
        return '';
      case 'required_coverage_percentage':
        if (value === '' || value === null) return 'Coverage percentage is required';
        if (isNaN(value) || value < 0) return 'Must be at least 0%';
        if (value > 100) return 'Must be 100% or less';
        return '';
      case 'priority':
        if (!value) return 'Priority is required';
        return '';
      case 'effective_date':
        if (!value) return 'Effective date is required';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    if (touched[name]) {
      const error = validateField(name, newValue);
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

    const payload: Partial<SLAWindow> = {
      name: formData.name,
      description: formData.description || null,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      required_coverage_percentage: formData.required_coverage_percentage,
      minimum_staff_count: formData.minimum_staff_count ? parseInt(formData.minimum_staff_count) : null,
      priority: formData.priority as 'low' | 'medium' | 'high' | 'critical',
      effective_date: formData.effective_date,
      end_date: formData.end_date || null,
      is_active: formData.is_active,
    };

    if (!slaWindow) {
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SLA Window Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g., Morning Rush Coverage"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 ${
            errors.name && touched.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {renderError('name')}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Describe the SLA requirements"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Day of Week <span className="text-red-500">*</span>
          </label>
          <select
            name="day_of_week"
            value={formData.day_of_week}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 ${
              errors.day_of_week && touched.day_of_week ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">-- Select Day --</option>
            {DAYS_OF_WEEK.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          {renderError('day_of_week')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 ${
              errors.priority && touched.priority ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {PRIORITY_LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
          {renderError('priority')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 ${
              errors.start_time && touched.start_time ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {renderError('start_time')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 ${
              errors.end_time && touched.end_time ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {renderError('end_time')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required Coverage (%) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="required_coverage_percentage"
            value={formData.required_coverage_percentage}
            onChange={handleChange}
            onBlur={handleBlur}
            min="0"
            max="100"
            step="1"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 ${
              errors.required_coverage_percentage && touched.required_coverage_percentage ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {renderError('required_coverage_percentage')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Staff Count
          </label>
          <input
            type="number"
            name="minimum_staff_count"
            value={formData.minimum_staff_count}
            onChange={handleChange}
            onBlur={handleBlur}
            min="0"
            placeholder="Optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Effective Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="effective_date"
            value={formData.effective_date}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 ${
              errors.effective_date && touched.effective_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {renderError('effective_date')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Leave blank for ongoing"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Leave blank for ongoing</p>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 border border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : slaWindow ? 'Update SLA Window' : 'Create SLA Window'}
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

export default SLAWindowForm;
