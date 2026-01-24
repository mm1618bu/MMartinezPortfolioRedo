import React, { useState, useEffect } from 'react';
import {
  shiftTemplateService,
  ShiftTemplate,
  CreateShiftTemplateInput,
  ShiftTemplateStatistics,
} from '../../services/shiftTemplateService';
import { ShiftTemplateList } from './ShiftTemplateList';
import { ShiftTemplateForm } from './ShiftTemplateForm';
import './ShiftTemplateManagement.css';

type View = 'list' | 'create' | 'edit';

interface Alert {
  type: 'success' | 'error';
  message: string;
}

export const ShiftTemplateManagement: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [selectedShiftTemplate, setSelectedShiftTemplate] = useState<ShiftTemplate | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterShiftType, setFilterShiftType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statistics, setStatistics] = useState<ShiftTemplateStatistics | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchShiftTemplates();
  }, [currentPage, searchTerm, filterStatus, filterShiftType]);

  const fetchShiftTemplates = async () => {
    setIsLoading(true);
    try {
      const isActive = filterStatus === 'all' ? undefined : filterStatus === 'active';
      const shiftType = filterShiftType === 'all' ? undefined : filterShiftType as any;
      
      const response = await shiftTemplateService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        isActive,
        shiftType,
      });

      setShiftTemplates(response);
      setTotalPages(Math.ceil(response.length / itemsPerPage));
    } catch (error) {
      showAlert('error', 'Failed to load shift templates');
      console.error('Error fetching shift templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await shiftTemplateService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleCreate = async (data: CreateShiftTemplateInput) => {
    setIsLoading(true);
    try {
      await shiftTemplateService.create(data);
      showAlert('success', 'Shift template created successfully');
      setView('list');
      fetchShiftTemplates();
    } catch (error) {
      showAlert('error', 'Failed to create shift template');
      console.error('Error creating shift template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: CreateShiftTemplateInput) => {
    if (!selectedShiftTemplate) return;

    setIsLoading(true);
    try {
      await shiftTemplateService.update(selectedShiftTemplate.id, data);
      showAlert('success', 'Shift template updated successfully');
      setView('list');
      setSelectedShiftTemplate(undefined);
      fetchShiftTemplates();
    } catch (error) {
      showAlert('error', 'Failed to update shift template');
      console.error('Error updating shift template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await shiftTemplateService.delete(id);
      showAlert('success', 'Shift template deleted successfully');
      fetchShiftTemplates();
    } catch (error) {
      showAlert('error', 'Failed to delete shift template');
      console.error('Error deleting shift template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    const template = shiftTemplates.find((t) => t.id === id);
    if (!template) return;

    const newName = prompt('Enter name for duplicated template:', `${template.name} (Copy)`);
    if (!newName) return;

    setIsLoading(true);
    try {
      await shiftTemplateService.duplicate(id, newName);
      showAlert('success', 'Shift template duplicated successfully');
      fetchShiftTemplates();
    } catch (error) {
      showAlert('error', 'Failed to duplicate shift template');
      console.error('Error duplicating shift template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (shiftTemplate: ShiftTemplate) => {
    setSelectedShiftTemplate(shiftTemplate);
    setView('edit');
  };

  const handleViewStats = () => {
    fetchStatistics();
    setShowStatsModal(true);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedShiftTemplate(undefined);
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterStatusChange = (status: 'all' | 'active' | 'inactive') => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleFilterShiftTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterShiftType(e.target.value);
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
    <div className="shift-template-management">
      <header className="management-header">
        <h2>Shift Templates Management</h2>
        {view === 'list' && (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={handleViewStats}>
              📊 View Statistics
            </button>
            <button className="btn btn-primary" onClick={() => setView('create')}>
              + Create Shift Template
            </button>
          </div>
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
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>

            <div className="filter-row">
              <div className="status-filters">
                <button
                  className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterStatusChange('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
                  onClick={() => handleFilterStatusChange('active')}
                >
                  Active
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
                  onClick={() => handleFilterStatusChange('inactive')}
                >
                  Inactive
                </button>
              </div>

              <div className="shift-type-filter">
                <select value={filterShiftType} onChange={handleFilterShiftTypeChange}>
                  <option value="all">All Shift Types</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                  <option value="split">Split</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="loading">Loading shift templates...</div>
          ) : (
            <ShiftTemplateList
              shiftTemplates={shiftTemplates}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
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
          <ShiftTemplateForm
            shiftTemplate={selectedShiftTemplate}
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
              <h3>Shift Templates Statistics</h3>
              <button className="modal-close" onClick={() => setShowStatsModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Templates</div>
                  <div className="stat-value">{statistics.totalTemplates}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active Templates</div>
                  <div className="stat-value">{statistics.activeTemplates}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Capacity</div>
                  <div className="stat-value">{statistics.totalCapacity}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Avg Duration</div>
                  <div className="stat-value">{statistics.averageDuration.toFixed(1)}h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
