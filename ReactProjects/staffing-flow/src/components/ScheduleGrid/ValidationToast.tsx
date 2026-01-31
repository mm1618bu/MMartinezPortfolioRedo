import React, { useEffect, useState } from 'react';
import type { ValidationWarning } from './RealtimeValidationService';
import '.ValidationToast.scss';

interface ValidationToastProps {
  warning: ValidationWarning;
  onDismiss: () => void;
  autoHideDuration?: number;
}

export const ValidationToast: React.FC<ValidationToastProps> = ({
  warning,
  onDismiss,
  autoHideDuration = 5000,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (warning.severity !== 'critical') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, warning.severity]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const severityConfig = {
    critical: {
      icon: '🛑',
      bgColor: '#ffebee',
      borderColor: '#f44336',
      textColor: '#c62828',
    },
    warning: {
      icon: '⚠️',
      bgColor: '#fff9e6',
      borderColor: '#ffa500',
      textColor: '#e65100',
    },
    info: {
      icon: 'ℹ️',
      bgColor: '#e3f2fd',
      borderColor: '#2196f3',
      textColor: '#1565c0',
    },
  };

  const config = severityConfig[warning.severity];

  return (
    <div
      className={`validation-toast severity-${warning.severity} ${isExiting ? 'exiting' : ''}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.textColor,
      }}
    >
      <div className="toast-icon">{config.icon}</div>
      <div className="toast-content">
        <div className="toast-title">{warning.title}</div>
        <div className="toast-message">{warning.message}</div>
        {warning.suggestedAction && (
          <div className="toast-action">
            <span className="action-icon">💡</span>
            <span className="action-text">{warning.suggestedAction}</span>
          </div>
        )}
      </div>
      <button
        className="toast-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
      {warning.severity !== 'critical' && (
        <div
          className="toast-progress"
          style={{
            animationDuration: `${autoHideDuration}ms`,
          }}
        />
      )}
    </div>
  );
};

interface ValidationToastContainerProps {
  warnings: ValidationWarning[];
  onDismiss: (warningId: string) => void;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ValidationToastContainer: React.FC<ValidationToastContainerProps> = ({
  warnings,
  onDismiss,
  maxToasts = 3,
  position = 'top-right',
}) => {
  const [displayedWarnings, setDisplayedWarnings] = useState<ValidationWarning[]>([]);

  useEffect(() => {
    // Only show critical and warning severity toasts
    const importantWarnings = warnings
      .filter((w) => w.severity === 'critical' || w.severity === 'warning')
      .slice(0, maxToasts);

    setDisplayedWarnings(importantWarnings);
  }, [warnings, maxToasts]);

  if (displayedWarnings.length === 0) return null;

  return (
    <div className={`validation-toast-container ${position}`}>
      {displayedWarnings.map((warning) => (
        <ValidationToast
          key={warning.id}
          warning={warning}
          onDismiss={() => onDismiss(warning.id)}
          autoHideDuration={warning.severity === 'critical' ? undefined : 5000}
        />
      ))}
    </div>
  );
};

export default ValidationToastContainer;
