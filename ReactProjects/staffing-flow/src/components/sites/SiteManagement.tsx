import { useState, useEffect } from 'react';
import { siteService, type Site, type CreateSiteInput, type UpdateSiteInput } from '../../services/siteService';
import { SiteList } from './SiteList';
import { SiteForm } from './SiteForm';
import './SiteManagement.css';

interface SiteStatisticsModalProps {
  siteId: string;
  onClose: () => void;
}

function SiteStatisticsModal({ siteId, onClose }: SiteStatisticsModalProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await siteService.getStatistics(siteId);
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [siteId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Site Statistics</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {loading && <div className="loading">Loading statistics...</div>}
          {error && <div className="error-message">{error}</div>}
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Site Name</div>
                <div className="stat-value">{stats.site.name}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Site Code</div>
                <div className="stat-value">{stats.site.code}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Departments</div>
                <div className="stat-value">{stats.departmentCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Employees</div>
                <div className="stat-value">{stats.employeeCount}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteManagement() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingStats, setViewingStats] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await siteService.getAll({
        search: searchTerm || undefined,
        is_active: filterActive,
        page: currentPage,
        limit: 10,
      });
      setSites(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to fetch sites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [searchTerm, filterActive, currentPage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleCreate = () => {
    setEditingSite(null);
    setShowForm(true);
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setShowForm(true);
  };

  const handleSubmit = async (data: CreateSiteInput | UpdateSiteInput) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (editingSite) {
        await siteService.update(editingSite.id, data as UpdateSiteInput);
        setSuccessMessage('Site updated successfully!');
      } else {
        await siteService.create(data as CreateSiteInput);
        setSuccessMessage('Site created successfully!');
      }

      setShowForm(false);
      setEditingSite(null);
      fetchSites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await siteService.delete(id);
      setSuccessMessage('Site deleted successfully!');
      fetchSites();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSite(null);
  };

  const handleViewStats = (id: string) => {
    setViewingStats(id);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleFilterChange = (value: string) => {
    if (value === 'all') {
      setFilterActive(undefined);
    } else {
      setFilterActive(value === 'active');
    }
    setCurrentPage(1); // Reset to first page on filter
  };

  return (
    <div className="site-management">
      <div className="page-header">
        <h1>Site Management</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Create New Site
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          <span>✓</span> {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>✗</span> {error}
        </div>
      )}

      {showForm ? (
        <SiteForm
          site={editingSite}
          organizationId={'00000000-0000-0000-0000-000000000001'}
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
                placeholder="Search sites by name or code..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <label>Status:</label>
              <select value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'} onChange={(e) => handleFilterChange(e.target.value)}>
                <option value="all">All Sites</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading sites...</div>
          ) : (
            <>
              <SiteList sites={sites} onEdit={handleEdit} onDelete={handleDelete} onViewStats={handleViewStats} />

              {totalPages > 1 && (
                <div className="pagination">
                  <button className="btn btn-sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    Previous
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button className="btn btn-sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {viewingStats && <SiteStatisticsModal siteId={viewingStats} onClose={() => setViewingStats(null)} />}
    </div>
  );
}
