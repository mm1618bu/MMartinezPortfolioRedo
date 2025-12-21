// src/front-end/components/AudienceDemographics.jsx
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVideoAnalytics, getChannelAnalytics } from '../utils/supabase';
import { aggregateDemographics, calculatePercentages, generateInsights, exportToCSV } from '../utils/demographicsUtils';
import DemographicChart from './DemographicChart';

/**
 * Audience Demographics Dashboard
 * Shows comprehensive demographic analytics for videos or channels
 */
export default function AudienceDemographics({ videoId = null, channelId = null, userId = null }) {
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, all
  const [activeTab, setActiveTab] = useState('overview'); // overview, devices, geography, time

  // Fetch analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['demographics', videoId, channelId, timeRange],
    queryFn: async () => {
      if (videoId) {
        return await getVideoAnalytics(videoId);
      } else if (channelId || userId) {
        return await getChannelAnalytics(channelId || userId);
      }
      return [];
    },
    enabled: !!(videoId || channelId || userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process demographics data
  const demographics = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return null;
    
    const aggregated = aggregateDemographics(analyticsData);
    return calculatePercentages(aggregated);
  }, [analyticsData]);

  // Generate insights
  const insights = useMemo(() => {
    if (!demographics) return [];
    return generateInsights(demographics);
  }, [demographics]);

  // Handle CSV export
  const handleExport = () => {
    if (!demographics) return;
    
    const csv = exportToCSV(demographics);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demographics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#666'
      }}>
        Loading demographics data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#f44336'
      }}>
        Error loading demographics: {error.message}
      </div>
    );
  }

  if (!demographics || demographics.totalViews === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>No Demographics Data Yet</h3>
        <p style={{ margin: 0, color: '#666' }}>
          Analytics data will appear here once you have views.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#333' }}>
            Audience Demographics
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Understand who's watching your content
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1565c0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1976d2'}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Views</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
            {demographics.totalViews.toLocaleString()}
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Top Device</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {demographics.byDevice[0]?.label || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {demographics.byDevice[0]?.percentage || '0'}% of views
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Top Region</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {demographics.byRegion[0]?.label || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {demographics.byRegion[0]?.percentage || '0'}% of views
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Peak Time</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {demographics.byTimeOfDay[0]?.label || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {demographics.byTimeOfDay[0]?.percentage || '0'}% of views
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>
            💡 Key Insights
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {insights.map((insight, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px'
                }}
              >
                <span style={{ fontSize: '24px' }}>{insight.icon}</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                    {insight.category}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    {insight.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        {['overview', 'devices', 'geography', 'time'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1976d2' : '2px solid transparent',
              color: activeTab === tab ? '#1976d2' : '#666',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            <DemographicChart data={demographics.byDevice} title="Devices" color="#1976d2" />
            <DemographicChart data={demographics.byBrowser} title="Browsers" color="#4caf50" />
            <DemographicChart data={demographics.byRegion} title="Geographic Regions" color="#ff9800" />
            <DemographicChart data={demographics.byTimeOfDay} title="Viewing Times" color="#9c27b0" />
          </div>
        )}

        {activeTab === 'devices' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            <DemographicChart data={demographics.byDevice} title="Device Types" color="#1976d2" maxItems={10} />
            <DemographicChart data={demographics.byOS} title="Operating Systems" color="#f44336" maxItems={10} />
            <DemographicChart data={demographics.byBrowser} title="Browsers" color="#4caf50" maxItems={10} />
            <DemographicChart data={demographics.byResolution} title="Screen Resolutions" color="#00bcd4" maxItems={10} />
          </div>
        )}

        {activeTab === 'geography' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
            <DemographicChart data={demographics.byRegion} title="Geographic Distribution" color="#ff9800" maxItems={10} />
          </div>
        )}

        {activeTab === 'time' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            <DemographicChart data={demographics.byTimeOfDay} title="Time of Day" color="#9c27b0" maxItems={4} />
            <DemographicChart data={demographics.byDayOfWeek} title="Day of Week" color="#e91e63" maxItems={7} />
          </div>
        )}
      </div>
    </div>
  );
}
