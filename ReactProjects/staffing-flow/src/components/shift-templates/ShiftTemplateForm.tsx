import React, { useState, useEffect } from 'react';
import { ShiftTemplate, CreateShiftTemplateInput } from '../../services/shiftTemplateService';

interface ShiftTemplateFormProps {
  shiftTemplate?: ShiftTemplate;
  onSubmit: (data: CreateShiftTemplateInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const SHIFT_TYPES = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
  { value: 'split', label: 'Split' },
];

export const ShiftTemplateForm: React.FC<ShiftTemplateFormProps> = ({
  shiftTemplate,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState<CreateShiftTemplateInput>({
    name: '',
    description: '',
    start_time: '09:00:00',
    end_time: '17:00:00',
    duration_hours: 8,
    break_duration_minutes: 30,
    shift_type: undefined,
    required_skills: [],
    required_certifications: [],
    min_employees: 1,
    max_employees: undefined,
    department_id: '',
    is_active: true,
    organization_id: 'default-org-id',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (shiftTemplate) {
      setFormData({
        name: shiftTemplate.name,
        description: shiftTemplate.description || '',
        start_time: shiftTemplate.start_time,
        end_time: shiftTemplate.end_time,
        duration_hours: shiftTemplate.duration_hours,
        break_duration_minutes: shiftTemplate.break_duration_minutes,
        shift_type: shiftTemplate.shift_type,
        required_skills: shiftTemplate.required_skills || [],
        required_certifications: shiftTemplate.required_certifications || [],
        min_employees: shiftTemplate.min_employees,
        max_employees: shiftTemplate.max_employees,
        department_id: shiftTemplate.department_id || '',
        is_active: shiftTemplate.is_active,
        organization_id: shiftTemplate.organization_id,
      });
    }
  }, [shiftTemplate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? undefined : parseFloat(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleArrayChange = (field: 'required_skills' | 'required_certifications', value: string) => {
    const items = value.split(',').map((item) => item.trim()).filter((item) => item);
    setFormData((prev) => ({
      ...prev,
      [field]: items,
    }));
  };

  const calculateDuration = () => {
    const start = formData.start_time.split(':').map(Number);
    const end = formData.end_time.split(':').map(Number);
    
    let startMinutes = start[0] * 60 + start[1];
    let endMinutes = end[0] * 60 + end[1];
    
    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.round((durationMinutes / 60) * 100) / 100;
    
    setFormData((prev) => ({
      ...prev,
      duration_hours: hours,
    }));
  };

  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      calculateDuration();
    }
  }, [formData.start_time, formData.end_time]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be 200 characters or less';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
    }

    if (!formData.start_time.match(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)) {
      newErrors.start_time = 'Invalid time format (HH:MM:SS)';
    }

    if (!formData.end_time.match(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)) {
      newErrors.end_time = 'Invalid time format (HH:MM:SS)';
    }

    if (formData.duration_hours <= 0) {
      newErrors.duration_hours = 'Duration must be positive';
    } else if (formData.duration_hours > 24) {
      newErrors.duration_hours = 'Duration cannot exceed 24 hours';
    }

    if (formData.break_duration_minutes && formData.break_duration_minutes < 0) {
      newErrors.break_duration_minutes = 'Break duration cannot be negative';
    }

    if (formData.min_employees !== undefined && formData.min_employees <= 0) {
      newErrors.min_employees = 'Minimum employees must be positive';
    }

    if (formData.max_employees && formData.min_employees && formData.max_employees < formData.min_employees) {
      newErrors.max_employees = 'Maximum must be greater than or equal to minimum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData: CreateShiftTemplateInput = {
      ...formData,
      description: formData.description || undefined,
      shift_type: formData.shift_type || undefined,
      department_id: formData.department_id || undefined,
      max_employees: formData.max_employees || undefined,
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="shift-template-form">
      <h3>{shiftTemplate ? 'Edit Shift Template' : 'Create Shift Template'}</h3>

      <div className="form-section">
        <h4>Basic Information</h4>

        <div className="form-group">
          <label htmlFor="name">
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            maxLength={200}
            disabled={isLoading}
            placeholder="e.g., Morning Shift, Night Crew"
          />
          <div className="char-counter">{formData.name.length}/200</div>
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            maxLength={1000}
            disabled={isLoading}
            placeholder="Detailed description of the shift template..."
          />
          <div className="char-counter">{formData.description?.length || 0}/1000</div>
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="shift_type">Shift Type</label>
          <select
            id="shift_type"
            name="shift_type"
            value={formData.shift_type || ''}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="">Select shift type (optional)</option>
            {SHIFT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="department_id">Department ID</label>
          <input
            type="text"
            id="department_id"
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            placeholder="UUID of the department (optional)"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-section">
        <h4>Time & Duration</h4>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start_time">
              Start Time <span className="required">*</span>
            </label>
            <input
              type="time"
              id="start_time"
              name="start_time"
              value={formData.start_time.substring(0, 5)}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  start_time: `${e.target.value}:00`,
                }));
              }}
              step="60"
              disabled={isLoading}
            />
            {errors.start_time && <div className="error-message">{errors.start_time}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="end_time">
              End Time <span className="required">*</span>
            </label>
            <input
              type="time"
              id="end_time"
              name="end_time"
              value={formData.end_time.substring(0, 5)}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  end_time: `${e.target.value}:00`,
                }));
              }}
              step="60"
              disabled={isLoading}
            />
            {errors.end_time && <div className="error-message">{errors.end_time}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="duration_hours">
              Duration (hours) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="duration_hours"
              name="duration_hours"
              value={formData.duration_hours}
              onChange={handleChange}
              min="0"
              max="24"
              step="0.25"
              disabled={isLoading}
              readOnly
            />
            <div className="help-text">Automatically calculated from start/end time</div>
            {errors.duration_hours && <div className="error-message">{errors.duration_hours}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="break_duration_minutes">Break Duration (minutes)</label>
            <input
              type="number"
              id="break_duration_minutes"
              name="break_duration_minutes"
              value={formData.break_duration_minutes || 0}
              onChange={handleChange}
              min="0"
              step="5"
              disabled={isLoading}
            />
            {errors.break_duration_minutes && (
              <div className="error-message">{errors.break_duration_minutes}</div>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Staffing Requirements</h4>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="min_employees">
              Minimum Employees <span className="required">*</span>
            </label>
            <input
              type="number"
              id="min_employees"
              name="min_employees"
              value={formData.min_employees}
              onChange={handleChange}
              min="1"
              step="1"
              disabled={isLoading}
            />
            {errors.min_employees && <div className="error-message">{errors.min_employees}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="max_employees">Maximum Employees</label>
            <input
              type="number"
              id="max_employees"
              name="max_employees"
              value={formData.max_employees || ''}
              onChange={handleChange}
              min="1"
              step="1"
              disabled={isLoading}
              placeholder="Optional"
            />
            {errors.max_employees && <div className="error-message">{errors.max_employees}</div>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="required_skills">Required Skills (comma-separated UUIDs)</label>
          <input
            type="text"
            id="required_skills"
            name="required_skills"
            value={formData.required_skills?.join(', ') || ''}
            onChange={(e) => handleArrayChange('required_skills', e.target.value)}
            placeholder="e.g., uuid1, uuid2, uuid3"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="required_certifications">
            Required Certifications (comma-separated UUIDs)
          </label>
          <input
            type="text"
            id="required_certifications"
            name="required_certifications"
            value={formData.required_certifications?.join(', ') || ''}
            onChange={(e) => handleArrayChange('required_certifications', e.target.value)}
            placeholder="e.g., uuid1, uuid2, uuid3"
            disabled={isLoading}
          />
        </div>
      </div>

      {shiftTemplate && (
        <div className="form-section">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span>Active</span>
            </label>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : shiftTemplate ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};
