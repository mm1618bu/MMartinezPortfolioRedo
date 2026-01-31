/**
 * Recommended Actions Component
 * Displays AI-driven actionable recommendations based on current operational metrics
 */

import React, { useState, useMemo } from 'react';
import type {
  KPIUpdatePayload,
  BacklogUpdatePayload,
  AttendanceUpdatePayload,
} from '../../../api/types/websocket';
import './RecommendedActions.scss';

export interface RecommendedAction {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'staffing' | 'schedule' | 'backlog' | 'efficiency' | 'break';
  title: string;
  description: string;
  impact: string;
  effort: 'quick' | 'moderate' | 'complex';
  source: 'utilization' | 'headcount' | 'sla' | 'attendance' | 'backlog';
  actions: Array<{
    label: string;
    type: 'primary' | 'secondary';
    handler: () => void;
  }>;
  metadata?: {
    currentValue?: number;
    targetValue?: number;
    estimatedImprovement?: string;
    timeToImplement?: string;
  };
}

interface RecommendedActionsProps {
  kpiData: KPIUpdatePayload | null;
  backlogData: BacklogUpdatePayload | null;
  attendanceData: AttendanceUpdatePayload | null;
  onActionTaken?: (actionId: string, actionType: string) => void;
  onActionDismissed?: (actionId: string) => void;
}

