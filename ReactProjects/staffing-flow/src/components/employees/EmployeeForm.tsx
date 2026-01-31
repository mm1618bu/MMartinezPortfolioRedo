import React, { useState, useEffect } from 'react';
import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '../../services/employeeService';

interface EmployeeFormProps {
  employee?: Employee | null;
  organizationId?: string;
  onSubmit: (data: CreateEmployeeInput | UpdateEmployeeInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  organizationId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    employee_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    hire_date: '',
    department_id: '',
    position: '',
    status: 'active' as 'active' | 'inactive' | 'on_leave' | 'terminated',
    skills: '',
    certifications: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (employee) {
      setFormData({
        employee_number: employee.employee_number || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        hire_date: employee.hire_date?.split('T')[0] || '',
        department_id: employee.department_id || '',
        position: employee.position || '',
        status: employee.status || 'active',
        skills: employee.skills?.join(', ') || '',
        certifications: employee.certifications?.join(', ') || '',
      });
    }
  }, [employee]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'employee_number':
        if (!value.trim()) return 'Employee number is required';
        return '';
      case 'first_name':
        if (!value.trim()) return 'First name is required';
        return '';
      case 'last_name':
        if (!value.trim()) return 'Last name is required';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        return '';
      case 'phone':
        if (value && !/^[\d\s\-\(\)\+]+$/.test(value)) {
          return 'Invalid phone number format';
        }
        return '';
      case 'hire_date':
        if (!value) return 'Hire date is required';
        if (isNaN(Date.parse(value))) return 'Invalid date format';
        return '';
      case 'department_id':
        if (!value.trim()) return 'Department is required';
        if (!isValidUUID(value)) return 'Invalid department ID format';
        return '';
      case 'position':
        if (!value.trim()) return 'Position is required';
        return '';
      default:
        return '';
    }
  };

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    const requiredFields = ['employee_number', 'first_name', 'last_name', 'email', 'hire_date', 'department_id', 'position'];
    
    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field as keyof typeof formData] as string);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Validate optional fields if they have values
    if (formData.phone) {
      const phoneError = validateField('phone', formData.phone);
      if (phoneError) newErrors.phone = phoneError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(newErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    // Parse skills and certifications
    const skills = formData.skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const certifications = formData.certifications
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    // Prepare submission data
    if (employee) {
      // Update mode - only send changed fields
      const updates: UpdateEmployeeInput = {};
      
      if (formData.employee_number !== employee.employee_number) {
        updates.employee_number = formData.employee_number;
      }
      if (formData.first_name !== employee.first_name) {
        updates.first_name = formData.first_name;
      }
      if (formData.last_name !== employee.last_name) {
        updates.last_name = formData.last_name;
      }
      if (formData.email !== employee.email) {
        updates.email = formData.email;
      }
      if (formData.phone !== (employee.phone || '')) {
        updates.phone = formData.phone || undefined;
      }
      if (formData.hire_date !== employee.hire_date?.split('T')[0]) {
        updates.hire_date = formData.hire_date;
      }
      if (formData.department_id !== employee.department_id) {
        updates.department_id = formData.department_id;
      }
      if (formData.position !== employee.position) {
        updates.position = formData.position;
      }
      if (formData.status !== employee.status) {
        updates.status = formData.status;
      }
      
      const currentSkills = (employee.skills || []).join(', ');
      const currentCerts = (employee.certifications || []).join(', ');
      
      if (formData.skills !== currentSkills) {
        updates.skills = skills.length > 0 ? skills : undefined;
      }
      if (formData.certifications !== currentCerts) {
        updates.certifications = certifications.length > 0 ? certifications : undefined;
      }

      if (Object.keys(updates).length > 0) {
        onSubmit(updates);
      }
    } else {
      // Create mode
      const createData: CreateEmployeeInput = {
        employee_number: formData.employee_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        hire_date: formData.hire_date,
        department_id: formData.department_id,
        position: formData.position,
        status: formData.status,
        organization_id: organizationId,
      };
      
      if (formData.phone) createData.phone = formData.phone;
      if (skills.length > 0) createData.skills = skills;
      if (certifications.length > 0) createData.certifications = certifications;

      onSubmit(createData);
    }
  };

  return (
    <div className="employee-form-container">
      <div className="form-header">
        <h2>{employee ? 'Edit Employee' : 'Create New Employee'}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="employee-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employee_number">
                Employee Number <span className="required">*</span>
              </label>
              <input
                type="text"
                id="employee_number"
                name="employee_number"
                value={formData.employee_number}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.employee_number && touched.employee_number ? 'error' : ''}
                placeholder="e.g., EMP001"
                disabled={isLoading}
              />
              {errors.employee_number && touched.employee_number && (
                <span className="error-message">{errors.employee_number}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="status">
                Status <span className="required">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isLoading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.first_name && touched.first_name ? 'error' : ''}
                placeholder="Enter first name"
                disabled={isLoading}
              />
              {errors.first_name && touched.first_name && (
                <span className="error-message">{errors.first_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                Last Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.last_name && touched.last_name ? 'error' : ''}
                placeholder="Enter last name"
                disabled={isLoading}
              />
              {errors.last_name && touched.last_name && (
                <span className="error-message">{errors.last_name}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.email && touched.email ? 'error' : ''}
                placeholder="employee@company.com"
                disabled={isLoading}
              />
              {errors.email && touched.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.phone && touched.phone ? 'error' : ''}
                placeholder="(555) 123-4567"
                disabled={isLoading}
              />
              {errors.phone && touched.phone && (
                <span className="error-message">{errors.phone}</span>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Employment Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="position">
                Position <span className="required">*</span>
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.position && touched.position ? 'error' : ''}
                placeholder="e.g., Software Engineer"
                disabled={isLoading}
              />
              {errors.position && touched.position && (
                <span className="error-message">{errors.position}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="hire_date">
                Hire Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="hire_date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.hire_date && touched.hire_date ? 'error' : ''}
                disabled={isLoading}
              />
              {errors.hire_date && touched.hire_date && (
                <span className="error-message">{errors.hire_date}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="department_id">
              Department ID <span className="required">*</span>
            </label>
            <input
              type="text"
              id="department_id"
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.department_id && touched.department_id ? 'error' : ''}
              placeholder="Enter department UUID"
              disabled={isLoading}
            />
            {errors.department_id && touched.department_id && (
              <span className="error-message">{errors.department_id}</span>
            )}
            <span className="field-hint">
              Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            </span>
          </div>
        </div>

        <div className="form-section">
          <h3>Skills & Certifications</h3>
          
          <div className="form-group">
            <label htmlFor="skills">Skills</label>
            <textarea
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter skills separated by commas (e.g., JavaScript, Python, React)"
              rows={3}
              disabled={isLoading}
            />
            <span className="field-hint">
              Separate multiple skills with commas
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="certifications">Certifications</label>
            <textarea
              id="certifications"
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter certifications separated by commas (e.g., AWS Certified, PMP)"
              rows={3}
              disabled={isLoading}
            />
            <span className="field-hint">
              Separate multiple certifications with commas
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
            {isLoading ? 'Saving...' : employee ? 'Update Employee' : 'Create Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};
