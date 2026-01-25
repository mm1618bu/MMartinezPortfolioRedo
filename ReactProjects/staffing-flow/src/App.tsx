import { useState } from 'react';
import './App.css';
import { SiteManagement } from './components/sites/SiteManagement';
import { DepartmentManagement } from './components/departments/DepartmentManagement';
import { EmployeeManagement } from './components/employees/EmployeeManagement';
import { LaborStandardManagement } from './components/labor-standards/LaborStandardManagement';
import { ShiftTemplateManagement } from './components/shift-templates/ShiftTemplateManagement';
import { DemandEditor } from './components/demands/DemandEditor.tsx';
import { DemandCharts } from './components/visualizations/DemandCharts.tsx';
import { DatabaseHealthCheck } from './components/admin/DatabaseHealthCheck';
import './components/departments/DepartmentManagement.css';
import './components/employees/EmployeeManagement.css';
import './components/labor-standards/LaborStandardManagement.css';
import './components/shift-templates/ShiftTemplateManagement.css';
import './components/demands/DemandEditor.css';
import './components/visualizations/DemandCharts.css';

type Page = 'home' | 'sites' | 'departments' | 'employees' | 'labor-standards' | 'shift-templates' | 'demands' | 'demand-charts' | 'health-check';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-brand">
          <h2>Staffing Flow</h2>
        </div>
        <div className="nav-links">
          <button className={currentPage === 'home' ? 'active' : ''} onClick={() => setCurrentPage('home')}>
            Home
          </button>
          <button className={currentPage === 'sites' ? 'active' : ''} onClick={() => setCurrentPage('sites')}>
            Sites
          </button>
          <button className={currentPage === 'departments' ? 'active' : ''} onClick={() => setCurrentPage('departments')}>
            Departments
          </button>
          <button className={currentPage === 'employees' ? 'active' : ''} onClick={() => setCurrentPage('employees')}>
            Employees
          </button>
          <button className={currentPage === 'labor-standards' ? 'active' : ''} onClick={() => setCurrentPage('labor-standards')}>
            Labor Standards
          </button>
          <button className={currentPage === 'shift-templates' ? 'active' : ''} onClick={() => setCurrentPage('shift-templates')}>
            Shift Templates
          </button>
          <button className={currentPage === 'demands' ? 'active' : ''} onClick={() => setCurrentPage('demands')}>
            Demand Planning
          </button>
          <button className={currentPage === 'demand-charts' ? 'active' : ''} onClick={() => setCurrentPage('demand-charts')}>
            Demand Analytics
          </button>
          <button className={currentPage === 'health-check' ? 'active' : ''} onClick={() => setCurrentPage('health-check')}>
            Database Health
          </button>
        </div>
      </nav>

      <main className="app-main">
        {currentPage === 'home' && (
          <div className="home-page">
            <h1>Welcome to Staffing Flow</h1>
            <p>A comprehensive staffing and workforce management system.</p>
            <div className="quick-actions">
              <button className="btn btn-primary btn-lg" onClick={() => setCurrentPage('sites')}>
                Manage Sites →
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => setCurrentPage('departments')}>
                Manage Departments →
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => setCurrentPage('employees')}>
                Manage Employees →
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => setCurrentPage('labor-standards')}>
                Manage Labor Standards →
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => setCurrentPage('shift-templates')}>
                Manage Shift Templates →
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => setCurrentPage('demands')}>
                Plan Demands →
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => setCurrentPage('demand-charts')}>
                View Analytics →
              </button>
            </div>
            <div className="feature-grid">
              <div className="feature-card">
                <h3>🏢 Site Management</h3>
                <p>Manage physical locations and facilities</p>
              </div>
              <div className="feature-card">
                <h3>🏛️ Department Management</h3>
                <p>Organize teams and departments</p>
              </div>
              <div className="feature-card">
                <h3>👥 Employee Management</h3>
                <p>Track employees and their assignments</p>
              </div>
              <div className="feature-card">
                <h3>📊 Labor Standards</h3>
                <p>Define productivity and quality benchmarks</p>
              </div>
              <div className="feature-card">
                <h3>📅 Shift Templates</h3>
                <p>Create reusable shift patterns and schedules</p>
              </div>
              <div className="feature-card">
                <h3>🎯 Skills Tracking</h3>
                <p>Monitor employee competencies and proficiency</p>
              </div>
              <div className="feature-card">
                <h3>📈 Demand Planning</h3>
                <p>Create and manage workforce demand forecasts</p>
              </div>
              <div className="feature-card">
                <h3>📉 Analytics & Charts</h3>
                <p>Visualize demand trends and requirements</p>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'sites' && <SiteManagement />}
        {currentPage === 'departments' && <DepartmentManagement />}
        {currentPage === 'employees' && <EmployeeManagement />}
        {currentPage === 'labor-standards' && <LaborStandardManagement />}
        {currentPage === 'shift-templates' && <ShiftTemplateManagement />}
        {currentPage === 'demands' && <DemandEditor />}
        {currentPage === 'demand-charts' && <DemandCharts />}
        {currentPage === 'health-check' && <DatabaseHealthCheck />}
      </main>
    </div>
  );
}

export default App;
