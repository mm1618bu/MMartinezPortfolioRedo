import { useState, useEffect } from 'react';
import type { Site, CreateSiteInput, UpdateSiteInput } from '../../services/siteService';

interface SiteFormProps {
  site?: Site | null;
  organizationId: string;
  onSubmit: (data: CreateSiteInput | UpdateSiteInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC',
];

export function SiteForm({ site, organizationId, onSubmit, onCancel, isLoading }: SiteFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    timezone: 'America/New_York',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        code: site.code,
        address_line1: site.address_line1 || '',
        address_line2: site.address_line2 || '',
        city: site.city || '',
        state: site.state || '',
        zip_code: site.zip_code || '',
        country: site.country || 'USA',
        timezone: site.timezone || 'America/New_York',
        is_active: site.is_active,
      });
    }
  }, [site]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Site name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Site code is required';
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and hyphens';
    }

    if (formData.zip_code && !/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Invalid ZIP code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const submitData = site
        ? // Update mode - only include changed fields
          (Object.fromEntries(
            Object.entries(formData).filter(([key, value]) => {
              return value !== (site as any)[key];
            })
          ) as UpdateSiteInput)
        : // Create mode - include organization_id
          ({ ...formData, organization_id: organizationId } as CreateSiteInput);

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="site-form-container">
      <div className="form-header">
        <h2>{site ? 'Edit Site' : 'Create New Site'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="site-form">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label htmlFor="name">
              Site Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Main Warehouse"
              disabled={isLoading}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="code">
              Site Code <span className="required">*</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className={errors.code ? 'error' : ''}
              placeholder="MAIN-WH-01"
              disabled={isLoading}
              style={{ textTransform: 'uppercase' }}
            />
            {errors.code && <span className="error-message">{errors.code}</span>}
            <small>Uppercase letters, numbers, and hyphens only</small>
          </div>

          <div className="form-group">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              disabled={isLoading}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {site && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span>Active Site</span>
              </label>
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Address</h3>

          <div className="form-group">
            <label htmlFor="address_line1">Address Line 1</label>
            <input
              type="text"
              id="address_line1"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              placeholder="123 Main Street"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address_line2">Address Line 2</label>
            <input
              type="text"
              id="address_line2"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              placeholder="Suite 100"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="NY"
                disabled={isLoading}
                maxLength={2}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="zip_code">ZIP Code</label>
              <input
                type="text"
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                className={errors.zip_code ? 'error' : ''}
                placeholder="10001"
                disabled={isLoading}
              />
              {errors.zip_code && <span className="error-message">{errors.zip_code}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="USA"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : site ? 'Update Site' : 'Create Site'}
          </button>
        </div>
      </form>
    </div>
  );
}
