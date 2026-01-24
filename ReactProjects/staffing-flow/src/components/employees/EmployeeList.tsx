import React, { useState } from 'react';
import { Employee } from '../../services/employeeService';

interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onViewStats: (id: string) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
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

  const getStatusBadge = (status: Employee['status']) => {
    const statusClasses = {
      active: 'status-badge status-active',
      inactive: 'status-badge status-inactive',
      on_leave: 'status-badge status-on-leave',
      terminated: 'status-badge status-terminated',
    };

    const statusLabels = {
      active: 'Active',
      inactive: 'Inactive',
      on_leave: 'On Leave',
      terminated: 'Terminated',
    };

    return (
      <span className={statusClasses[status]}>
        {statusLabels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (employees.length === 0) {
    return (
      <div className="empty-state">
        <p>No employees found. Create your first employee to get started.</p>
      </div>
    );
  }

  return (
    <div className="employee-list">
      <table>
        <thead>
          <tr>
            <th>Employee #</th>
            <th>Name</th>
            <th>Email</th>
            <th>Position</th>
            <th>Hire Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} className={employee.status !== 'active' ? 'inactive-row' : ''}>
              <td>
                <span className="employee-number">{employee.employee_number}</span>
              </td>
              <td>
                <strong>{employee.first_name} {employee.last_name}</strong>
              </td>
              <td>
                <a href={`mailto:${employee.email}`} className="email-link">
                  {employee.email}
                </a>
              </td>
              <td>{employee.position}</td>
              <td>{formatDate(employee.hire_date)}</td>
              <td>{getStatusBadge(employee.status)}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onViewStats(employee.id)}
                    title="View Statistics"
                  >
                    📊
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEdit(employee)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className={`btn btn-sm ${
                      deletingId === employee.id ? 'btn-danger-confirm' : 'btn-danger'
                    }`}
                    onClick={() => handleDeleteClick(employee.id)}
                    title={deletingId === employee.id ? 'Click again to confirm' : 'Delete'}
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
