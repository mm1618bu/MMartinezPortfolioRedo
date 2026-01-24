import React, { useState } from 'react';
import { ShiftTemplate } from '../../services/shiftTemplateService';

interface ShiftTemplateListProps {
  shiftTemplates: ShiftTemplate[];
  onEdit: (shiftTemplate: ShiftTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onViewStats: () => void;
}

export const ShiftTemplateList: React.FC<ShiftTemplateListProps> = ({
  shiftTemplates,
  onEdit,
  onDelete,
  onDuplicate,
  // onViewStats is passed but not used in this component (used at management level)
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    if (deletingId === id) {
      onDelete(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const formatTime = (time: string) => {
    // Convert HH:MM:SS to HH:MM AM/PM
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getShiftTypeDisplay = (type?: string) => {
    if (!type) return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getShiftTypeBadgeClass = (type?: string) => {
    switch (type) {
      case 'morning':
        return 'shift-type-morning';
      case 'afternoon':
        return 'shift-type-afternoon';
      case 'evening':
        return 'shift-type-evening';
      case 'night':
        return 'shift-type-night';
      case 'split':
        return 'shift-type-split';
      default:
        return 'shift-type-default';
    }
  };

  if (shiftTemplates.length === 0) {
    return (
      <div className="empty-state">
        <p>No shift templates found. Create your first shift template to get started.</p>
      </div>
    );
  }

  return (
    <div className="shift-template-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Time</th>
            <th>Duration</th>
            <th>Employees</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shiftTemplates.map((template) => (
            <tr key={template.id} className={!template.is_active ? 'inactive-row' : ''}>
              <td>
                <strong>{template.name}</strong>
                {template.description && (
                  <div className="description-preview">
                    {template.description.substring(0, 60)}
                    {template.description.length > 60 ? '...' : ''}
                  </div>
                )}
              </td>
              <td>
                <span className={`shift-type-badge ${getShiftTypeBadgeClass(template.shift_type)}`}>
                  {getShiftTypeDisplay(template.shift_type)}
                </span>
              </td>
              <td>
                <div className="time-display">
                  <div>{formatTime(template.start_time)}</div>
                  <div className="time-separator">→</div>
                  <div>{formatTime(template.end_time)}</div>
                </div>
              </td>
              <td>
                <div>{template.duration_hours}h</div>
                {template.break_duration_minutes > 0 && (
                  <div className="break-duration">
                    Break: {template.break_duration_minutes}m
                  </div>
                )}
              </td>
              <td>
                <div className="employee-range">
                  {template.min_employees}
                  {template.max_employees && ` - ${template.max_employees}`}
                </div>
              </td>
              <td>
                <span className={`status-badge ${template.is_active ? 'status-active' : 'status-inactive'}`}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onDuplicate(template.id)}
                    title="Duplicate"
                  >
                    📋
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEdit(template)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className={`btn btn-sm ${
                      deletingId === template.id ? 'btn-danger-confirm' : 'btn-danger'
                    }`}
                    onClick={() => handleDeleteClick(template.id)}
                    title={deletingId === template.id ? 'Click again to confirm' : 'Delete'}
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
