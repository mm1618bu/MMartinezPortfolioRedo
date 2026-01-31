import { useState } from 'react';
import { VETVTOManagement } from './VETVTOManagement';
import { PTOApprovalDashboard } from './PTOApprovalDashboard';
import { UPTManagement } from './UPTManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import './LaborActionsManagement.css';

export interface ManagerInfo {
  manager_id: string;
  manager_name: string;
  organization_id: string;
  department_id?: string;
  department_name?: string;
  role: 'manager' | 'hr' | 'admin';
}

interface LaborActionsManagementProps {
  manager?: ManagerInfo;
}

export function LaborActionsManagement({ manager: propManager }: LaborActionsManagementProps) {
  // Mock manager for demo
  const defaultManager: ManagerInfo = {
    manager_id: 'mgr-001',
    manager_name: 'Sarah Johnson',
    organization_id: 'org-123',
    department_id: 'dept-456',
    department_name: 'Warehouse A',
    role: 'manager',
  };

  const manager = propManager || defaultManager;
  const [activeTab, setActiveTab] = useState<'overview' | 'vet-vto' | 'pto' | 'upt' | 'analytics'>('overview');

  return (
    <div className="labor-actions-management">
      <header className="management-header">
        <div className="management-header-content">
          <div className="manager-info">
            <h1>Labor Actions Management</h1>
            <p className="manager-details">
              {manager.manager_name} • {manager.department_name || 'All Departments'} • {manager.role.toUpperCase()}
            </p>
          </div>
          <div className="current-date">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </header>

      <nav className="management-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'vet-vto' ? 'active' : ''}`}
          onClick={() => setActiveTab('vet-vto')}
        >
          <span className="tab-icon">💼</span>
          VET/VTO
        </button>
        <button
          className={`tab ${activeTab === 'pto' ? 'active' : ''}`}
          onClick={() => setActiveTab('pto')}
        >
          <span className="tab-icon">🌴</span>
          PTO Approvals
        </button>
        <button
          className={`tab ${activeTab === 'upt' ? 'active' : ''}`}
          onClick={() => setActiveTab('upt')}
        >
          <span className="tab-icon">⏰</span>
          UPT Management
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span className="tab-icon">📈</span>
          Analytics
        </button>
      </nav>

      <main className="management-content">
        {activeTab === 'overview' && (
          <div className="overview-dashboard">
            <div className="overview-cards">
              <PTOApprovalDashboard manager={manager} compact />
              <UPTManagement manager={manager} compact />
              <VETVTOManagement manager={manager} compact />
              <AnalyticsDashboard manager={manager} compact />
            </div>
          </div>
        )}

        {activeTab === 'vet-vto' && (
          <div className="tab-content">
            <VETVTOManagement manager={manager} />
          </div>
        )}

        {activeTab === 'pto' && (
          <div className="tab-content">
            <PTOApprovalDashboard manager={manager} />
          </div>
        )}

        {activeTab === 'upt' && (
          <div className="tab-content">
            <UPTManagement manager={manager} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="tab-content">
            <AnalyticsDashboard manager={manager} />
          </div>
        )}
      </main>
    </div>
  );
}
