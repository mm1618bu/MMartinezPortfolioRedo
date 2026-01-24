import React, { useState } from 'react';
import { Department } from '../../services/departmentService';

interface DepartmentListProps {
  departments: Department[];
  onEdit: (department: Department) => void;
  onDelete: (id: string) => void;
  onViewStats: (id: string) => void;
}

export const DepartmentList: React.FC<DepartmentListProps> = ({
  departments,
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

  if (departments.length === 0) {
    return (
      <div className="empty-state">
        <p>No departments found. Create your first department to get started.</p>
      </div>
    );
  }

  return (
    <div className="department-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Manager ID</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((department) => (
            <tr key={department.id}>
              <td>
                <strong>{department.name}</strong>
              </td>
              <td>
                {department.description ? (
                  <span className="description">{department.description}</span>
                ) : (
                  <span className="no-description">No description</span>
                )}
              </td>
              <td>
                {department.manager_id ? (
                  <span className="manager-id">{department.manager_id.substring(0, 8)}...</span>
                ) : (
                  <span className="no-manager">No manager assigned</span>
                )}
              </td>
              <td>{formatDate(department.created_at)}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onViewStats(department.id)}
                    title="View Statistics"
                  >
                    📊
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEdit(department)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className={`btn btn-sm ${
                      deletingId === department.id ? 'btn-danger-confirm' : 'btn-danger'
                    }`}
                    onClick={() => handleDeleteClick(department.id)}
                    title={deletingId === department.id ? 'Click again to confirm' : 'Delete'}
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
