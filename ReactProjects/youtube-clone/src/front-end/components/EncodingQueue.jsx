import React, { useState, useEffect } from 'react';
import { 
  getUserEncodingJobs, 
  cancelEncodingJob,
  retryEncodingJob,
  formatEncodingStatus,
  subscribeToUserEncodingJobs
} from '../utils/encodingQueueAPI';
import { supabase } from '../utils/supabase';
import './EncodingQueue.css';

const EncodingQueue = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'queued', 'processing', 'completed', 'failed'

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchJobs();
      
      // Subscribe to real-time updates
      const subscription = subscribeToUserEncodingJobs(currentUser.id, handleJobUpdate);
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentUser]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await getUserEncodingJobs(currentUser.id, 50);
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobUpdate = (payload) => {
    setJobs(prevJobs => {
      const updatedJobs = [...prevJobs];
      const index = updatedJobs.findIndex(j => j.job_id === payload.new?.id);
      
      if (index !== -1) {
        updatedJobs[index] = {
          ...updatedJobs[index],
          status: payload.new.status,
          progress: payload.new.progress,
          current_step: payload.new.current_step
        };
      }
      
      return updatedJobs;
    });
  };

  const handleCancel = async (jobId) => {
    if (!confirm('Are you sure you want to cancel this encoding job?')) return;
    
    try {
      await cancelEncodingJob(jobId);
      fetchJobs();
    } catch (error) {
      alert('Error cancelling job: ' + error.message);
    }
  };

  const handleRetry = async (jobId) => {
    try {
      await retryEncodingJob(jobId);
      fetchJobs();
    } catch (error) {
      alert('Error retrying job: ' + error.message);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const filteredJobs = filter === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === filter);

  if (!currentUser) {
    return (
      <div className="encoding-queue-container">
        <div className="encoding-queue-empty">
          <p>Please log in to view your encoding queue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="encoding-queue-container">
      <div className="encoding-queue-header">
        <h1>Encoding Queue</h1>
        <p className="encoding-queue-subtitle">
          Track your video encoding jobs in real-time
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="encoding-queue-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({jobs.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'queued' ? 'active' : ''}`}
          onClick={() => setFilter('queued')}
        >
          Queued ({jobs.filter(j => j.status === 'queued').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'processing' ? 'active' : ''}`}
          onClick={() => setFilter('processing')}
        >
          Processing ({jobs.filter(j => j.status === 'processing').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({jobs.filter(j => j.status === 'completed').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'failed' ? 'active' : ''}`}
          onClick={() => setFilter('failed')}
        >
          Failed ({jobs.filter(j => j.status === 'failed').length})
        </button>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="encoding-queue-loading">
          <div className="spinner"></div>
          <p>Loading jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="encoding-queue-empty">
          <div className="empty-icon">📹</div>
          <h3>No encoding jobs {filter !== 'all' ? `in ${filter} status` : ''}</h3>
          <p>Your video encoding jobs will appear here</p>
        </div>
      ) : (
        <div className="encoding-queue-list">
          {filteredJobs.map(job => {
            const statusInfo = formatEncodingStatus(job.status);
            
            return (
              <div key={job.job_id} className={`encoding-job-card status-${job.status}`}>
                <div className="job-header">
                  <div className="job-title-section">
                    <h3 className="job-title">{job.video_title || 'Untitled Video'}</h3>
                    <span className="job-video-id">{job.video_id}</span>
                  </div>
                  <div 
                    className="job-status-badge" 
                    style={{ backgroundColor: statusInfo.color }}
                  >
                    <span className="status-icon">{statusInfo.icon}</span>
                    <span className="status-label">{statusInfo.label}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {(job.status === 'processing' || job.status === 'queued') && (
                  <div className="job-progress-section">
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${job.progress || 0}%` }}
                      />
                    </div>
                    <div className="progress-info">
                      <span className="progress-percentage">{job.progress || 0}%</span>
                      {job.current_step && (
                        <span className="progress-step">{job.current_step}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Timing Information */}
                <div className="job-timing">
                  <div className="timing-item">
                    <span className="timing-label">Queued:</span>
                    <span className="timing-value">{formatTime(job.queued_at)}</span>
                  </div>
                  {job.started_at && (
                    <div className="timing-item">
                      <span className="timing-label">Started:</span>
                      <span className="timing-value">{formatTime(job.started_at)}</span>
                    </div>
                  )}
                  {job.completed_at && (
                    <div className="timing-item">
                      <span className="timing-label">Completed:</span>
                      <span className="timing-value">{formatTime(job.completed_at)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="job-actions">
                  {(job.status === 'queued' || job.status === 'processing') && (
                    <button 
                      className="job-action-btn cancel-btn"
                      onClick={() => handleCancel(job.job_id)}
                    >
                      Cancel
                    </button>
                  )}
                  {job.status === 'failed' && (
                    <button 
                      className="job-action-btn retry-btn"
                      onClick={() => handleRetry(job.job_id)}
                    >
                      Retry
                    </button>
                  )}
                  {job.status === 'completed' && (
                    <button 
                      className="job-action-btn view-btn"
                      onClick={() => window.location.href = `/watch/${job.video_id}`}
                    >
                      View Video
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EncodingQueue;
