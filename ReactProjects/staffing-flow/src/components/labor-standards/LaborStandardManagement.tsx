import React, { useState, useEffect } from 'react';
import {
  laborStandardService,
  LaborStandard,
  CreateLaborStandardInput,
  LaborStandardStatistics,
} from '../../services/laborStandardService';
import { LaborStandardList } from './LaborStandardList';
import { LaborStandardForm } from './LaborStandardForm';
import './LaborStandardManagement.css';

type View = 'list' | 'create' | 'edit';

interface Alert {
  type: 'success' | 'error';
  message: string;
}

export const LaborStandardManagement: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [laborStandards, setLaborStandards] = useState<LaborStandard[]>([]);
  const [selectedLaborStandard, setSelectedLaborStandard] = useState<LaborStandard | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statistics, setStatistics] = useState<LaborStandardStatistics | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchLaborStandards();
  }, [currentPage, searchTerm, filterStatus]);

  const fetchLaborStandards = async () => {
    setIsLoading(true);
    try {
      const isActive = filterStatus === 'all' ? undefined : filterStatus === 'active';
      const response = await laborStandardService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        isActive,
      });

      setLaborStandards(response);
      setTotalPages(Math.ceil(response.length / itemsPerPage));
    } catch (error) {
      showAlert('error', 'Failed to load labor standards');
      console.error('Error fetching labor standards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async (id: string) => {
    try {
      const stats = await laborStandardService.getStatistics(id);
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleCreate = async (data: CreateLaborStandardInput) => {
    setIsLoading(true);
    try {
      await laborStandardService.create(data);
      showAlert('success', 'Labor standard created successfully');
      setView('list');
      fetchLaborStandards();
    } catch (error) {
      showAlert('error', 'Failed to create labor standard');
      console.error('Error creating labor standard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: CreateLaborStandardInput) => {
    if (!selectedLaborStandard) return;

    setIsLoading(true);
    try {
      await laborStandardService.update(selectedLaborStandard.id, data);
      showAlert('success', 'Labor standard updated successfully');
      setView('list');
      setSelectedLaborStandard(undefined);
      fetchLaborStandards();
    } catch (error) {
      showAlert('error', 'Failed to update labor standard');
      console.error('Error updating labor standard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await laborStandardService.delete(id);
      showAlert('success', 'Labor standard deleted successfully');
      fetchLaborStandards();
    } catch (error) {
      showAlert('error', 'Failed to delete labor standard');
      console.error('Error deleting labor standard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (laborStandard: LaborStandard) => {
    setSelectedLaborStandard(laborStandard);
    setView('edit');
  };

  const handleViewStats = (id: string) => {
    fetchStatistics(id);
    setShowStatsModal(true);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedLaborStandard(undefined);
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (status: 'all' | 'active' | 'inactive') => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="labor-standard-management">
      <header className="management-header">
        <h2>Labor Standards Management</h2>
        {view === 'list' && (
          <button className="btn btn-primary" onClick={() => setView('create')}>
            + Create Labor Standard
          </button>
        )}
      </header>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
          <button onClick={() => setAlert(null)} className="alert-close">
            ×
          </button>
        </div>
      )}

      {view === 'list' && (
        <>
          <div className="filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name, task type, or description..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>

            <div className="status-filters">
              <button
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
                onClick={() => handleFilterChange('active')}
              >
                Active
              </button>
              <button
                className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
                onClick={() => handleFilterChange('inactive')}
              >
                Inactive
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading">Loading labor standards...</div>
          ) : (
            <LaborStandardList
              laborStandards={laborStandards}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewStats={handleViewStats}
            />
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {(view === 'create' || view === 'edit') && (
        <div className="form-container">
          <LaborStandardForm
            laborStandard={selectedLaborStandard}
            organizationId="3b82d4f1-c270-4458-a109-249b91224064"
            onSubmit={view === 'create' ? handleCreate : handleUpdate}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      )}

      {showStatsModal && statistics && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Labor Standards Statistics</h3>
              <button className="modal-close" onClick={() => setShowStatsModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Tasks</div>
                  <div className="stat-value">{statistics.totalTasks}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Average Productivity</div>
                  <div className="stat-value">{statistics.averageProductivity.toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Compliance Rate</div>
                  <div className="stat-value">{statistics.complianceRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
