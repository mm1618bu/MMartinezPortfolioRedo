import React, { useState, useEffect } from 'react';
import { DepartmentList } from './DepartmentList';
import { DepartmentForm } from './DepartmentForm';
import {
  departmentService,
  Department,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  DepartmentStatistics,
} from '../../services/departmentService';

export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingStats, setViewingStats] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchDepartments();
  }, [searchTerm, currentPage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDepartment(null);
    setShowForm(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setShowForm(true);
  };

  const handleSubmit = async (data: CreateDepartmentInput | UpdateDepartmentInput) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (editingDepartment) {
        await departmentService.update(editingDepartment.id, data as UpdateDepartmentInput);
        setSuccessMessage('Department updated successfully!');
      } else {
        await departmentService.create(data as CreateDepartmentInput);
        setSuccessMessage('Department created successfully!');
      }

      setShowForm(false);
      setEditingDepartment(null);
      await fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDepartment(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await departmentService.delete(id);
      setSuccessMessage('Department deleted successfully!');
      await fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    }
  };

  const handleViewStats = (id: string) => {
    setViewingStats(id);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  return (
    <div className="department-management">
      <div className="page-header">
        <h1>Department Management</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={handleCreate}>
            + Create Department
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
        <DepartmentForm
          department={editingDepartment}
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
                placeholder="Search departments..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading departments...</div>
          ) : (
            <>
              <DepartmentList
                departments={filteredDepartments}
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
        <DepartmentStatisticsModal
          departmentId={viewingStats}
          onClose={() => setViewingStats(null)}
        />
      )}
    </div>
  );
};

interface DepartmentStatisticsModalProps {
  departmentId: string;
  onClose: () => void;
}

const DepartmentStatisticsModal: React.FC<DepartmentStatisticsModalProps> = ({
  departmentId,
  onClose,
}) => {
  const [stats, setStats] = useState<DepartmentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await departmentService.getStatistics(departmentId);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [departmentId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Department Statistics</h2>
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
                <div className="stat-label">Total Employees</div>
                <div className="stat-value">{stats.employeeCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Active Employees</div>
                <div className="stat-value">{stats.activeEmployees}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Shifts This Week</div>
                <div className="stat-value">{stats.shiftsThisWeek}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
