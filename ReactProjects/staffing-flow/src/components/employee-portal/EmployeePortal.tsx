import { useState } from 'react';
import { LaborActionsCard } from './LaborActionsCard';
import { PTORequestCard } from './PTORequestCard';
import { UPTBalanceCard } from './UPTBalanceCard';
import { MyScheduleCard } from './MyScheduleCard';
import './EmployeePortal.css';

export interface EmployeeInfo {
  employee_id: string;
  employee_name: string;
  organization_id: string;
  department_id: string;
  department_name: string;
  email?: string;
  phone?: string;
}

interface EmployeePortalProps {
  employee?: EmployeeInfo;
}

export function EmployeePortal({ employee: propEmployee }: EmployeePortalProps) {
  // Mock employee for demo purposes
  const defaultEmployee: EmployeeInfo = {
    employee_id: 'emp-001',
    employee_name: 'John Doe',
    organization_id: 'org-123',
    department_id: 'dept-456',
    department_name: 'Warehouse A',
    email: 'john.doe@company.com',
  };

  const employee = propEmployee || defaultEmployee;
  const [activeTab, setActiveTab] = useState<'overview' | 'labor' | 'pto' | 'upt' | 'schedule'>('overview');

  return (
    <div className="employee-portal">
      <header className="portal-header">
        <div className="portal-header-content">
          <div className="employee-info">
            <h1>Welcome, {employee.employee_name}</h1>
            <p className="employee-details">
              {employee.department_name} • {employee.email}
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

      <nav className="portal-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'labor' ? 'active' : ''}`}
          onClick={() => setActiveTab('labor')}
        >
          <span className="tab-icon">💼</span>
          VET/VTO
        </button>
        <button
          className={`tab ${activeTab === 'pto' ? 'active' : ''}`}
          onClick={() => setActiveTab('pto')}
        >
          <span className="tab-icon">🌴</span>
          PTO
        </button>
        <button
          className={`tab ${activeTab === 'upt' ? 'active' : ''}`}
          onClick={() => setActiveTab('upt')}
        >
          <span className="tab-icon">⏰</span>
          Attendance
        </button>
        <button
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <span className="tab-icon">📅</span>
          My Schedule
        </button>
      </nav>

      <main className="portal-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <MyScheduleCard employee={employee} compact />
            <LaborActionsCard employee={employee} compact />
            <PTORequestCard employee={employee} compact />
            <UPTBalanceCard employee={employee} compact />
          </div>
        )}

        {activeTab === 'labor' && (
          <div className="tab-content">
            <LaborActionsCard employee={employee} />
          </div>
        )}

        {activeTab === 'pto' && (
          <div className="tab-content">
            <PTORequestCard employee={employee} />
          </div>
        )}

        {activeTab === 'upt' && (
          <div className="tab-content">
            <UPTBalanceCard employee={employee} />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="tab-content">
            <MyScheduleCard employee={employee} />
          </div>
        )}
      </main>
    </div>
  );
}
