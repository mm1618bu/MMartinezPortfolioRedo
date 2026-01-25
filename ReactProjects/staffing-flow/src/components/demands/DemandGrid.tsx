import React from 'react';
import { Demand, DemandGridResponse } from '../../services/demandService';

interface DemandGridProps {
  demands: Demand[];
  pagination: DemandGridResponse['pagination'];
  selectedIds: Set<string>;
  sortField: string;
  sortOrder: string;
  onSort: (field: string) => void;
  onSelectAll: (selected: boolean) => void;
  onSelectDemand: (id: string, selected: boolean) => void;
  onEdit: (demand: Demand) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const DemandGrid: React.FC<DemandGridProps> = ({
  demands,
  pagination,
  selectedIds,
  sortField,
  sortOrder,
  onSort,
  onSelectAll,
  onSelectDemand,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getShiftTypeLabel = (shiftType: string) => {
    const labels: Record<string, string> = {
      all_day: 'All Day',
      morning: '🌅 Morning',
      evening: '🌆 Evening',
      night: '🌙 Night',
    };
    return labels[shiftType] || shiftType;
  };

  const getPriorityBadge = (priority: string) => {
    const classes: Record<string, string> = {
      low: 'priority-badge priority-low',
      medium: 'priority-badge priority-medium',
      high: 'priority-badge priority-high',
    };
    return <span className={classes[priority] || classes.medium}>{priority.toUpperCase()}</span>;
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return ' ↕️';
    return sortOrder === 'ASC' ? ' ↑' : ' ↓';
  };

  const allSelected = demands.length > 0 && selectedIds.size === demands.length;

  return (
    <div className="demand-grid">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => onSelectAll(e.target.checked)}
                  title="Select all"
                />
              </th>
              <th className="sortable" onClick={() => onSort('date')}>
                Date {renderSortIcon('date')}
              </th>
              <th className="sortable" onClick={() => onSort('shift_type')}>
                Shift {renderSortIcon('shift_type')}
              </th>
              <th className="sortable" onClick={() => onSort('required_employees')}>
                Employees {renderSortIcon('required_employees')}
              </th>
              <th>Skills</th>
              <th className="sortable" onClick={() => onSort('priority')}>
                Priority {renderSortIcon('priority')}
              </th>
              <th>Notes</th>
              <th className="sortable" onClick={() => onSort('created_at')}>
                Created {renderSortIcon('created_at')}
              </th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {demands.map(demand => (
              <tr key={demand.id} className={selectedIds.has(demand.id) ? 'selected' : ''}>
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(demand.id)}
                    onChange={e => onSelectDemand(demand.id, e.target.checked)}
                  />
                </td>
                <td className="date-cell">
                  <strong>{formatDate(demand.date)}</strong>
                </td>
                <td className="shift-cell">{getShiftTypeLabel(demand.shift_type)}</td>
                <td className="employees-cell">
                  <span className="employee-badge">{demand.required_employees}</span>
                </td>
                <td className="skills-cell">
                  {demand.required_skills && demand.required_skills.length > 0 ? (
                    <div className="skills-list">
                      {demand.required_skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="no-skills">—</span>
                  )}
                </td>
                <td className="priority-cell">{getPriorityBadge(demand.priority)}</td>
                <td className="notes-cell">
                  <span className="notes-text">{demand.notes || '—'}</span>
                </td>
                <td className="created-cell">{formatDate(demand.created_at)}</td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onEdit(demand)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Delete this demand?')) {
                          onDelete(demand.id);
                        }
                      }}
                      title="Delete"
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

      {/* Pagination */}
      <div className="pagination-controls">
        <div className="pagination-info">
          Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
          {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
          {pagination.total} demands
        </div>

        <div className="pagination-buttons">
          <button
            className="btn btn-sm"
            onClick={() => onPageChange(1)}
            disabled={!pagination.hasPrevious}
          >
            ⏮ First
          </button>
          <button
            className="btn btn-sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevious}
          >
            ◀ Previous
          </button>

          <div className="page-input">
            <span>Page {pagination.page} of {pagination.totalPages}</span>
          </div>

          <button
            className="btn btn-sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
          >
            Next ▶
          </button>
          <button
            className="btn btn-sm"
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={!pagination.hasNext}
          >
            Last ⏭
          </button>
        </div>

        <div className="page-size-selector">
          <label htmlFor="pageSize">Rows per page:</label>
          <select
            id="pageSize"
            value={pagination.pageSize}
            onChange={e => onPageSizeChange(parseInt(e.target.value))}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DemandGrid;
