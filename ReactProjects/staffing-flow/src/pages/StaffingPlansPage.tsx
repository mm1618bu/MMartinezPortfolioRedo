import React, { useState } from 'react';
import { StaffingPlanDashboard, StaffingPlanManagement } from '../components/staffing-plans';

interface StaffingPlansPageProps {
  organizationId: string;
  departmentId?: string;
}

type PageTab = 'dashboard' | 'management';

export const StaffingPlansPage: React.FC<StaffingPlansPageProps> = ({
  organizationId,
  departmentId,
}) => {
  const [activeTab, setActiveTab] = useState<PageTab>('dashboard');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-300">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'dashboard'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveTab('management')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'management'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Plans & Assignments
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'dashboard' && (
            <StaffingPlanDashboard organizationId={organizationId} departmentId={departmentId} />
          )}
          {activeTab === 'management' && (
            <StaffingPlanManagement organizationId={organizationId} departmentId={departmentId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffingPlansPage;
