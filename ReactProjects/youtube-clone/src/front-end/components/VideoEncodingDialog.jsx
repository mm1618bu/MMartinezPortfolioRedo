import React, { useState, useEffect } from 'react';
import {
  encodeVideo,
  checkBackendHealth,
  getQualityPresets
} from '../services/videoEncodingService';
import './VideoEncodingDialog.scss';

/**
 * VideoEncodingDialog Component
 * Modal dialog for encoding uploaded videos with quality selection
 */
export default function VideoEncodingDialog({ videoFile, onComplete, onCancel }) {
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [encodingStats, setEncodingStats] = useState({ fps: 0, speed: '0x' });
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const qualityPresets = getQualityPresets();

  // Check backend availability on mount
  useEffect(() => {
    const checkHealth = async () => {
      const available = await checkBackendHealth();
      setBackendAvailable(available);
      if (!available) {
        setError('Encoding service unavailable. Videos will be uploaded without encoding.');
      }
    };
    checkHealth();
  }, []);

  const handleEncode = async () => {
    setIsEncoding(true);
    setError(null);
    setProgress(0);

    try {
      const result = await encodeVideo(
        videoFile,
        selectedQuality,
        (percent, fps, speed) => {
          setProgress(Math.round(percent));
          setEncodingStats({ fps, speed });
        }
      );

      onComplete(result);
    } catch (err) {
      setError(err.message);
      setIsEncoding(false);
    }
  };

  const handleSkip = () => {
    onComplete(null); // Upload without encoding
  };

  return (
    <div className="video-encoding-dialog-overlay">
      <div className="video-encoding-dialog">
        <div className="dialog-header">
          <h2>Video Encoding Options</h2>
          {backendAvailable && (
            <div className="backend-status available">
              <span className="status-dot"></span>
              Encoding service online
            </div>
          )}
          {!backendAvailable && (
            <div className="backend-status unavailable">
              <span className="status-dot"></span>
              Encoding service offline
            </div>
          )}
        </div>

        <div className="dialog-body">
          {/* File Info */}
          <div className="file-info">
            <strong>File:</strong> {videoFile.name}
            <br />
            <strong>Size:</strong> {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
          </div>

          {/* Quality Selection */}
          {backendAvailable && !isEncoding && (
            <div className="quality-selection">
              <h3>Select Encoding Quality</h3>
              <div className="quality-options">
                {Object.entries(qualityPresets).map(([key, preset]) => (
                  <label key={key} className="quality-option">
                    <input
                      type="radio"
                      name="quality"
                      value={key}
                      checked={selectedQuality === key}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    />
                    <div className="quality-details">
                      <div className="quality-label">{preset.label}</div>
                      <div className="quality-specs">
                        {preset.resolution} • {preset.bitrate}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Encoding Progress */}
          {isEncoding && (
            <div className="encoding-progress">
              <h3>Encoding Video...</h3>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-stats">
                <span>{progress}% complete</span>
                <span>{encodingStats.fps} fps</span>
                <span>{encodingStats.speed} speed</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          {!isEncoding && (
            <>
              {backendAvailable && (
                <button
                  className="btn-primary"
                  onClick={handleEncode}
                  disabled={isEncoding}
                >
                  Encode Video
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={handleSkip}
                disabled={isEncoding}
              >
                {backendAvailable ? 'Skip Encoding' : 'Continue Upload'}
              </button>
              <button
                className="btn-cancel"
                onClick={onCancel}
                disabled={isEncoding}
              >
                Cancel
              </button>
            </>
          )}
          {isEncoding && (
            <button className="btn-cancel" disabled>
              Encoding in progress...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
