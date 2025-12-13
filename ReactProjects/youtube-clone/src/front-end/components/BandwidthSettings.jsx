/**
 * BandwidthSettings Component
 * User settings for video quality and data usage preferences
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUserBandwidthPreferences, 
  updateBandwidthPreferences,
  calculateBandwidthSaved,
  getUserBandwidthStats,
  estimateDataUsage,
  QUALITY_LEVELS
} from '../utils/compressionUtils';
import { supabase } from '../utils/supabase';

export default function BandwidthSettings() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  // Fetch user preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['bandwidthPreferences', currentUser?.id],
    queryFn: () => getUserBandwidthPreferences(currentUser.id),
    enabled: !!currentUser
  });

  // Fetch bandwidth saved
  const { data: saved } = useQuery({
    queryKey: ['bandwidthSaved', currentUser?.id],
    queryFn: () => calculateBandwidthSaved(currentUser.id),
    enabled: !!currentUser
  });

  // Fetch usage stats
  const { data: stats } = useQuery({
    queryKey: ['bandwidthStats', currentUser?.id],
    queryFn: () => getUserBandwidthStats(currentUser.id, 30),
    enabled: !!currentUser
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (newPrefs) => updateBandwidthPreferences(currentUser.id, newPrefs),
    onSuccess: () => {
      queryClient.invalidateQueries(['bandwidthPreferences', currentUser?.id]);
    }
  });

  const handleUpdate = (updates) => {
    updatePreferencesMutation.mutate(updates);
  };

  if (!currentUser) {
    return (
      <div className="bandwidth-settings">
        <div className="auth-message">
          <p>Please log in to manage your bandwidth settings.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bandwidth-settings">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="bandwidth-settings">
      <div className="settings-container">
        <h2 className="settings-title">Bandwidth & Quality Settings</h2>
        <p className="settings-description">
          Manage your video quality preferences and data usage
        </p>

        {/* Data Usage Stats */}
        {(saved || stats) && (
          <div className="stats-section">
            <h3>Your Usage Statistics</h3>
            <div className="stats-grid">
              {stats && (
                <>
                  <div className="stat-card">
                    <div className="stat-value">{stats.totalGB} GB</div>
                    <div className="stat-label">Total Data Used (30 days)</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.totalSessions}</div>
                    <div className="stat-label">Videos Watched</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.avgSpeed} Kbps</div>
                    <div className="stat-label">Average Speed</div>
                  </div>
                </>
              )}
              {saved && saved.total_gb_saved > 0 && (
                <div className="stat-card highlight">
                  <div className="stat-value">{saved.total_gb_saved} GB</div>
                  <div className="stat-label">Data Saved</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto Quality Setting */}
        <div className="setting-section">
          <div className="setting-header">
            <h3>Auto Quality</h3>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences?.auto_quality ?? true}
                onChange={(e) => handleUpdate({ auto_quality: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="setting-description">
            Automatically adjust video quality based on your network speed for smooth playback
          </p>
        </div>

        {/* Preferred Quality */}
        <div className="setting-section">
          <div className="setting-header">
            <h3>Preferred Quality</h3>
          </div>
          <p className="setting-description">
            Your preferred video quality when auto quality is disabled
          </p>
          <select
            className="quality-select"
            value={preferences?.preferred_quality || '720p'}
            onChange={(e) => handleUpdate({ preferred_quality: e.target.value })}
          >
            {Object.entries(QUALITY_LEVELS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label} - {value.bitrate} Kbps
              </option>
            ))}
          </select>
        </div>

        {/* Maximum Quality */}
        <div className="setting-section">
          <div className="setting-header">
            <h3>Maximum Quality</h3>
          </div>
          <p className="setting-description">
            Never exceed this quality level, even on fast connections
          </p>
          <select
            className="quality-select"
            value={preferences?.max_quality || '1080p'}
            onChange={(e) => handleUpdate({ max_quality: e.target.value })}
          >
            {Object.entries(QUALITY_LEVELS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label} - {value.bitrate} Kbps
              </option>
            ))}
          </select>
        </div>

        {/* Data Saver Mode */}
        <div className="setting-section">
          <div className="setting-header">
            <h3>Data Saver Mode</h3>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences?.data_saver_mode ?? false}
                onChange={(e) => handleUpdate({ data_saver_mode: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="setting-description">
            Reduce video quality to save data. Ideal for mobile connections or limited data plans
          </p>
        </div>

        {/* Preload Next Video */}
        <div className="setting-section">
          <div className="setting-header">
            <h3>Preload Next Video</h3>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences?.preload_next_video ?? true}
                onChange={(e) => handleUpdate({ preload_next_video: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <p className="setting-description">
            Start loading the next video in playlists for instant playback
          </p>
        </div>

        {/* Bandwidth Limit */}
        <div className="setting-section">
          <div className="setting-header">
            <h3>Bandwidth Limit (Optional)</h3>
          </div>
          <p className="setting-description">
            Set a maximum bandwidth cap in Mbps. Leave empty for unlimited
          </p>
          <input
            type="number"
            className="bandwidth-input"
            placeholder="e.g., 10"
            min="0.5"
            max="100"
            step="0.5"
            value={preferences?.bandwidth_limit_mbps || ''}
            onChange={(e) => handleUpdate({ 
              bandwidth_limit_mbps: e.target.value ? parseFloat(e.target.value) : null 
            })}
          />
        </div>

        {/* Data Usage Estimator */}
        <div className="setting-section estimator">
          <h3>Data Usage Estimator</h3>
          <p className="setting-description">
            Estimate how much data you'll use watching videos
          </p>
          <div className="estimator-grid">
            {Object.entries(QUALITY_LEVELS).map(([key, value]) => {
              const hourlyUsage = estimateDataUsage(60, key);
              return (
                <div key={key} className="estimator-row">
                  <div className="quality-label">{value.label}</div>
                  <div className="usage-value">{hourlyUsage.formatted}/hour</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quality Distribution */}
        {stats?.qualityDistribution && Object.keys(stats.qualityDistribution).length > 0 && (
          <div className="setting-section">
            <h3>Your Quality Distribution</h3>
            <p className="setting-description">
              How often you watch at each quality level
            </p>
            <div className="quality-distribution">
              {Object.entries(stats.qualityDistribution).map(([quality, count]) => {
                const percentage = (count / stats.totalSessions) * 100;
                return (
                  <div key={quality} className="distribution-bar">
                    <div className="distribution-label">
                      <span>{quality}</span>
                      <span>{count} sessions ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="distribution-progress">
                      <div 
                        className="distribution-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="tips-section">
          <h3>💡 Tips for Saving Data</h3>
          <ul className="tips-list">
            <li>Enable <strong>Data Saver Mode</strong> to automatically use lower quality settings</li>
            <li>Set your <strong>Maximum Quality</strong> to 720p or lower on mobile connections</li>
            <li>Disable <strong>Preload Next Video</strong> if you have a limited data plan</li>
            <li>Use <strong>Auto Quality</strong> for the best balance between quality and data usage</li>
            <li>Download videos on WiFi to watch later without using mobile data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
