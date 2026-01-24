import React, { useState } from 'react';
import { LaborStandard } from '../../services/laborStandardService';

interface LaborStandardListProps {
  laborStandards: LaborStandard[];
  onEdit: (laborStandard: LaborStandard) => void;
  onDelete: (id: string) => void;
  onViewStats: (id: string) => void;
}

export const LaborStandardList: React.FC<LaborStandardListProps> = ({
  laborStandards,
  onEdit,
  onDelete,
  onViewStats,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatProductivity = (standard: LaborStandard) => {
    if (standard.standard_units_per_hour) {
      return `${standard.standard_units_per_hour} units/hr`;
    } else if (standard.standard_hours_per_unit) {
      return `${standard.standard_hours_per_unit} hrs/unit`;
    }
    return 'N/A';
  };

  if (laborStandards.length === 0) {
    return (
      <div className="empty-state">
        <p>No labor standards found. Create your first labor standard to get started.</p>
      </div>
    );
  }

  return (
    <div className="labor-standard-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Task Type</th>
            <th>Productivity</th>
            <th>Quality %</th>
            <th>Effective Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {laborStandards.map((standard) => (
            <tr key={standard.id} className={!standard.is_active ? 'inactive-row' : ''}>
              <td>
                <strong>{standard.name}</strong>
                {standard.description && (
                  <div className="description-preview">{standard.description.substring(0, 50)}{standard.description.length > 50 ? '...' : ''}</div>
                )}
              </td>
              <td>
                <span className="task-type">{standard.task_type}</span>
              </td>
              <td>{formatProductivity(standard)}</td>
              <td>
                {standard.quality_threshold_percentage ? (
                  <span className="quality-threshold">{standard.quality_threshold_percentage}%</span>
                ) : (
                  <span className="no-data">—</span>
                )}
              </td>
              <td>
                <div>{formatDate(standard.effective_date)}</div>
                {standard.end_date && (
                  <div className="end-date">to {formatDate(standard.end_date)}</div>
                )}
              </td>
              <td>
                <span className={`status-badge ${standard.is_active ? 'status-active' : 'status-inactive'}`}>
                  {standard.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onViewStats(standard.id)}
                    title="View Statistics"
                  >
                    📊
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEdit(standard)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className={`btn btn-sm ${
                      deletingId === standard.id ? 'btn-danger-confirm' : 'btn-danger'
                    }`}
                    onClick={() => handleDeleteClick(standard.id)}
                    title={deletingId === standard.id ? 'Click again to confirm' : 'Delete'}
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