const RecommendedActions: React.FC<RecommendedActionsProps> = ({
  kpiData,
  backlogData,
  attendanceData,
  onActionTaken,
  onActionDismissed,
}) => {
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set());
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  // Generate recommendations based on current metrics
  const recommendations = useMemo(() => {
    const actions: RecommendedAction[] = [];

    if (!kpiData) return actions;

    // Low utilization recommendations
    if (kpiData.utilization.current_utilization < 0.6) {
      actions.push({
        id: 'low-utilization-1',
        priority: 'high',
        category: 'efficiency',
        title: 'Increase Staff Utilization',
        description: `Current utilization is ${(kpiData.utilization.current_utilization * 100).toFixed(1)}%, below the 60% threshold. Consider redistributing work or reducing idle time.`,
        impact: 'Improve efficiency by 15-25%',
        effort: 'quick',
        source: 'utilization',
        actions: [
          {
            label: 'Redistribute Work',
            type: 'primary',
            handler: () => handleAction('low-utilization-1', 'redistribute'),
          },
          {
            label: 'View Idle Staff',
            type: 'secondary',
            handler: () => handleAction('low-utilization-1', 'view-idle'),
          },
        ],
        metadata: {
          currentValue: kpiData.utilization.current_utilization * 100,
          targetValue: 75,
          estimatedImprovement: '+15-20% utilization',
          timeToImplement: '10-15 minutes',
        },
      });
    }

    // Overstaffing recommendations
    if (kpiData.headcount_gap.headcount_gap > 3) {
      actions.push({
        id: 'overstaffing-1',
        priority: 'medium',
        category: 'staffing',
        title: 'Optimize Staffing Levels',
        description: `${kpiData.headcount_gap.headcount_gap} more staff than required. Consider early releases or task reassignment.`,
        impact: 'Reduce labor costs by 8-12%',
        effort: 'moderate',
        source: 'headcount',
        actions: [
          {
            label: 'Schedule Early Releases',
            type: 'primary',
            handler: () => handleAction('overstaffing-1', 'early-release'),
          },
          {
            label: 'Reassign to Other Queues',
            type: 'secondary',
            handler: () => handleAction('overstaffing-1', 'reassign'),
          },
        ],
        metadata: {
          currentValue: kpiData.headcount_gap.current_headcount,
          targetValue: kpiData.headcount_gap.required_headcount,
          estimatedImprovement: `Save ${kpiData.headcount_gap.headcount_gap} labor hours`,
          timeToImplement: '20-30 minutes',
        },
      });
    }

    // Understaffing recommendations
    if (kpiData.headcount_gap.headcount_gap < -2) {
      actions.push({
        id: 'understaffing-1',
        priority: 'critical',
        category: 'staffing',
        title: 'Critical Staffing Shortage',
        description: `Short ${Math.abs(kpiData.headcount_gap.headcount_gap)} staff members. Immediate action needed to prevent SLA breach.`,
        impact: 'Prevent SLA penalties and service degradation',
        effort: 'quick',
        source: 'headcount',
        actions: [
          {
            label: 'Call in Backup Staff',
            type: 'primary',
            handler: () => handleAction('understaffing-1', 'call-backup'),
          },
          {
            label: 'Request Overtime',
            type: 'secondary',
            handler: () => handleAction('understaffing-1', 'overtime'),
          },
        ],
        metadata: {
          currentValue: kpiData.headcount_gap.current_headcount,
          targetValue: kpiData.headcount_gap.required_headcount,
          estimatedImprovement: 'Restore optimal coverage',
          timeToImplement: '30-45 minutes',
        },
      });
    }

    // SLA risk recommendations
    if (kpiData.sla_risk.risk_level === 'high' || kpiData.sla_risk.risk_level === 'critical') {
      actions.push({
        id: 'sla-risk-1',
        priority: kpiData.sla_risk.risk_level === 'critical' ? 'critical' : 'high',
        category: 'backlog',
        title: 'SLA Risk Mitigation Required',
        description: `${kpiData.sla_risk.items_at_risk} items at risk of SLA breach. Average wait time: ${kpiData.sla_risk.average_wait_time_minutes.toFixed(0)} minutes.`,
        impact: 'Prevent SLA breaches and customer escalations',
        effort: 'quick',
        source: 'sla',
        actions: [
          {
            label: 'Prioritize At-Risk Items',
            type: 'primary',
            handler: () => handleAction('sla-risk-1', 'prioritize'),
          },
          {
            label: 'Add Express Lane',
            type: 'secondary',
            handler: () => handleAction('sla-risk-1', 'express-lane'),
          },
        ],
        metadata: {
          currentValue: kpiData.sla_risk.compliance_percentage,
          targetValue: 95,
          estimatedImprovement: `Save ${kpiData.sla_risk.items_at_risk} items from breach`,
          timeToImplement: '5-10 minutes',
        },
      });
    }

    // Backlog growing recommendations
    if (backlogData && backlogData.backlog_trend === 'growing') {
      const netGrowth = backlogData.items_added_this_interval - backlogData.items_completed_this_interval;
      if (netGrowth > 10) {
        actions.push({
          id: 'backlog-growing-1',
          priority: 'high',
          category: 'backlog',
          title: 'Backlog Growing Rapidly',
          description: `Backlog increased by ${netGrowth} items this interval. Processing rate needs improvement.`,
          impact: 'Stabilize backlog and prevent overflow',
          effort: 'moderate',
          source: 'backlog',
          actions: [
            {
              label: 'Increase Processing Speed',
              type: 'primary',
              handler: () => handleAction('backlog-growing-1', 'speed-up'),
            },
            {
              label: 'Open Additional Queue',
              type: 'secondary',
              handler: () => handleAction('backlog-growing-1', 'new-queue'),
            },
          ],
          metadata: {
            currentValue: backlogData.total_items,
            targetValue: backlogData.total_items - netGrowth,
            estimatedImprovement: `Reduce by ${netGrowth} items/hour`,
            timeToImplement: '15-20 minutes',
          },
        });
      }
    }

    // High absenteeism recommendations
    if (attendanceData && attendanceData.absent_count > 3) {
      const absenteeRate = (attendanceData.absent_count / attendanceData.scheduled_count) * 100;
      actions.push({
        id: 'high-absenteeism-1',
        priority: 'medium',
        category: 'staffing',
        title: 'High Absenteeism Detected',
        description: `${attendanceData.absent_count} staff absent (${absenteeRate.toFixed(1)}% absentee rate). Coverage may be impacted.`,
        impact: 'Maintain service levels and prevent burnout',
        effort: 'moderate',
        source: 'attendance',
        actions: [
          {
            label: 'Activate Contingency Plan',
            type: 'primary',
            handler: () => handleAction('high-absenteeism-1', 'contingency'),
          },
          {
            label: 'Redistribute Workload',
            type: 'secondary',
            handler: () => handleAction('high-absenteeism-1', 'redistribute'),
          },
        ],
        metadata: {
          currentValue: attendanceData.present_count,
          targetValue: attendanceData.scheduled_count,
          estimatedImprovement: 'Restore full coverage',
          timeToImplement: '20-30 minutes',
        },
      });
    }

    // Break management recommendations
    if (kpiData.utilization.staff_on_break > kpiData.utilization.active_staff_count * 0.25) {
      actions.push({
        id: 'break-management-1',
        priority: 'low',
        category: 'break',
        title: 'Optimize Break Scheduling',
        description: `${kpiData.utilization.staff_on_break} staff on break (${((kpiData.utilization.staff_on_break / kpiData.utilization.active_staff_count) * 100).toFixed(0)}%). Consider staggering breaks.`,
        impact: 'Improve availability during peak times',
        effort: 'quick',
        source: 'utilization',
        actions: [
          {
            label: 'Stagger Break Times',
            type: 'primary',
            handler: () => handleAction('break-management-1', 'stagger'),
          },
          {
            label: 'View Break Schedule',
            type: 'secondary',
            handler: () => handleAction('break-management-1', 'view-schedule'),
          },
        ],
        metadata: {
          currentValue: kpiData.utilization.staff_on_break,
          targetValue: Math.ceil(kpiData.utilization.active_staff_count * 0.15),
          estimatedImprovement: '+5-10% available staff',
          timeToImplement: '10 minutes',
        },
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [kpiData, backlogData, attendanceData]);

  const handleAction = (actionId: string, actionType: string) => {
    onActionTaken?.(actionId, actionType);
    // In a real implementation, this would trigger the actual action
    console.log(`Action taken: ${actionId} - ${actionType}`);
  };

  const handleDismiss = (actionId: string) => {
    setDismissedActions((prev) => new Set([...prev, actionId]));
    onActionDismissed?.(actionId);
  };

  const visibleRecommendations = recommendations.filter(
    (action) => !dismissedActions.has(action.id)
  );

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '💡';
      case 'low':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'staffing':
        return '👥';
      case 'schedule':
        return '📅';
      case 'backlog':
        return '📊';
      case 'efficiency':
        return '⚡';
      case 'break':
        return '☕';
      default:
        return '📋';
    }
  };

  if (visibleRecommendations.length === 0) {
    return (
      <div className="recommended-actions empty">
        <div className="empty-state">
          <span className="empty-icon">✓</span>
          <h3>All Systems Optimal</h3>
          <p>No immediate actions required. Keep up the great work!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommended-actions">
      <div className="actions-header">
        <h3>Recommended Actions</h3>
        <span className="actions-count">
          {visibleRecommendations.length} {visibleRecommendations.length === 1 ? 'action' : 'actions'}
        </span>
      </div>

      <div className="actions-list">
        {visibleRecommendations.map((action) => (
          <div
            key={action.id}
            className={`action-card priority-${action.priority} ${
              expandedAction === action.id ? 'expanded' : ''
            }`}
          >
            <div className="action-main" onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}>
              <div className="action-header-row">
                <div className="action-indicators">
                  <span className="priority-icon">{getPriorityIcon(action.priority)}</span>
                  <span className="category-icon">{getCategoryIcon(action.category)}</span>
                </div>
                <div className="action-title-area">
                  <h4 className="action-title">{action.title}</h4>
                  <div className="action-tags">
                    <span className={`tag priority-tag priority-${action.priority}`}>
                      {action.priority}
                    </span>
                    <span className={`tag effort-tag effort-${action.effort}`}>
                      {action.effort}
                    </span>
                  </div>
                </div>
                <button
                  className="dismiss-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(action.id);
                  }}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>

              <p className="action-description">{action.description}</p>

              <div className="action-impact">
                <span className="impact-label">Expected Impact:</span>
                <span className="impact-value">{action.impact}</span>
              </div>
            </div>

            {expandedAction === action.id && (
              <div className="action-details">
                {action.metadata && (
                  <div className="action-metadata">
                    <div className="metadata-grid">
                      {action.metadata.currentValue !== undefined && (
                        <div className="metadata-item">
                          <span className="metadata-label">Current:</span>
                          <span className="metadata-value">
                            {action.metadata.currentValue.toFixed(1)}
                            {action.source === 'utilization' || action.source === 'sla' ? '%' : ''}
                          </span>
                        </div>
                      )}
                      {action.metadata.targetValue !== undefined && (
                        <div className="metadata-item">
                          <span className="metadata-label">Target:</span>
                          <span className="metadata-value">
                            {action.metadata.targetValue.toFixed(1)}
                            {action.source === 'utilization' || action.source === 'sla' ? '%' : ''}
                          </span>
                        </div>
                      )}
                      {action.metadata.estimatedImprovement && (
                        <div className="metadata-item">
                          <span className="metadata-label">Improvement:</span>
                          <span className="metadata-value improvement">
                            {action.metadata.estimatedImprovement}
                          </span>
                        </div>
                      )}
                      {action.metadata.timeToImplement && (
                        <div className="metadata-item">
                          <span className="metadata-label">Time:</span>
                          <span className="metadata-value">
                            {action.metadata.timeToImplement}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="action-buttons">
                  {action.actions.map((btn, idx) => (
                    <button
                      key={idx}
                      className={`action-button ${btn.type}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        btn.handler();
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedActions;
