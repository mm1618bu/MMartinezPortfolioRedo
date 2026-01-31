import React, { useState, useEffect } from 'react';
import { LaborStandard, CreateLaborStandardInput } from '../../services/laborStandardService';

interface LaborStandardFormProps {
  laborStandard?: LaborStandard;
  organizationId?: string;
  onSubmit: (data: CreateLaborStandardInput) => void;
  onCancel: () => void;
  isLoading: boolean;
}

type ProductivityType = 'units_per_hour' | 'hours_per_unit' | 'none';

export const LaborStandardForm: React.FC<LaborStandardFormProps> = ({
  laborStandard,
  organizationId,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState<CreateLaborStandardInput>({
    name: '',
    description: '',
    department_id: '',
    task_type: '',
    standard_units_per_hour: undefined,
    standard_hours_per_unit: undefined,
    quality_threshold_percentage: undefined,
    effective_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
    organization_id: organizationId || '3b82d4f1-c270-4458-a109-249b91224064', // Default to actual org ID
  });

  const [productivityType, setProductivityType] = useState<ProductivityType>('none');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (laborStandard) {
      setFormData({
        name: laborStandard.name,
        description: laborStandard.description || '',
        department_id: laborStandard.department_id || '',
        task_type: laborStandard.task_type,
        standard_units_per_hour: laborStandard.standard_units_per_hour,
        standard_hours_per_unit: laborStandard.standard_hours_per_unit,
        quality_threshold_percentage: laborStandard.quality_threshold_percentage,
        effective_date: laborStandard.effective_date,
        end_date: laborStandard.end_date || '',
        is_active: laborStandard.is_active,
        organization_id: laborStandard.organization_id,
      });

      // Set productivity type based on existing data
      if (laborStandard.standard_units_per_hour) {
        setProductivityType('units_per_hour');
      } else if (laborStandard.standard_hours_per_unit) {
        setProductivityType('hours_per_unit');
      } else {
        setProductivityType('none');
      }
    }
  }, [laborStandard]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleProductivityTypeChange = (type: ProductivityType) => {
    setProductivityType(type);
    
    // Clear both productivity metrics
    setFormData((prev) => ({
      ...prev,
      standard_units_per_hour: undefined,
      standard_hours_per_unit: undefined,
    }));

    // Clear productivity-related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.standard_units_per_hour;
      delete newErrors.standard_hours_per_unit;
      return newErrors;
    });
  };

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

    if (!formData.task_type.trim()) {
      newErrors.task_type = 'Task type is required';
    } else if (formData.task_type.length > 100) {
      newErrors.task_type = 'Task type must be 100 characters or less';
    }

    // Validate productivity metrics
    if (productivityType === 'units_per_hour') {
      if (!formData.standard_units_per_hour || formData.standard_units_per_hour <= 0) {
        newErrors.standard_units_per_hour = 'Must be a positive number';
      }
    } else if (productivityType === 'hours_per_unit') {
      if (!formData.standard_hours_per_unit || formData.standard_hours_per_unit <= 0) {
        newErrors.standard_hours_per_unit = 'Must be a positive number';
      }
    }

    // Validate quality threshold
    if (
      formData.quality_threshold_percentage !== undefined &&
      (formData.quality_threshold_percentage < 0 || formData.quality_threshold_percentage > 100)
    ) {
      newErrors.quality_threshold_percentage = 'Must be between 0 and 100';
    }

    // Validate dates
    if (!formData.effective_date) {
      newErrors.effective_date = 'Effective date is required';
    }

    if (formData.end_date && formData.effective_date) {
      const effectiveDate = new Date(formData.effective_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= effectiveDate) {
        newErrors.end_date = 'End date must be after effective date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Prepare submission data
    const submitData: CreateLaborStandardInput = {
      ...formData,
      description: formData.description || undefined,
      department_id: formData.department_id || undefined,
      end_date: formData.end_date || undefined,
    };

    // Ensure only one productivity metric is set
    if (productivityType === 'units_per_hour') {
      submitData.standard_hours_per_unit = undefined;
    } else if (productivityType === 'hours_per_unit') {
      submitData.standard_units_per_hour = undefined;
    } else {
      submitData.standard_units_per_hour = undefined;
      submitData.standard_hours_per_unit = undefined;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="labor-standard-form">
      <h3>{laborStandard ? 'Edit Labor Standard' : 'Create Labor Standard'}</h3>

      {/* Basic Information Section */}
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
          />
          <div className="char-counter">{formData.name.length}/200</div>
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="task_type">
            Task Type <span className="required">*</span>
          </label>
          <input
            type="text"
            id="task_type"
            name="task_type"
            value={formData.task_type}
            onChange={handleChange}
            placeholder="e.g., Picking, Packing, Stowing"
            maxLength={100}
            disabled={isLoading}
          />
          <div className="char-counter">{formData.task_type.length}/100</div>
          {errors.task_type && <div className="error-message">{errors.task_type}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            maxLength={1000}
            placeholder="Detailed description of the labor standard..."
            disabled={isLoading}
          />
          <div className="char-counter">{formData.description?.length || 0}/1000</div>
          {errors.description && <div className="error-message">{errors.description}</div>}
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

      {/* Productivity Metrics Section */}
      <div className="form-section">
        <h4>Productivity Metrics</h4>

        <div className="form-group">
          <label>Productivity Type</label>
          <div className="productivity-type-selector">
            <label className="radio-option">
              <input
                type="radio"
                name="productivity_type"
                checked={productivityType === 'none'}
                onChange={() => handleProductivityTypeChange('none')}
                disabled={isLoading}
              />
              <span>Not Specified</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="productivity_type"
                checked={productivityType === 'units_per_hour'}
                onChange={() => handleProductivityTypeChange('units_per_hour')}
                disabled={isLoading}
              />
              <span>Units per Hour</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="productivity_type"
                checked={productivityType === 'hours_per_unit'}
                onChange={() => handleProductivityTypeChange('hours_per_unit')}
                disabled={isLoading}
              />
              <span>Hours per Unit</span>
            </label>
          </div>
        </div>

        {productivityType === 'units_per_hour' && (
          <div className="form-group">
            <label htmlFor="standard_units_per_hour">
              Standard Units per Hour <span className="required">*</span>
            </label>
            <input
              type="number"
              id="standard_units_per_hour"
              name="standard_units_per_hour"
              value={formData.standard_units_per_hour || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="e.g., 50.5"
              disabled={isLoading}
            />
            {errors.standard_units_per_hour && (
              <div className="error-message">{errors.standard_units_per_hour}</div>
            )}
          </div>
        )}

        {productivityType === 'hours_per_unit' && (
          <div className="form-group">
            <label htmlFor="standard_hours_per_unit">
              Standard Hours per Unit <span className="required">*</span>
            </label>
            <input
              type="number"
              id="standard_hours_per_unit"
              name="standard_hours_per_unit"
              value={formData.standard_hours_per_unit || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="e.g., 0.5"
              disabled={isLoading}
            />
            {errors.standard_hours_per_unit && (
              <div className="error-message">{errors.standard_hours_per_unit}</div>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="quality_threshold_percentage">Quality Threshold (%)</label>
          <input
            type="number"
            id="quality_threshold_percentage"
            name="quality_threshold_percentage"
            value={formData.quality_threshold_percentage || ''}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g., 95.5"
            disabled={isLoading}
          />
          {errors.quality_threshold_percentage && (
            <div className="error-message">{errors.quality_threshold_percentage}</div>
          )}
        </div>
      </div>

      {/* Validity Period Section */}
      <div className="form-section">
        <h4>Validity Period</h4>

        <div className="form-group">
          <label htmlFor="effective_date">
            Effective Date <span className="required">*</span>
          </label>
          <input
            type="date"
            id="effective_date"
            name="effective_date"
            value={formData.effective_date}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.effective_date && (
            <div className="error-message">{errors.effective_date}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="end_date">End Date</label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.end_date && <div className="error-message">{errors.end_date}</div>}
        </div>

        {laborStandard && (
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
        )}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : laborStandard ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};
