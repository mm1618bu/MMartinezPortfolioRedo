import React, { useState, useEffect } from 'react';
import { ShiftTemplate, CreateShiftTemplateInput } from '../../services/shiftTemplateService';

interface ShiftTemplateFormProps {
  shiftTemplate?: ShiftTemplate;
  organizationId?: string;
  onSubmit: (data: CreateShiftTemplateInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ShiftTemplateForm: React.FC<ShiftTemplateFormProps> = ({
  shiftTemplate,
  organizationId,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState<CreateShiftTemplateInput>({
    name: '',
    description: '',
    start_time: '09:00',
    end_time: '17:00',
    days_of_week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    is_full_day: false,
    is_active: true,
    organization_id: organizationId || '3b82d4f1-c270-4458-a109-249b91224064',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (shiftTemplate) {
      setFormData({
        name: shiftTemplate.name,
        description: shiftTemplate.description || '',
        start_time: shiftTemplate.start_time,
        end_time: shiftTemplate.end_time,
        days_of_week: shiftTemplate.days_of_week || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        is_full_day: shiftTemplate.is_full_day || false,
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
    if (formData.is_full_day) return;
    
    const startParts = formData.start_time.split(':').map(Number);
    const endParts = formData.end_time.split(':').map(Number);
    
    const startMinutes = startParts[0] * 60 + startParts[1];
    let endMinutes = endParts[0] * 60 + endParts[1];
    
    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.round((durationMinutes / 60) * 100) / 100;
    
    return hours;
  };

  useEffect(() => {
    if (formData.start_time && formData.end_time && !formData.is_full_day) {
      calculateDuration();
    }
  }, [formData.start_time, formData.end_time, formData.is_full_day]);

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

    if (!formData.is_full_day) {
      if (!formData.start_time.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
        newErrors.start_time = 'Invalid time format (HH:MM)';
      }

      if (!formData.end_time.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
        newErrors.end_time = 'Invalid time format (HH:MM)';
      }

      if (formData.start_time >= formData.end_time) {
        newErrors.end_time = 'End time must be after start time (or next day for overnight shifts)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData: CreateShiftTemplateInput = {
      name: formData.name,
      description: formData.description || undefined,
      start_time: formData.start_time,
      end_time: formData.end_time,
      days_of_week: formData.days_of_week,
      is_full_day: formData.is_full_day,
      is_active: formData.is_active,
      organization_id: formData.organization_id,
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
      </div>

      <div className="form-section">
        <h4>Time & Duration</h4>

        {!formData.is_full_day && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_time">
                Start Time <span className="required">*</span>
              </label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
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
                value={formData.end_time}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.end_time && <div className="error-message">{errors.end_time}</div>}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="is_full_day">
            <input
              type="checkbox"
              id="is_full_day"
              name="is_full_day"
              checked={formData.is_full_day}
              onChange={handleChange}
              disabled={isLoading}
            />
            Full Day Shift
          </label>
        </div>

        {formData.days_of_week && (
          <div className="form-group">
            <label>Days of Week</label>
            <div className="days-selector">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <label key={day} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.days_of_week?.includes(day) || false}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        days_of_week: e.target.checked
                          ? [...(prev.days_of_week || []), day]
                          : (prev.days_of_week || []).filter((d) => d !== day),
                      }));
                    }}
                    disabled={isLoading}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <h4>Status</h4>

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
