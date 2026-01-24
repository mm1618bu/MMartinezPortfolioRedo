import React, { useState, useEffect } from 'react';
import { EmployeeList } from './EmployeeList';
import { EmployeeForm } from './EmployeeForm';
import {
  employeeService,
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeStatistics,
} from '../../services/employeeService';

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Employee['status'] | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingStats, setViewingStats] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Demo organization ID - replace with actual auth context
  const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

  const itemsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
  }, [statusFilter, currentPage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getAll({
        organizationId: DEMO_ORG_ID,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleSubmit = async (data: CreateEmployeeInput | UpdateEmployeeInput) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, data as UpdateEmployeeInput);
        setSuccessMessage('Employee updated successfully!');
      } else {
        await employeeService.create(data as CreateEmployeeInput);
        setSuccessMessage('Employee created successfully!');
      }

      setShowForm(false);
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await employeeService.delete(id);
      setSuccessMessage('Employee deleted successfully!');
      await fetchEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  const handleViewStats = (id: string) => {
    setViewingStats(id);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: Employee['status'] | 'all') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  return (
    <div className="employee-management">
      <div className="page-header">
        <h1>Employee Management</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={handleCreate}>
            + Create Employee
          </button>
        )}
      </div>

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {showForm ? (
        <EmployeeForm
          employee={editingEmployee}
          organizationId={DEMO_ORG_ID}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      ) : (
        <>
          <div className="filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search employees (name, email, employee #)..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <div className="filter-group">
              <label>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value as Employee['status'] | 'all')}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading employees...</div>
          ) : (
            <>
              <EmployeeList
                employees={filteredEmployees}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewStats={handleViewStats}
              />

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {viewingStats && (
        <EmployeeStatisticsModal
          employeeId={viewingStats}
          onClose={() => setViewingStats(null)}
        />
      )}
    </div>
  );
};

interface EmployeeStatisticsModalProps {
  employeeId: string;
  onClose: () => void;
}

const EmployeeStatisticsModal: React.FC<EmployeeStatisticsModalProps> = ({
  employeeId,
  onClose,
}) => {
  const [stats, setStats] = useState<EmployeeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await employeeService.getStatistics(employeeId);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [employeeId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Employee Statistics</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading statistics...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Shifts</div>
                <div className="stat-value">{stats.totalShifts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Upcoming Shifts</div>
                <div className="stat-value">{stats.upcomingShifts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Skills</div>
                <div className="stat-value">{stats.skillCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Certifications</div>
                <div className="stat-value">{stats.certificationCount}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
