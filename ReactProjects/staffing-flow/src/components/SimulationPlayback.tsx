/**
 * Simulation Playback Component
 * Provides timeline playback controls and visualization for simulation results
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SimulationPlayback.scss';

interface SimulationPlaybackProps {
  simulationResults: any;
  simulationType: 'productivity' | 'backlog' | 'combined';
  onClose?: () => void;
}

interface ProductivityFrame {
  date: string;
  actual_units_per_hour: number;
  baseline_units_per_hour: number;
  productivity_modifier: number;
  variance_percentage: number;
  staffing_variance: number;
  contributing_factors: string[];
}

interface BacklogFrame {
  snapshot_date: string;
  total_items: number;
  sla_breached_count: number;
  sla_compliance_rate: number;
  capacity_utilization: number;
  overflow_count: number;
  items_resolved: number;
  new_items: number;
  customer_impact_score: number;
  financial_impact: number;
}

type PlaybackSpeed = 0.5 | 1 | 2 | 5;

export const SimulationPlayback: React.FC<SimulationPlaybackProps> = ({
  simulationResults,
  simulationType,
  onClose,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract timeline data from simulation results
  useEffect(() => {
    if (!simulationResults) return;

    let data: any[] = [];

    if (simulationType === 'productivity') {
      data = simulationResults.data_points || [];
    } else if (simulationType === 'backlog') {
      data = simulationResults.daily_snapshots || [];
    } else if (simulationType === 'combined') {
      // For combined, we'll use productivity data as primary timeline
      const productivityData = simulationResults.productivity?.data_points || [];
      const backlogData = simulationResults.backlog?.daily_snapshots || [];
      
      // Merge both datasets by date
      data = productivityData.map((pd: any, index: number) => ({
        productivity: pd,
        backlog: backlogData[index] || null,
      }));
    }

    setTimelineData(data);
    setCurrentFrame(0);
  }, [simulationResults, simulationType]);

  // Playback timer
  useEffect(() => {
    if (isPlaying && timelineData.length > 0) {
      const interval = 1000 / playbackSpeed; // Speed affects interval
      
      playbackTimerRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= timelineData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, timelineData.length]);

  const handlePlayPause = useCallback(() => {
    if (currentFrame >= timelineData.length - 1) {
      setCurrentFrame(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, currentFrame, timelineData.length]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrame(0);
  }, []);

  const handlePrevious = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrame((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrame((prev) => Math.min(timelineData.length - 1, prev + 1));
  }, [timelineData.length]);

  const handleScrub = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentFrame(parseInt(event.target.value, 10));
  }, []);

  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
  }, []);

  const renderProductivityFrame = (frame: ProductivityFrame, index: number) => {
    const productivityTrend = timelineData.slice(0, index + 1).map((f: ProductivityFrame, i) => ({
      x: i,
      y: f.productivity_modifier * 100,
    }));

    const isGood = frame.productivity_modifier >= 1.0;
    const isWarning = frame.productivity_modifier >= 0.9 && frame.productivity_modifier < 1.0;

    return (
      <div className="frame-display productivity-frame">
        <div className="frame-header">
          <h3>📅 {new Date(frame.date).toLocaleDateString()}</h3>
          <span className={`status-badge ${isGood ? 'good' : isWarning ? 'warning' : 'critical'}`}>
            {isGood ? '✓ On Target' : isWarning ? '⚠ Below Target' : '⚠ Critical'}
          </span>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Productivity</div>
            <div className={`metric-value ${isGood ? 'good' : isWarning ? 'warning' : 'critical'}`}>
              {(frame.productivity_modifier * 100).toFixed(1)}%
            </div>
            <div className="metric-subtitle">
              {frame.variance_percentage >= 0 ? '+' : ''}{frame.variance_percentage.toFixed(1)}% variance
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Units per Hour</div>
            <div className="metric-value">
              {frame.actual_units_per_hour.toFixed(2)}
            </div>
            <div className="metric-subtitle">
              Baseline: {frame.baseline_units_per_hour.toFixed(2)}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Staffing Impact</div>
            <div className={`metric-value ${frame.staffing_variance > 0 ? 'critical' : frame.staffing_variance < 0 ? 'good' : ''}`}>
              {frame.staffing_variance > 0 ? '+' : ''}{frame.staffing_variance}
            </div>
            <div className="metric-subtitle">
              {frame.staffing_variance > 0 ? 'Additional staff needed' : frame.staffing_variance < 0 ? 'Surplus staff' : 'Balanced'}
            </div>
          </div>
        </div>

        {frame.contributing_factors && frame.contributing_factors.length > 0 && (
          <div className="factors-section">
            <h4>Contributing Factors</h4>
            <div className="factors-list">
              {frame.contributing_factors.map((factor, i) => (
                <span key={i} className="factor-tag">{factor}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mini-chart">
          <h4>Productivity Trend (Up to Current Day)</h4>
          <svg width="100%" height="120" viewBox="0 0 500 120">
            {/* Y-axis reference lines */}
            <line x1="0" y1="60" x2="500" y2="60" stroke="#e0e0e0" strokeDasharray="2,2" />
            <line x1="0" y1="30" x2="500" y2="30" stroke="#e0e0e0" strokeDasharray="2,2" opacity="0.5" />
            <line x1="0" y1="90" x2="500" y2="90" stroke="#e0e0e0" strokeDasharray="2,2" opacity="0.5" />
            
            {/* Baseline at 100% */}
            <line x1="0" y1="60" x2="500" y2="60" stroke="#4CAF50" strokeWidth="2" opacity="0.3" />
            <text x="5" y="57" fontSize="10" fill="#666">100%</text>
            
            {/* Plot productivity trend */}
            <polyline
              points={productivityTrend.map((p) => {
                const x = (p.x / (timelineData.length - 1)) * 500;
                const y = 120 - ((p.y / 150) * 120); // Scale to 0-150% range
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#2196F3"
              strokeWidth="2"
            />
            
            {/* Current point */}
            {productivityTrend.length > 0 && (
              <circle
                cx={(index / (timelineData.length - 1)) * 500}
                cy={120 - ((productivityTrend[index].y / 150) * 120)}
                r="4"
                fill="#FF5722"
              />
            )}
          </svg>
        </div>
      </div>
    );
  };

  const renderBacklogFrame = (frame: BacklogFrame, index: number) => {
    const backlogTrend = timelineData.slice(0, index + 1).map((f: BacklogFrame, i) => ({
      x: i,
      items: f.total_items,
    }));

    const slaStatus = frame.sla_compliance_rate >= 95 ? 'good' : frame.sla_compliance_rate >= 90 ? 'warning' : 'critical';

    return (
      <div className="frame-display backlog-frame">
        <div className="frame-header">
          <h3>📅 {new Date(frame.snapshot_date).toLocaleDateString()}</h3>
          <span className={`status-badge ${slaStatus}`}>
            {slaStatus === 'good' ? '✓ SLA Compliant' : slaStatus === 'warning' ? '⚠ At Risk' : '⚠ SLA Breach'}
          </span>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Total Backlog</div>
            <div className="metric-value">{frame.total_items}</div>
            <div className="metric-subtitle">
              {frame.new_items > 0 && `+${frame.new_items} new`} 
              {frame.items_resolved > 0 && ` | -${frame.items_resolved} resolved`}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">SLA Compliance</div>
            <div className={`metric-value ${slaStatus}`}>
              {frame.sla_compliance_rate.toFixed(1)}%
            </div>
            <div className="metric-subtitle">
              {frame.sla_breached_count} breached
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Capacity Utilization</div>
            <div className="metric-value">
              {frame.capacity_utilization.toFixed(1)}%
            </div>
            <div className="metric-subtitle">
              {frame.overflow_count > 0 ? `${frame.overflow_count} overflow` : 'Within capacity'}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Customer Impact</div>
            <div className={`metric-value ${frame.customer_impact_score > 70 ? 'critical' : frame.customer_impact_score > 40 ? 'warning' : 'good'}`}>
              {frame.customer_impact_score.toFixed(0)}
            </div>
            <div className="metric-subtitle">
              ${frame.financial_impact.toFixed(0)} financial impact
            </div>
          </div>
        </div>

        <div className="mini-chart">
          <h4>Backlog Trend (Up to Current Day)</h4>
          <svg width="100%" height="120" viewBox="0 0 500 120">
            {/* Y-axis reference lines */}
            <line x1="0" y1="0" x2="500" y2="0" stroke="#e0e0e0" strokeWidth="1" />
            <line x1="0" y1="120" x2="500" y2="120" stroke="#e0e0e0" strokeWidth="1" />
            
            {/* Plot backlog trend */}
            <polyline
              points={backlogTrend.map((p) => {
                const x = (p.x / (timelineData.length - 1)) * 500;
                const maxItems = Math.max(...backlogTrend.map(b => b.items), 1);
                const y = 120 - ((p.items / maxItems) * 110); // Leave 10px margin
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#FF9800"
              strokeWidth="2"
            />
            
            {/* Fill area under curve */}
            <polygon
              points={[
                ...backlogTrend.map((p) => {
                  const x = (p.x / (timelineData.length - 1)) * 500;
                  const maxItems = Math.max(...backlogTrend.map(b => b.items), 1);
                  const y = 120 - ((p.items / maxItems) * 110);
                  return `${x},${y}`;
                }),
                `500,120`,
                `0,120`,
              ].join(' ')}
              fill="#FF9800"
              opacity="0.2"
            />
            
            {/* Current point */}
            {backlogTrend.length > 0 && (
              <circle
                cx={(index / (timelineData.length - 1)) * 500}
                cy={120 - ((backlogTrend[index].items / Math.max(...backlogTrend.map(b => b.items), 1)) * 110)}
                r="4"
                fill="#FF5722"
              />
            )}
          </svg>
        </div>
      </div>
    );
  };

  const renderCombinedFrame = (frame: any, index: number) => {
    return (
      <div className="frame-display combined-frame">
        <div className="combined-panels">
          <div className="panel">
            <h4>📊 Productivity</h4>
            {frame.productivity && renderProductivityFrame(frame.productivity, index)}
          </div>
          <div className="panel">
            <h4>📦 Backlog</h4>
            {frame.backlog && renderBacklogFrame(frame.backlog, index)}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentFrame = () => {
    if (timelineData.length === 0 || currentFrame >= timelineData.length) {
      return <div className="no-data">No timeline data available</div>;
    }

    const frame = timelineData[currentFrame];

    if (simulationType === 'productivity') {
      return renderProductivityFrame(frame, currentFrame);
    } else if (simulationType === 'backlog') {
      return renderBacklogFrame(frame, currentFrame);
    } else if (simulationType === 'combined') {
      return renderCombinedFrame(frame, currentFrame);
    }

    return null;
  };

  if (!simulationResults || timelineData.length === 0) {
    return (
      <div className="simulation-playback">
        <div className="playback-error">
          <p>⚠️ No playback data available</p>
          <button onClick={onClose} className="close-button">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="simulation-playback">
      <div className="playback-header">
        <h2>🎬 Simulation Playback</h2>
        {onClose && (
          <button onClick={onClose} className="close-button">✕</button>
        )}
      </div>

      {/* Playback Controls */}
      <div className="playback-controls">
        <div className="transport-controls">
          <button
            className="control-button"
            onClick={handleStop}
            disabled={currentFrame === 0 && !isPlaying}
            title="Stop"
          >
            ⏹
          </button>
          <button
            className="control-button"
            onClick={handlePrevious}
            disabled={currentFrame === 0}
            title="Previous Frame"
          >
            ⏮
          </button>
          <button
            className="control-button play-pause"
            onClick={handlePlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>
          <button
            className="control-button"
            onClick={handleNext}
            disabled={currentFrame >= timelineData.length - 1}
            title="Next Frame"
          >
            ⏭
          </button>
        </div>

        <div className="speed-controls">
          <span className="speed-label">Speed:</span>
          {([0.5, 1, 2, 5] as PlaybackSpeed[]).map((speed) => (
            <button
              key={speed}
              className={`speed-button ${playbackSpeed === speed ? 'active' : ''}`}
              onClick={() => handleSpeedChange(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="frame-counter">
          Day {currentFrame + 1} of {timelineData.length}
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="timeline-scrubber">
        <input
          type="range"
          min="0"
          max={timelineData.length - 1}
          value={currentFrame}
          onChange={handleScrub}
          className="scrubber-slider"
        />
        <div className="scrubber-labels">
          <span>Start</span>
          <span>End</span>
        </div>
      </div>

      {/* Frame Display */}
      <div className="playback-content">
        {renderCurrentFrame()}
      </div>
    </div>
  );
};

export default SimulationPlayback;
