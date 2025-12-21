/**
 * UserInterests Component
 * Displays user's interest profile and watch history
 * Useful for understanding personalization and managing preferences
 */

import React from 'react';
import { getUserProfile, getTopInterests, clearUserProfile } from '../utils/recommendationModel';

export default function UserInterests() {
  const profile = getUserProfile();
  const topInterests = getTopInterests(15);
  const hasHistory = profile.watchedVideos.length > 0;

  const handleClearProfile = () => {
    if (window.confirm('Are you sure you want to clear your watch history and interests? This will reset all personalized recommendations.')) {
      clearUserProfile();
      window.location.reload();
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '20px auto',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '600' }}>
        Your Interests & Recommendations
      </h2>

      {!hasHistory ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '16px', color: '#666', margin: '0 0 12px 0' }}>
            No watch history yet
          </p>
          <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>
            Start watching videos to get personalized recommendations
          </p>
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <StatCard
              label="Videos Watched"
              value={profile.watchedVideos.length}
              icon="👁️"
            />
            <StatCard
              label="Videos Liked"
              value={profile.likedVideos.length}
              icon="👍"
            />
            <StatCard
              label="Interests"
              value={Object.keys(profile.keywords).length}
              icon="🎯"
            />
          </div>

          {/* Top Interests */}
          {topInterests.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#333'
              }}>
                Your Top Interests
              </h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {topInterests.map(({ keyword, score }, index) => {
                  const maxScore = topInterests[0].score;
                  const intensity = Math.round((score / maxScore) * 100);
                  
                  return (
                    <div
                      key={keyword}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: `rgba(102, 126, 234, ${0.1 + (intensity / 100) * 0.3})`,
                        color: '#667eea',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{keyword}</span>
                      <span style={{
                        fontSize: '11px',
                        opacity: 0.7,
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>
                        {score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interest Distribution Chart */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '16px', 
              fontWeight: '600',
              color: '#333'
            }}>
              Interest Distribution
            </h3>
            <div style={{ 
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px'
            }}>
              {topInterests.slice(0, 10).map(({ keyword, score }) => {
                const maxScore = topInterests[0].score;
                const percentage = (score / maxScore) * 100;
                
                return (
                  <div key={keyword} style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                      fontSize: '13px'
                    }}>
                      <span style={{ fontWeight: '600', color: '#333' }}>{keyword}</span>
                      <span style={{ color: '#666' }}>{score}</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: '#667eea',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginTop: '24px'
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#856404'
            }}>
              Manage Your Data
            </h4>
            <p style={{ 
              margin: '0 0 12px 0', 
              fontSize: '13px', 
              color: '#856404',
              lineHeight: '1.5'
            }}>
              Your watch history and interests are stored locally in your browser. 
              Clearing this data will reset your personalized recommendations.
            </p>
            <button
              onClick={handleClearProfile}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
            >
              Clear Watch History & Interests
            </button>
          </div>
        </>
      )}

      {/* Info Box */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '8px'
      }}>
        <h4 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '14px', 
          fontWeight: '600',
          color: '#004085'
        }}>
          How Personalization Works
        </h4>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          fontSize: '13px',
          color: '#004085',
          lineHeight: '1.6'
        }}>
          <li>We track which videos you watch to learn your interests</li>
          <li>Liked videos have 3x the impact on your recommendations</li>
          <li>Keywords from your watched videos build your interest profile</li>
          <li>Recommendations balance popularity with your personal interests</li>
          <li>All data is stored locally - nothing is sent to servers</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>
        {icon}
      </div>
      <div style={{ 
        fontSize: '24px', 
        fontWeight: '700',
        color: '#667eea',
        marginBottom: '4px'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '12px', 
        color: '#666',
        fontWeight: '500'
      }}>
        {label}
      </div>
    </div>
  );
}
