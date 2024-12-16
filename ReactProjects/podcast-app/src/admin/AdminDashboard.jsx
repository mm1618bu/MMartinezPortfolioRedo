import React, { useState } from 'react';
import UserManagement from './UserManagement';
import ManagePodcast from './ManagePodcast';
import Analytics from './Analytics';
import ContentModeration from './ContentModeration';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('userManagement'); // Default active tab

  // Function to render content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'userManagement':
        return <UserManagement />;
      case 'managePodcast':
        return <ManagePodcast />;
      case 'analytics':
        return <Analytics />;
      case 'contentModeration':
        return <ContentModeration />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* Tab menu */}
      <div className="tab-menu">
        <div
          className={`tab-item ${activeTab === 'userManagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('userManagement')}
        >
          User Management
        </div>
        <div
          className={`tab-item ${activeTab === 'managePodcast' ? 'active' : ''}`}
          onClick={() => setActiveTab('managePodcast')}
        >
          Manage Podcasts
        </div>
        <div
          className={`tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </div>
        <div
          className={`tab-item ${activeTab === 'contentModeration' ? 'active' : ''}`}
          onClick={() => setActiveTab('contentModeration')}
        >
          Content Moderation
        </div>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {renderContent()}
      </div>

      <style jsx>{`
        .admin-dashboard {
          font-family: 'Arial', sans-serif;
          padding: 40px;
          background-color: #f8f9fa;
          color: #333;
          min-height: 100vh;
        }

        h1 {
          text-align: center;
          margin-bottom: 40px;
          color: #007bff;
        }

        .tab-menu {
          display: flex;
          background-color: #007bff;
          border-radius: 8px;
          padding: 10px;
          color: white;
          margin-bottom: 30px;
        }

        .tab-item {
          font-size: 18px;
          padding: 15px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          border-radius: 5px;
          margin-right: 10px;
        }

        .tab-item:hover {
          background-color: #0056b3;
        }

        .tab-item.active {
          background-color: #0056b3;
          font-weight: bold;
        }

        .tab-content {
          background-color: #fff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .tab-item {
            font-size: 14px;
            padding: 10px;
          }

          .tab-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
