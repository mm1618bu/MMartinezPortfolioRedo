import React, { useState, useEffect, useCallback } from 'react';
import { demandService, Demand, DemandGridQuery, DemandGridResponse, DemandSummary } from '../../services/demandService';
import DemandGrid from './DemandGrid.tsx';
import DemandFilters from './DemandFilters.tsx';
import DemandForm from './DemandForm.tsx';
import { CSVExportModal } from './CSVExportModal';
import { HeadcountSummary } from './HeadcountSummary';
import APP_CONFIG from '../../config/app.config';
import './DemandEditor.css';

interface GridState {
  data: Demand[];
  pagination: DemandGridResponse['pagination'];
  filters: DemandGridResponse['filters'];
  sort: DemandGridResponse['sort'];
  loading: boolean;
  error: string | null;
}

interface FilterState {
  departmentIds: string[];
  shiftTypes: string[];
  priorities: string[];
  startDate: string;
  endDate: string;
  minEmployees?: number;
  maxEmployees?: number;
  search: string;
}

export const DemandEditor: React.FC = () => {
  const [gridState, setGridState] = useState<GridState>({
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { applied: {}, available: { departments: [], shiftTypes: [], priorities: [] } },
    sort: { field: 'date', order: 'desc' },
    loading: false,
    error: null,
  });

  const [filters, setFilters] = useState<FilterState>({
    departmentIds: [],
    shiftTypes: [],
    priorities: [],
    startDate: '',
    endDate: '',
    search: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [summary, setSummary] = useState<DemandSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCSVExportModal, setShowCSVExportModal] = useState(false);

  // Fetch grid data
  const fetchGridData = useCallback(async () => {
    setGridState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const query: DemandGridQuery = {
        organizationId: APP_CONFIG.DEFAULT_ORGANIZATION_ID,
        page: currentPage,
        pageSize,
        sortBy: (gridState.sort.field as any) || 'date',
        sortOrder: (gridState.sort.order as any) || 'desc',
        departmentIds: filters.departmentIds.length > 0 ? filters.departmentIds : undefined,
        shiftTypes: filters.shiftTypes.length > 0 ? filters.shiftTypes : undefined,
        priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        minEmployees: filters.minEmployees,
        maxEmployees: filters.maxEmployees,
        search: filters.search || undefined,
      };

      const response = await demandService.getGridData(query);
      setGridState(prev => ({
        ...prev,
        data: response.data,
        pagination: response.pagination,
        filters: response.filters,
        sort: response.sort,
        loading: false,
      }));
      setSelectedIds(new Set());
    } catch (error) {
      setGridState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch demands',
        loading: false,
      }));
    }
  }, [currentPage, pageSize, filters, gridState.sort]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const data = await demandService.getGridSummary({ organizationId: APP_CONFIG.DEFAULT_ORGANIZATION_ID });
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, []);

  // Initial load and refresh
  useEffect(() => {
    fetchGridData();
    fetchSummary();
  }, [fetchGridData, fetchSummary]);

  const handleSort = (field: string) => {
    const newOrder =
      gridState.sort.field === field && gridState.sort.order === 'desc' ? 'asc' : 'desc';

    setGridState(prev => ({
      ...prev,
      sort: { field, order: newOrder },
    }));

    setCurrentPage(1);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(gridState.data.map(d => d.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectDemand = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteDemand = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this demand?')) return;

    try {
      await demandService.deleteDemand(id);
      setSuccessMessage('Demand deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchGridData();
    } catch (error) {
      setGridState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete demand',
      }));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      setGridState(prev => ({ ...prev, error: 'No demands selected' }));
      return;
    }

    if (!window.confirm(`Delete ${selectedIds.size} selected demands?`)) return;

    try {
      await demandService.bulkDeleteDemands(Array.from(selectedIds));
      setSuccessMessage(`${selectedIds.size} demands deleted successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setSelectedIds(new Set());
      fetchGridData();
    } catch (error) {
      setGridState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete demands',
      }));
    }
  };

  const handleEditDemand = (demand: Demand) => {
    setEditingDemand(demand);
    setShowForm(true);
  };

  const handleCreateDemand = () => {
    setEditingDemand(null);
    setShowForm(true);
  };

  const handleFormSubmit = async () => {
    setSuccessMessage(editingDemand ? 'Demand updated successfully' : 'Demand created successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
    setShowForm(false);
    setEditingDemand(null);
    fetchGridData();
  };

  const handleExport = async (format: 'csv' | 'json' | 'xlsx') => {
    if (format === 'csv') {
      // Open enhanced CSV export modal
      setShowCSVExportModal(true);
      return;
    }

    // For JSON and XLSX, use the API export
    try {
      const blob = await demandService.exportDemands(
        {
          departmentIds: filters.departmentIds.length > 0 ? filters.departmentIds : undefined,
          shiftTypes: filters.shiftTypes.length > 0 ? filters.shiftTypes : undefined,
          priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          minEmployees: filters.minEmployees,
          maxEmployees: filters.maxEmployees,
          search: filters.search || undefined,
        },
        format
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demands-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setGridState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to export demands',
      }));
    }
  };

  return (
    <div className="demand-editor">
      <div className="editor-header">
        <h1>Demand Management</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleCreateDemand}>
            + New Demand
          </button>
          {selectedIds.size > 0 && (
            <button className="btn btn-danger" onClick={handleBulkDelete}>
              Delete {selectedIds.size} Selected
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Total Demands</div>
            <div className="summary-value">{summary.totalRecords}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Employees Needed</div>
            <div className="summary-value">{summary.totalEmployeesNeeded}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Avg Employees/Day</div>
            <div className="summary-value">{summary.averagePerDay.toFixed(1)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">High Priority</div>
            <div className="summary-value" style={{ color: '#d32f2f' }}>
              {summary.byPriority.high || 0}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {gridState.error && <div className="alert alert-error">{gridState.error}</div>}

      {/* Filters */}
      <DemandFilters
        filters={filters}
        availableOptions={gridState.filters.available}
        onFiltersChange={setFilters}
        onExport={handleExport}
      />

      {/* Headcount Summary */}
      {gridState.data.length > 0 && (
        <HeadcountSummary
          demands={gridState.data}
          departments={gridState.filters.available.departments}
          title="Demand Headcount Planning"
        />
      )}

      {/* Grid */}
      {gridState.loading ? (
        <div className="loading-spinner">
          <div>Loading demands...</div>
        </div>
      ) : gridState.data.length > 0 ? (
        <DemandGrid
          demands={gridState.data}
          pagination={gridState.pagination}
          selectedIds={selectedIds}
          sortField={gridState.sort.field}
          sortOrder={gridState.sort.order}
          onSort={handleSort}
          onSelectAll={handleSelectAll}
          onSelectDemand={handleSelectDemand}
          onEdit={handleEditDemand}
          onDelete={handleDeleteDemand}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      ) : (
        <div className="empty-state">
          <p>No demands found. Create your first demand to get started.</p>
          <button className="btn btn-primary" onClick={handleCreateDemand}>
            + Create Demand
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <DemandForm
          demand={editingDemand || undefined}
          onClose={() => {
            setShowForm(false);
            setEditingDemand(null);
          }}
          onSubmit={handleFormSubmit}
          departments={gridState.filters.available.departments}
        />
      )}

      {/* CSV Export Modal */}
      <CSVExportModal
        demands={gridState.data}
        isOpen={showCSVExportModal}
        onClose={() => setShowCSVExportModal(false)}
      />
    </div>
  );
};

export default DemandEditor;
