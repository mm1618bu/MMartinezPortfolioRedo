import { useState } from 'react';
import type { Site } from '../../services/siteService';

interface SiteListProps {
  sites: Site[];
  onEdit: (site: Site) => void;
  onDelete: (id: string) => void;
  onViewStats: (id: string) => void;
}

export function SiteList({ sites, onEdit, onDelete, onViewStats }: SiteListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatAddress = (site: Site) => {
    const parts = [
      site.address_line1,
      site.address_line2,
      site.city,
      site.state,
      site.zip_code,
      site.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  return (
    <div className="site-list">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Address</th>
            <th>Timezone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sites.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                No sites found
              </td>
            </tr>
          ) : (
            sites.map((site) => (
              <tr key={site.id} className={!site.is_active ? 'inactive' : ''}>
                <td>
                  <strong>{site.name}</strong>
                </td>
                <td>
                  <code>{site.code}</code>
                </td>
                <td>{formatAddress(site)}</td>
                <td>{site.timezone || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${site.is_active ? 'active' : 'inactive'}`}>
                    {site.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onViewStats(site.id)}
                      title="View Statistics"
                    >
                      📊
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onEdit(site)}
                      title="Edit Site"
                    >
                      ✏️
                    </button>
                    <button
                      className={`btn btn-sm ${deleteConfirm === site.id ? 'btn-danger-confirm' : 'btn-danger'}`}
                      onClick={() => handleDelete(site.id)}
                      title={deleteConfirm === site.id ? 'Click again to confirm' : 'Delete Site'}
                    >
                      {deleteConfirm === site.id ? '⚠️' : '🗑️'}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
