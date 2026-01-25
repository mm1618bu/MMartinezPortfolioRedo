/**
 * Buffer and SLA Configuration UI Component
 * Allows users to configure staffing buffers and SLA windows
 */

import React, { useState, useEffect } from 'react';
import {
  BufferSlaConfiguration,
  BufferConfig,
  SlaWindow,
  createDefaultConfiguration,
  validateBufferConfig,
  validateSlaWindow,
} from '../../utils/bufferSlaConfig';
import './BufferSlaConfig.css';

interface BufferSlaConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: BufferSlaConfiguration) => void;
  currentConfig?: BufferSlaConfiguration;
  organizationId?: string;
}

interface FormState {
  overallBuffer: BufferConfig;
  priorityBuffers: {
    low: BufferConfig;
    medium: BufferConfig;
    high: BufferConfig;
  };
  slaWindows: SlaWindow[];
  departmentBuffers: Record<string, BufferConfig>;
  activeTab: 'buffers' | 'sla';
  errors: Record<string, string>;
}

export const BufferSlaConfigComponent: React.FC<BufferSlaConfigProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
  organizationId = 'default',
}) => {
  const defaultConfig = createDefaultConfiguration(organizationId);
  const initialState: FormState = {
    overallBuffer: currentConfig?.buffers.overall || defaultConfig.buffers.overall,
    priorityBuffers: currentConfig?.buffers.byPriority || defaultConfig.buffers.byPriority,
    slaWindows: currentConfig?.slaWindows || defaultConfig.slaWindows,
    departmentBuffers: currentConfig?.buffers.byDepartment || {},
    activeTab: 'buffers',
    errors: {},
  };

  const [formState, setFormState] = useState<FormState>(initialState);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentConfig) {
      setFormState({
        overallBuffer: currentConfig.buffers.overall,
        priorityBuffers: currentConfig.buffers.byPriority,
        slaWindows: currentConfig.slaWindows,
        departmentBuffers: currentConfig.buffers.byDepartment,
        activeTab: 'buffers',
        errors: {},
      });
    }
  }, [currentConfig, isOpen]);

  const handleBufferChange = (
    bufferType: 'overall' | 'low' | 'medium' | 'high',
    field: keyof BufferConfig,
    value: any
  ) => {
    const newState = { ...formState };

    if (bufferType === 'overall') {
      newState.overallBuffer = {
        ...newState.overallBuffer,
        [field]: value,
      };
    } else {
      newState.priorityBuffers[bufferType] = {
        ...newState.priorityBuffers[bufferType],
        [field]: value,
      };
    }

    setFormState(newState);
  };

  const handleSlaWindowChange = (
    index: number,
    field: keyof SlaWindow,
    value: any
  ) => {
    const newWindows = [...formState.slaWindows];
    newWindows[index] = {
      ...newWindows[index],
      [field]: value,
    };
    setFormState({ ...formState, slaWindows: newWindows });
  };

  const handleAddSlaWindow = () => {
    const newWindow: SlaWindow = {
      id: `sla-custom-${Date.now()}`,
      name: 'New SLA Window',
      startTime: '09:00',
      endTime: '17:00',
      minimumStaffPercentage: 80,
      enabled: true,
    };
    setFormState({
      ...formState,
      slaWindows: [...formState.slaWindows, newWindow],
    });
  };

  const handleDeleteSlaWindow = (index: number) => {
    const newWindows = formState.slaWindows.filter((_, i) => i !== index);
    setFormState({ ...formState, slaWindows: newWindows });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate overall buffer
    const overallValidation = validateBufferConfig(formState.overallBuffer);
    if (!overallValidation.valid) {
      errors['overall'] = overallValidation.errors[0];
    }

    // Validate priority buffers
    Object.entries(formState.priorityBuffers).forEach(([priority, buffer]) => {
      const validation = validateBufferConfig(buffer);
      if (!validation.valid) {
        errors[`priority-${priority}`] = validation.errors[0];
      }
    });

    // Validate SLA windows
    formState.slaWindows.forEach((window, index) => {
      const validation = validateSlaWindow(window);
      if (!validation.valid) {
        errors[`sla-${index}`] = validation.errors[0];
      }
    });

    setFormState({ ...formState, errors });
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const config: BufferSlaConfiguration = {
        organizationId,
        buffers: {
          overall: formState.overallBuffer,
          byPriority: formState.priorityBuffers,
          byDepartment: formState.departmentBuffers,
        },
        slaWindows: formState.slaWindows,
        lastUpdated: new Date().toISOString(),
      };

      onSave(config);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormState(initialState);
  };

  if (!isOpen) return null;

  return (
    <div className="buffer-sla-config-overlay">
      <div className="buffer-sla-config-modal">
        <div className="buffer-sla-config-header">
          <h2>Buffer & SLA Configuration</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="buffer-sla-config-tabs">
          <button
            className={`tab-btn ${formState.activeTab === 'buffers' ? 'active' : ''}`}
            onClick={() => setFormState({ ...formState, activeTab: 'buffers' })}
          >
            📊 Buffer Settings
          </button>
          <button
            className={`tab-btn ${formState.activeTab === 'sla' ? 'active' : ''}`}
            onClick={() => setFormState({ ...formState, activeTab: 'sla' })}
          >
            ⏰ SLA Windows
          </button>
        </div>

        <div className="buffer-sla-config-content">
          {formState.activeTab === 'buffers' && (
            <div className="buffers-section">
              <div className="buffer-group">
                <h3>Overall Buffer</h3>
                <div className="buffer-form">
                  <label>
                    <input
                      type="checkbox"
                      checked={formState.overallBuffer.enabled}
                      onChange={e =>
                        handleBufferChange('overall', 'enabled', e.target.checked)
                      }
                    />
                    Enable overall buffer
                  </label>

                  <div className="form-row">
                    <label>
                      Type:
                      <select
                        value={formState.overallBuffer.type}
                        onChange={e =>
                          handleBufferChange('overall', 'type', e.target.value as 'percentage' | 'fixed')
                        }
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed (employees)</option>
                      </select>
                    </label>

                    <label>
                      Value:
                      <input
                        type="number"
                        min="0"
                        step={formState.overallBuffer.type === 'percentage' ? 0.1 : 1}
                        value={formState.overallBuffer.value}
                        onChange={e =>
                          handleBufferChange('overall', 'value', parseFloat(e.target.value))
                        }
                      />
                      {formState.overallBuffer.type === 'percentage' ? '%' : 'employees'}
                    </label>
                  </div>

                  {formState.errors['overall'] && (
                    <div className="error-message">{formState.errors['overall']}</div>
                  )}
                </div>
              </div>

              <div className="buffer-group">
                <h3>Priority-Based Buffers</h3>
                {(['low', 'medium', 'high'] as const).map(priority => (
                  <div key={priority} className="priority-buffer">
                    <label className="priority-label">
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                    </label>

                    <div className="form-row">
                      <label>
                        Type:
                        <select
                          value={formState.priorityBuffers[priority].type}
                          onChange={e =>
                            handleBufferChange(priority, 'type', e.target.value as 'percentage' | 'fixed')
                          }
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed (employees)</option>
                        </select>
                      </label>

                      <label>
                        Value:
                        <input
                          type="number"
                          min="0"
                          step={formState.priorityBuffers[priority].type === 'percentage' ? 0.1 : 1}
                          value={formState.priorityBuffers[priority].value}
                          onChange={e =>
                            handleBufferChange(priority, 'value', parseFloat(e.target.value))
                          }
                        />
                        {formState.priorityBuffers[priority].type === 'percentage' ? '%' : 'employees'}
                      </label>
                    </div>

                    {formState.errors[`priority-${priority}`] && (
                      <div className="error-message">
                        {formState.errors[`priority-${priority}`]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {formState.activeTab === 'sla' && (
            <div className="sla-section">
              <div className="sla-header">
                <h3>SLA Windows</h3>
                <button className="add-btn" onClick={handleAddSlaWindow}>
                  + Add Window
                </button>
              </div>

              {formState.slaWindows.map((window, index) => (
                <div key={window.id} className="sla-window">
                  <div className="sla-window-header">
                    <label className="sla-enable">
                      <input
                        type="checkbox"
                        checked={window.enabled}
                        onChange={e =>
                          handleSlaWindowChange(index, 'enabled', e.target.checked)
                        }
                      />
                      {window.name}
                    </label>
                    {!['sla-peak-hours', 'sla-business-hours', 'sla-full-day'].includes(window.id) && (
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteSlaWindow(index)}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {window.enabled && (
                    <div className="sla-form">
                      <label>
                        Name:
                        <input
                          type="text"
                          value={window.name}
                          onChange={e =>
                            handleSlaWindowChange(index, 'name', e.target.value)
                          }
                        />
                      </label>

                      <label>
                        Description:
                        <textarea
                          value={window.description || ''}
                          onChange={e =>
                            handleSlaWindowChange(index, 'description', e.target.value)
                          }
                          placeholder="Optional description"
                          rows={2}
                        />
                      </label>

                      <div className="form-row">
                        <label>
                          Start Time:
                          <input
                            type="time"
                            value={window.startTime}
                            onChange={e =>
                              handleSlaWindowChange(index, 'startTime', e.target.value)
                            }
                          />
                        </label>

                        <label>
                          End Time:
                          <input
                            type="time"
                            value={window.endTime}
                            onChange={e =>
                              handleSlaWindowChange(index, 'endTime', e.target.value)
                            }
                          />
                        </label>
                      </div>

                      <label>
                        Minimum Staff Required (%):
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="5"
                          value={window.minimumStaffPercentage}
                          onChange={e =>
                            handleSlaWindowChange(index, 'minimumStaffPercentage', parseFloat(e.target.value))
                          }
                        />
                        <span className="helper-text">
                          Minimum percentage of required staff that must be available
                        </span>
                      </label>

                      {formState.errors[`sla-${index}`] && (
                        <div className="error-message">
                          {formState.errors[`sla-${index}`]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="buffer-sla-config-footer">
          <button className="btn-reset" onClick={handleReset} disabled={isSaving}>
            Reset
          </button>
          <button className="btn-cancel" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BufferSlaConfigComponent;
