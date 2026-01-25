import React, { useState, useEffect } from 'react';
import { Demand, demandService, CreateDemandInput, UpdateDemandInput } from '../../services/demandService';

interface DemandFormProps {
  demand?: Demand;
  departments: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: () => void;
}

const DemandForm: React.FC<DemandFormProps> = ({ demand, departments, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<{
    date: string;
    shift_type: 'all_day' | 'morning' | 'evening' | 'night';
    start_time: string;
    end_time: string;
    required_employees: number;
    required_skills: string[];
    priority: 'low' | 'medium' | 'high';
    notes: string;
    department_id: string;
  }>({
    date: '',
    shift_type: 'all_day',
    start_time: '',
    end_time: '',
    required_employees: 1,
    required_skills: [],
    priority: 'medium',
    notes: '',
    department_id: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [organizationId, setOrganizationId] = useState('');

  // Initialize form with demand data if editing
  useEffect(() => {
    if (demand) {
      setFormData({
        date: demand.date,
        shift_type: demand.shift_type,
        start_time: demand.start_time || '',
        end_time: demand.end_time || '',
        required_employees: demand.required_employees,
        required_skills: demand.required_skills || [],
        priority: demand.priority,
        notes: demand.notes || '',
        department_id: demand.department_id || '',
      });
      setOrganizationId(demand.organization_id);
    } else {
      // Get organization from current user/session
      const orgId = localStorage.getItem('organization_id');
      if (orgId) setOrganizationId(orgId);
    }
  }, [demand]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseInt(value) : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.required_skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skill),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.date || !organizationId) {
        throw new Error('Date and organization are required');
      }

      if (formData.shift_type !== 'all_day') {
        if (!formData.start_time || !formData.end_time) {
          throw new Error('Start and end times are required for specific shifts');
        }
      }

      if (demand) {
        // Update existing demand
        const updateInput: UpdateDemandInput = {
          date: formData.date,
          shift_type: formData.shift_type,
          start_time: formData.shift_type === 'all_day' ? undefined : formData.start_time,
          end_time: formData.shift_type === 'all_day' ? undefined : formData.end_time,
          required_employees: formData.required_employees,
          required_skills: formData.required_skills.length > 0 ? formData.required_skills : undefined,
          priority: formData.priority,
          notes: formData.notes || undefined,
          department_id: formData.department_id || undefined,
        };

        await demandService.updateDemand(demand.id, updateInput);
      } else {
        // Create new demand
        const createInput: CreateDemandInput = {
          date: formData.date,
          shift_type: formData.shift_type,
          start_time: formData.shift_type === 'all_day' ? undefined : formData.start_time,
          end_time: formData.shift_type === 'all_day' ? undefined : formData.end_time,
          required_employees: formData.required_employees,
          required_skills: formData.required_skills.length > 0 ? formData.required_skills : undefined,
          priority: formData.priority,
          notes: formData.notes || undefined,
          organization_id: organizationId,
          department_id: formData.department_id || undefined,
        };

        await demandService.createDemand(createInput);
      }

      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isAllDay = formData.shift_type === 'all_day';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{demand ? 'Edit Demand' : 'Create New Demand'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="demand-form">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Date */}
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              id="date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Shift Type */}
          <div className="form-group">
            <label htmlFor="shift_type">Shift Type *</label>
            <select
              id="shift_type"
              name="shift_type"
              value={formData.shift_type}
              onChange={handleInputChange}
            >
              <option value="all_day">All Day</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </div>

          {/* Times (if not all_day) */}
          {!isAllDay && (
            <>
              <div className="form-group">
                <label htmlFor="start_time">Start Time *</label>
                <input
                  id="start_time"
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required={!isAllDay}
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_time">End Time *</label>
                <input
                  id="end_time"
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required={!isAllDay}
                />
              </div>
            </>
          )}

          {/* Required Employees */}
          <div className="form-group">
            <label htmlFor="required_employees">Required Employees *</label>
            <input
              id="required_employees"
              type="number"
              name="required_employees"
              value={formData.required_employees}
              onChange={handleInputChange}
              min="1"
              max="1000"
              required
            />
          </div>

          {/* Department */}
          <div className="form-group">
            <label htmlFor="department_id">Department</label>
            <select
              id="department_id"
              name="department_id"
              value={formData.department_id}
              onChange={handleInputChange}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="form-group">
            <label htmlFor="priority">Priority *</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Skills */}
          <div className="form-group">
            <label>Required Skills</label>
            <div className="skill-input-group">
              <input
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add a skill and press Enter"
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddSkill}
              >
                Add
              </button>
            </div>

            {formData.required_skills.length > 0 && (
              <div className="skills-display">
                {formData.required_skills.map(skill => (
                  <span key={skill} className="skill-tag-removable">
                    {skill}
                    <button
                      type="button"
                      className="skill-remove"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Add notes about this demand..."
              maxLength={500}
            />
            <small className="char-count">
              {formData.notes.length}/500
            </small>
          </div>

          {/* Buttons */}
          <div className="form-buttons">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : demand ? 'Update Demand' : 'Create Demand'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemandForm;
