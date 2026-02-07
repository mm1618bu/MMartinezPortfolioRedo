import React, { useState, useEffect } from 'react';
import { Department, CreateDepartmentInput, UpdateDepartmentInput } from '../../services/departmentService';

interface DepartmentFormProps {
  department?: Department | null;
  organizationId?: string;
  onSubmit: (data: CreateDepartmentInput | UpdateDepartmentInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  organizationId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        description: department.description || '',
        manager_id: department.manager_id || '',
      });
    }
  }, [department]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) {
          return 'Department name is required';
        }
        if (value.length > 100) {
          return 'Name must be 100 characters or less';
        }
        return '';
      case 'description':
        if (value && value.length > 500) {
          return 'Description must be 500 characters or less';
        }
        return '';
      case 'manager_id':
        if (value && !isValidUUID(value)) {
          return 'Invalid manager ID format';
        }
        return '';
      default:
        return '';
    }
  };

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({
        name: true,
        description: true,
        manager_id: true,
      });
      return;
    }

    // Prepare submission data
    if (department) {
      // Update mode - only send changed fields
      const updates: UpdateDepartmentInput = {};
      if (formData.name !== department.name) {
        updates.name = formData.name;
      }
      if (formData.description !== (department.description || '')) {
        updates.description = formData.description || undefined;
      }
      if (formData.manager_id !== (department.manager_id || '')) {
        updates.manager_id = formData.manager_id || undefined;
      }

      if (Object.keys(updates).length > 0) {
        onSubmit(updates);
      }
    } else {
      // Create mode
      if (!organizationId) {
        setErrors((prev) => ({ ...prev, name: 'Organization ID is required' }));
        return;
      }

      const createData: CreateDepartmentInput = {
        name: formData.name,
        organization_id: organizationId,
      };
      
      if (formData.description) {
        createData.description = formData.description;
      }
      if (formData.manager_id) {
        createData.manager_id = formData.manager_id;
      }

      onSubmit(createData);
    }
  };

  return (
    <div className="department-form-container">
      <div className="form-header">
        <h2>{department ? 'Edit Department' : 'Create New Department'}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="department-form">
        <div className="form-section">
          <h3>Department Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">
              Department Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.name && touched.name ? 'error' : ''}
              placeholder="Enter department name"
              disabled={isLoading}
            />
            {errors.name && touched.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.description && touched.description ? 'error' : ''}
              placeholder="Enter department description (optional)"
              rows={4}
              disabled={isLoading}
            />
            {errors.description && touched.description && (
              <span className="error-message">{errors.description}</span>
            )}
            <span className="field-hint">
              {formData.description.length}/500 characters
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="manager_id">Manager ID</label>
            <input
              type="text"
              id="manager_id"
              name="manager_id"
              value={formData.manager_id}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.manager_id && touched.manager_id ? 'error' : ''}
              placeholder="Enter manager UUID (optional)"
              disabled={isLoading}
            />
            {errors.manager_id && touched.manager_id && (
              <span className="error-message">{errors.manager_id}</span>
            )}
            <span className="field-hint">
              Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            </span>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : department ? 'Update Department' : 'Create Department'}
          </button>
        </div>
      </form>
    </div>
  );
};
