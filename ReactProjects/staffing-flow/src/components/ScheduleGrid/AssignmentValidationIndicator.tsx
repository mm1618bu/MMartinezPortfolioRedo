import React, { useMemo } from 'react';
import { ValidationWarning } from './RealtimeValidationService';
import './AssignmentValidationIndicator.scss';

interface AssignmentValidationIndicatorProps {
  assignmentId: string;
  warnings: ValidationWarning[];
  showTooltip?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClickWarning?: () => void;
}

export const AssignmentValidationIndicator: React.FC<AssignmentValidationIndicatorProps> = ({
  assignmentId,
  warnings,
  showTooltip = true,
  size = 'medium',
  onClickWarning,
}) => {
  const assignmentWarnings = useMemo(
    () => warnings.filter((w) => w.affectedAssignments.includes(assignmentId)),
    [warnings, assignmentId]
  );

  if (assignmentWarnings.length === 0) {
    return null;
  }

  // Determine highest severity
  const severityOrder: Record<ValidationWarning['severity'], number> = { critical: 3, warning: 2, info: 1 };
  const highestSeverity = assignmentWarnings.reduce<ValidationWarning['severity']>((highest, current) => {
    return severityOrder[highest] >= severityOrder[current.severity] ? highest : current.severity;
  }, 'info');

  const iconMap: Record<ValidationWarning['severity'], string> = {
    critical: '🛑',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const tooltipText = assignmentWarnings
    .map((w) => `${w.title}: ${w.message}`)
    .join('\n');

  return (
    <div
      className={`assignment-validation-indicator severity-${highestSeverity} size-${size}`}
      onClick={onClickWarning}
      role={onClickWarning ? 'button' : 'status'}
      tabIndex={onClickWarning ? 0 : -1}
      title={showTooltip ? tooltipText : undefined}
    >
      <span className="indicator-icon">{iconMap[highestSeverity]}</span>
      {assignmentWarnings.length > 1 && (
        <span className="warning-count">{assignmentWarnings.length}</span>
      )}
    </div>
  );
};

interface AssignmentValidationHighlightProps {
  severity: ValidationWarning['severity'] | null;
  children: React.ReactNode;
  className?: string;
}

export const AssignmentValidationHighlight: React.FC<AssignmentValidationHighlightProps> = ({
  severity,
  children,
  className = '',
}) => {
  if (!severity) {
    return <>{children}</>;
  }

  return (
    <div
      className={`assignment-validation-highlight severity-${severity} ${className}`}
    >
      {children}
    </div>
  );
};

interface ValidationBadgeProps {
  severity: ValidationWarning['severity'];
  label?: string;
  count?: number;
  compact?: boolean;
}

export const ValidationBadge: React.FC<ValidationBadgeProps> = ({
  severity,
  label,
  count,
  compact = false,
}) => {
  const labels: Record<ValidationWarning['severity'], string> = {
    critical: 'Critical Issue',
    warning: 'Warning',
    info: 'Info',
  };

  const displayLabel = label || labels[severity];

  return (
    <div className={`validation-badge severity-${severity} ${compact ? 'compact' : ''}`}>
      {!compact && (
        <span className="icon">
          {severity === 'critical' && '🛑'}
          {severity === 'warning' && '⚠️'}
          {severity === 'info' && 'ℹ️'}
        </span>
      )}
      <span className="label">{displayLabel}</span>
      {count && <span className="count">{count}</span>}
    </div>
  );
};

export default AssignmentValidationIndicator;
