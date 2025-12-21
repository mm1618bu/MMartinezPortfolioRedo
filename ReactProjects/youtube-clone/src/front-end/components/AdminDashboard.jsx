import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  supabase,
  getUserRole,
  getAllUsersWithRoles,
  grantUserRole,
  revokeUserRole,
  getAdminAuditLog,
  getRoleStatistics,
  adminSuspendUser,
  adminUnsuspendUser,
  logAdminAction
} from '../utils/supabase';
import '../../styles/main.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  // Check if user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        
        setCurrentUser(user);
        const role = await getUserRole(user.id);
        setUserRole(role);
        
        if (role !== 'admin' && role !== 'moderator') {
          alert('Access denied. Admin privileges required.');
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  // Query users
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: getAllUsersWithRoles,
    enabled: !!currentUser && (userRole === 'admin' || userRole === 'moderator'),
    staleTime: 30000,
  });

  // Query audit log
  const { data: auditLog = [], isLoading: auditLoading } = useQuery({
    queryKey: ['auditLog'],
    queryFn: () => getAdminAuditLog(50),
    enabled: !!currentUser && userRole === 'admin',
    staleTime: 10000,
  });

  // Query role statistics
  const { data: roleStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['roleStats'],
    queryFn: getRoleStatistics,
    enabled: !!currentUser && userRole === 'admin',
    staleTime: 60000,
  });

  const handleGrantRole = async (userId, newRole) => {
    if (!window.confirm(`Grant ${newRole} role to this user?`)) return;
    
    try {
      await grantUserRole(userId, newRole, currentUser.id);
      await logAdminAction(currentUser.id, 'grant_role', 'user', userId, { role: newRole });
      await refetchUsers();
      setShowRoleModal(false);
      alert('Role granted successfully');
    } catch (error) {
      console.error('Error granting role:', error);
      alert('Failed to grant role');
    }
  };

  const handleRevokeRole = async (userId) => {
    if (!window.confirm('Revoke role from this user? They will become a viewer.')) return;
    
    try {
      await revokeUserRole(userId);
      await logAdminAction(currentUser.id, 'revoke_role', 'user', userId);
      await refetchUsers();
      alert('Role revoked successfully');
    } catch (error) {
      console.error('Error revoking role:', error);
      alert('Failed to revoke role');
    }
  };

  const handleSuspendUser = async () => {
    if (!suspensionReason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }
    
    try {
      await adminSuspendUser(currentUser.id, selectedUser.id, suspensionReason);
      await refetchUsers();
      setShowSuspendModal(false);
      setSuspensionReason('');
      setSelectedUser(null);
      alert('User suspended successfully');
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    if (!window.confirm('Unsuspend this user?')) return;
    
    try {
      await adminUnsuspendUser(currentUser.id, userId);
      await refetchUsers();
      alert('User unsuspended successfully');
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Failed to unsuspend user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      admin: 'role-badge-admin',
      moderator: 'role-badge-moderator',
      creator: 'role-badge-creator',
      viewer: 'role-badge-viewer'
    };
    return classes[role] || 'role-badge-viewer';
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>🔐 Admin Dashboard</h1>
          <p className="admin-subtitle">System Administration & User Management</p>
        </div>
        <div className="admin-header-info">
          <span className={`role-badge ${getRoleBadgeClass(userRole)}`}>{userRole}</span>
          <button className="admin-back-button" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="admin-nav">
        <button
          className={`admin-nav-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`admin-nav-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
          {users.length > 0 && <span className="nav-count">{users.length}</span>}
        </button>
        {userRole === 'admin' && (
          <button
            className={`admin-nav-button ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            📝 Audit Log
          </button>
        )}
      </div>

      {/* Content */}
      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="admin-overview">
            <h2>System Overview</h2>
            
            {statsLoading ? (
              <div className="admin-loading">Loading statistics...</div>
            ) : (
              <div className="admin-stats-grid">
                {roleStats.map((stat) => (
                  <div key={stat.role} className="admin-stat-card">
                    <div className="stat-icon">
                      {stat.role === 'admin' && '🔐'}
                      {stat.role === 'moderator' && '🛡️'}
                      {stat.role === 'creator' && '🎬'}
                      {stat.role === 'viewer' && '👁️'}
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{stat.active_count || 0}</div>
                      <div className="stat-label">{stat.role}s</div>
                      <div className="stat-sublabel">
                        {stat.user_count || 0} total • {stat.temp_count || 0} temporary
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-info-section">
              <h3>Admin Capabilities</h3>
              <ul className="admin-capabilities-list">
                <li>👥 Manage user roles and permissions</li>
                <li>🛡️ Suspend/unsuspend user accounts</li>
                <li>🎬 Delete any video or comment</li>
                <li>📊 View all analytics and statistics</li>
                <li>📝 Access comprehensive audit logs</li>
                <li>⚙️ Configure system settings</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-users-section">
            <div className="section-header">
              <h2>User Management</h2>
              <p className="section-description">
                Manage user roles, permissions, and account status
              </p>
            </div>

            {usersLoading ? (
              <div className="admin-loading">Loading users...</div>
            ) : (
              <div className="admin-users-table-container">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Sign In</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-email-cell">
                            <span className="user-email">{user.email}</span>
                            {user.user_metadata?.suspended && (
                              <span className="suspended-badge">Suspended</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.email_confirmed_at ? 'confirmed' : 'pending'}`}>
                            {user.email_confirmed_at ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>{formatDate(user.last_sign_in_at)}</td>
                        <td>
                          <div className="action-buttons">
                            {userRole === 'admin' && user.id !== currentUser.id && (
                              <>
                                <button
                                  className="action-btn role-btn"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowRoleModal(true);
                                  }}
                                >
                                  Change Role
                                </button>
                                {user.user_metadata?.suspended ? (
                                  <button
                                    className="action-btn unsuspend-btn"
                                    onClick={() => handleUnsuspendUser(user.id)}
                                  >
                                    Unsuspend
                                  </button>
                                ) : (
                                  <button
                                    className="action-btn suspend-btn"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowSuspendModal(true);
                                    }}
                                  >
                                    Suspend
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && userRole === 'admin' && (
          <div className="admin-audit-section">
            <h2>Audit Log</h2>
            <p className="section-description">Recent administrative actions</p>

            {auditLoading ? (
              <div className="admin-loading">Loading audit log...</div>
            ) : auditLog.length === 0 ? (
              <div className="admin-empty">No audit entries yet</div>
            ) : (
              <div className="audit-log-list">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="audit-entry">
                    <div className="audit-header">
                      <span className="audit-action">{entry.action}</span>
                      <span className="audit-time">{formatDate(entry.created_at)}</span>
                    </div>
                    <div className="audit-details">
                      <span>Admin: {entry.admin_user_id}</span>
                      {entry.target_type && (
                        <span> • Target: {entry.target_type} ({entry.target_id})</span>
                      )}
                    </div>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <div className="audit-metadata">
                        {JSON.stringify(entry.details)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Change User Role</h3>
            <p>Select a new role for {selectedUser.email}</p>
            <div className="role-options">
              {['admin', 'moderator', 'creator', 'viewer'].map((role) => (
                <button
                  key={role}
                  className={`role-option-btn ${getRoleBadgeClass(role)}`}
                  onClick={() => handleGrantRole(selectedUser.id, role)}
                  disabled={selectedUser.role === role}
                >
                  {role}
                </button>
              ))}
            </div>
            <button className="modal-close-btn" onClick={() => setShowRoleModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowSuspendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Suspend User</h3>
            <p>Suspend {selectedUser.email}</p>
            <textarea
              className="suspension-reason-input"
              placeholder="Reason for suspension..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
            />
            <div className="modal-actions">
              <button className="modal-confirm-btn" onClick={handleSuspendUser}>
                Suspend User
              </button>
              <button className="modal-cancel-btn" onClick={() => setShowSuspendModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
