import { useState } from 'react';
import { LaborActionsCard } from './LaborActionsCard';
import APP_CONFIG from '../../config/app.config';
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
    organization_id: APP_CONFIG.DEFAULT_ORGANIZATION_ID,
    department_id: 'dept-456',
    department_name: 'Warehouse A',
    email: 'john.doe@company.com',
  };

  const employee = propEmployee || defaultEmployee;
  const [activeTab, setActiveTab] = useState<'labor'>('labor');

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
          className={`tab ${activeTab === 'labor' ? 'active' : ''}`}
          onClick={() => setActiveTab('labor')}
        >
          <span className="tab-icon">💼</span>
          VET/VTO
        </button>
      </nav>

      <main className="portal-content">
        {activeTab === 'labor' && (
          <div className="tab-content">
            <LaborActionsCard employee={employee} />
          </div>
        )}
      </main>
    </div>
  );
}
