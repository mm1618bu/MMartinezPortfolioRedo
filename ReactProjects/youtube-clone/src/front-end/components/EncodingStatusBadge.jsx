import React, { useState, useEffect } from 'react';
import { getEncodingJobStatus, subscribeToEncodingJob, formatEncodingStatus } from '../utils/encodingQueueAPI';
import './EncodingStatusBadge.css';

const EncodingStatusBadge = ({ videoId }) => {
  const [jobStatus, setJobStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    
    // Subscribe to real-time updates
    const subscription = subscribeToEncodingJob(videoId, (updatedJob) => {
      setJobStatus(updatedJob);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [videoId]);

  const fetchStatus = async () => {
    setLoading(true);
    const status = await getEncodingJobStatus(videoId);
    setJobStatus(status);
    setLoading(false);
  };

  if (loading || !jobStatus) return null;

  // Don't show badge if encoding is completed
  if (jobStatus.status === 'completed') return null;

  const statusInfo = formatEncodingStatus(jobStatus.status);

  return (
    <div className={`encoding-status-badge badge-${jobStatus.status}`}>
      <div className="badge-content">
        <span className="badge-icon">{statusInfo.icon}</span>
        <div className="badge-info">
          <div className="badge-label">{statusInfo.label}</div>
          {jobStatus.status === 'processing' && (
            <div className="badge-progress-mini">
              <div 
                className="badge-progress-bar"
                style={{ width: `${jobStatus.progress}%` }}
              />
            </div>
          )}
          {jobStatus.current_step && (
            <div className="badge-step">{jobStatus.current_step}</div>
          )}
        </div>
        {jobStatus.status === 'processing' && (
          <div className="badge-percentage">{jobStatus.progress}%</div>
        )}
      </div>
    </div>
  );
};

export default EncodingStatusBadge;
