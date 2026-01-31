import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ValidationWarning } from './RealtimeValidationService';
import './ValidationWarningsPanel.scss';

interface ValidationWarningsPanelProps {
  warnings: ValidationWarning[];
  onDismiss?: (warningId: string) => void;
  onNavigateToAssignment?: (assignmentId: string) => void;
  compactMode?: boolean;
}

export const ValidationWarningsPanel: React.FC<ValidationWarningsPanelProps> = ({
  warnings,
  onDismiss,
  onNavigateToAssignment,
  compactMode = false,
}) => {
  const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(new Set());
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [newWarningIds, setNewWarningIds] = useState<Set<string>>(new Set());
  const previousWarningsRef = useRef<ValidationWarning[]>([]);

  // Track new warnings for animation
  useEffect(() => {
    const prevIds = new Set(previousWarningsRef.current.map(w => w.id));
    const currentIds = new Set(warnings.map(w => w.id));
    const newIds = new Set(
      [...currentIds].filter(id => !prevIds.has(id))
    );
    
    if (newIds.size > 0) {
      setNewWarningIds(newIds);
      
      // Clear the "new" state after animation
      const timer = setTimeout(() => {
        setNewWarningIds(new Set());
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    previousWarningsRef.current = warnings;
  }, [warnings]);

  const visibleWarnings = useMemo(() => {
    return warnings.filter((w) => !dismissedWarnings.has(w.id));
  }, [warnings, dismissedWarnings]);

  const grouped = useMemo(() => {
    const critical: ValidationWarning[] = [];
    const warning: ValidationWarning[] = [];
    const info: ValidationWarning[] = [];

    visibleWarnings.forEach((w) => {
      if (w.severity === 'critical') critical.push(w);
      else if (w.severity === 'warning') warning.push(w);
      else info.push(w);
    });

    return { critical, warning, info };
  }, [visibleWarnings]);

  const totalWarnings = visibleWarnings.length;
  const criticalCount = grouped.critical.length;
  const warningCount = grouped.warning.length;
  const infoCount = grouped.info.length;

  const handleDismiss = (warningId: string) => {
    setDismissedWarnings((prev) => new Set([...prev, warningId]));
    onDismiss?.(warningId);
  };

  const handleToggleExpand = (warningId: string) => {
    setExpandedWarnings((prev) => {
      const next = new Set(prev);
      if (next.has(warningId)) {
        next.delete(warningId);
      } else {
        next.add(warningId);
      }
      return next;
    });
  };
  if (totalWarnings === 0) {
    return (
      <div className="validation-warnings-panel empty">
        <div className="empty-state">
          <span className="icon">✓</span>
          <span className="message">No validation warnings - schedule is ready</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`validation-warnings-panel ${compactMode ? 'compact' : ''}`}>
      {/* Summary Header */}
      <div className="warnings-summary">
        <div className="summary-title">
          <span className="icon">⚠️</span>
          <span className="text">Validation Warnings ({totalWarnings})</span>
          {criticalCount > 0 && (
            <span className="live-indicator critical">
              <span className="pulse-dot"></span>
              Live
            </span>
          )}
        </div>
        <div className="summary-stats">
          {criticalCount > 0 && (
            <span className="stat critical">
              <span className="count">{criticalCount}</span>
              <span className="label">Critical</span>
            </span>
          )}
          {warningCount > 0 && (
            <span className="stat warning">
              <span className="count">{warningCount}</span>
              <span className="label">Warning</span>
            </span>
          )}
          {infoCount > 0 && (
            <span className="stat info">
              <span className="count">{infoCount}</span>
              <span className="label">Info</span>
            </span>
          )}
        </div>
      </div>

      {/* Warning Groups */}
      <div className="warnings-list">
        {/* Critical Warnings */}
        {grouped.critical.length > 0 && (
          <div className="warning-group critical-group">
            <div className="group-header">
              <span className="icon">🛑</span>
              <span className="title">Critical Issues ({grouped.critical.length})</span>
            </div>
            <div className="group-warnings">
              {grouped.critical.map((w) => (
                <WarningItem
                  key={w.id}
                  warning={w}
                  isExpanded={expandedWarnings.has(w.id)}
                  isNew={newWarningIds.has(w.id)}
                  onToggleExpand={() => handleToggleExpand(w.id)}
                  onDismiss={() => handleDismiss(w.id)}
                  onNavigateToAssignment={onNavigateToAssignment}
                  compactMode={compactMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Warning Warnings */}
        {grouped.warning.length > 0 && (
          <div className="warning-group warning-group">
            <div className="group-header">
              <span className="icon">⚠️</span>
              <span className="title">Warnings ({grouped.warning.length})</span>
            </div>
            <div className="group-warnings">
              {grouped.warning.map((w) => (
                <WarningItem
                  key={w.id}
                  warning={w}
                  isExpanded={expandedWarnings.has(w.id)}
                  isNew={newWarningIds.has(w.id)}
                  onToggleExpand={() => handleToggleExpand(w.id)}
                  onDismiss={() => handleDismiss(w.id)}
                  onNavigateToAssignment={onNavigateToAssignment}
                  compactMode={compactMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info Warnings */}
        {grouped.info.length > 0 && (
          <div className="warning-group info-group">
            <div className="group-header">
              <span className="icon">ℹ️</span>
              <span className="title">Information ({grouped.info.length})</span>
            </div>
            <div className="group-warnings">
              {grouped.info.map((w) => (
                <WarningItem
                  key={w.id}
                  warning={w}
                  isExpanded={expandedWarnings.has(w.id)}
                  isNew={newWarningIds.has(w.id)}
                  onToggleExpand={() => handleToggleExpand(w.id)}
                  onDismiss={() => handleDismiss(w.id)}
                  onNavigateToAssignment={onNavigateToAssignment}
                  compactMode={compactMode}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface WarningItemProps {
  warning: ValidationWarning;
  isExpanded: boolean;
  isNew?: boolean;
  onToggleExpand: () => void;
  onDismiss: () => void;
  onNavigateToAssignment?: (assignmentId: string) => void;
  compactMode?: boolean;
}

const WarningItem: React.FC<WarningItemProps> = ({
  warning,
  isExpanded,
  isNew = false,
  onToggleExpand,
  onDismiss,
  onNavigateToAssignment,
  compactMode,
}) => {
  const severityIcon: Record<ValidationWarning['severity'], string> = {
    critical: '🛑',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const typeLabel: Record<ValidationWarning['type'], string> = {
    violation: 'Constraint',
    workload: 'Workload',
    coverage: 'Coverage',
    skill_match: 'Skills',
    availability: 'Availability',
    pattern: 'Pattern',
  };

  return (
    <div className={`warning-item severity-${warning.severity} ${isNew ? 'new-warning' : ''}`}>
      <div className="warning-header">
        <button className="expand-btn" onClick={onToggleExpand} aria-label="Toggle details">
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </button>

        <div className="warning-title-section">
          <span className="severity-icon">{severityIcon[warning.severity]}</span>
          <div className="title-text">
            <span className="main-title">{warning.title}</span>
            <span className="type-badge">{typeLabel[warning.type]}</span>
          </div>
        </div>

        <button
          className="dismiss-btn"
          onClick={onDismiss}
          title="Dismiss warning"
          aria-label="Dismiss warning"
        >
          ✕
        </button>
      </div>

      {isExpanded && (
        <div className="warning-details">
          <p className="warning-message">{warning.message}</p>

          {warning.suggestedAction && (
            <div className="suggested-action">
              <span className="action-icon">💡</span>
              <span className="action-text">{warning.suggestedAction}</span>
            </div>
          )}

          {!compactMode && warning.affectedAssignments.length > 0 && (
            <div className="affected-items">
              <span className="label">Affected Assignments ({warning.affectedAssignments.length})</span>
              <div className="items-list">
                {warning.affectedAssignments.slice(0, 5).map((assignmentId) => (
                  <button
                    key={assignmentId}
                    className="assignment-link"
                    onClick={() => onNavigateToAssignment?.(assignmentId)}
                    title="Navigate to assignment"
                  >
                    {assignmentId.substring(0, 8)}...
                  </button>
                ))}
                {warning.affectedAssignments.length > 5 && (
                  <span className="more-count">+{warning.affectedAssignments.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {!compactMode && warning.affectedEmployees.length > 0 && (
            <div className="affected-items">
              <span className="label">Affected Employees ({warning.affectedEmployees.length})</span>
              <div className="items-list">
                {warning.affectedEmployees.slice(0, 5).map((employeeId) => (
                  <span key={employeeId} className="employee-id">
                    {employeeId.substring(0, 8)}...
                  </span>
                ))}
                {warning.affectedEmployees.length > 5 && (
                  <span className="more-count">+{warning.affectedEmployees.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {Object.keys(warning.metadata).length > 0 && (
            <div className="metadata-section">
              <span className="label">Details</span>
              <div className="metadata">
                {Object.entries(warning.metadata).map(([key, value]) => {
                  if (typeof value === 'object') return null;
                  return (
                    <div key={key} className="metadata-item">
                      <span className="key">{key.replace(/_/g, ' ')}:</span>
                      <span className="value">{String(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationWarningsPanel;
