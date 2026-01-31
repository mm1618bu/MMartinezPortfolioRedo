# Recommended Actions UI - Implementation Guide

## Overview

The Recommended Actions component provides intelligent, context-aware action suggestions based on real-time operational metrics. It analyzes KPIs, backlog data, and attendance statistics to generate prioritized recommendations that help operations managers make quick, informed decisions.

## Features

### 🎯 Intelligent Recommendations

The system automatically generates actions based on:
- **Utilization Metrics** - Low/high utilization patterns
- **Headcount Gaps** - Over/understaffing situations  
- **SLA Risk** - Items at risk of breaching SLA
- **Backlog Trends** - Growing/shrinking backlog patterns
- **Attendance Issues** - High absenteeism detection
- **Break Management** - Optimization opportunities

### 📊 Priority-Based Display

Actions are automatically sorted by priority:
- 🚨 **Critical** - Immediate action required (red)
- ⚠️ **High** - Urgent attention needed (orange)
- 💡 **Medium** - Important but not urgent (blue)
- ℹ️ **Low** - Optimization opportunities (gray)

### 🏷️ Action Categories

Each recommendation is categorized:
- 👥 **Staffing** - Workforce adjustments
- 📅 **Schedule** - Timing and scheduling changes
- 📊 **Backlog** - Queue management
- ⚡ **Efficiency** - Performance optimization
- ☕ **Break** - Break schedule optimization

### ⏱️ Effort Indicators

Actions are tagged with estimated effort:
- **Quick** - 5-15 minutes (green)
- **Moderate** - 15-30 minutes (orange)
- **Complex** - 30+ minutes (purple)

## Component Structure

### Props Interface

```typescript
interface RecommendedActionsProps {
  kpiData: KPIUpdatePayload | null;
  backlogData: BacklogUpdatePayload | null;
  attendanceData: AttendanceUpdatePayload | null;
  onActionTaken?: (actionId: string, actionType: string) => void;
  onActionDismissed?: (actionId: string) => void;
}
```

### Action Object Structure

```typescript
interface RecommendedAction {
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
```

## Recommendation Rules

### 1. Low Utilization (< 60%)

**Trigger**: `utilization.current_utilization < 0.6`

**Action Generated**:
- Title: "Increase Staff Utilization"
- Priority: High
- Category: Efficiency
- Actions:
  - Redistribute Work (primary)
  - View Idle Staff (secondary)

**Expected Impact**: Improve efficiency by 15-25%

### 2. Overstaffing (Gap > 3)

**Trigger**: `headcount_gap.headcount_gap > 3`

**Action Generated**:
- Title: "Optimize Staffing Levels"
- Priority: Medium
- Category: Staffing
- Actions:
  - Schedule Early Releases (primary)
  - Reassign to Other Queues (secondary)

**Expected Impact**: Reduce labor costs by 8-12%

### 3. Understaffing (Gap < -2)

**Trigger**: `headcount_gap.headcount_gap < -2`

**Action Generated**:
- Title: "Critical Staffing Shortage"
- Priority: Critical
- Category: Staffing
- Actions:
  - Call in Backup Staff (primary)
  - Request Overtime (secondary)

**Expected Impact**: Prevent SLA penalties and service degradation

### 4. High SLA Risk

**Trigger**: `sla_risk.risk_level === 'high' || 'critical'`

**Action Generated**:
- Title: "SLA Risk Mitigation Required"
- Priority: Critical/High (based on risk level)
- Category: Backlog
- Actions:
  - Prioritize At-Risk Items (primary)
  - Add Express Lane (secondary)

**Expected Impact**: Prevent SLA breaches

### 5. Growing Backlog

**Trigger**: `backlog_trend === 'growing' && net_growth > 10`

**Action Generated**:
- Title: "Backlog Growing Rapidly"
- Priority: High
- Category: Backlog
- Actions:
  - Increase Processing Speed (primary)
  - Open Additional Queue (secondary)

**Expected Impact**: Stabilize backlog and prevent overflow

### 6. High Absenteeism

**Trigger**: `absent_count > 3`

**Action Generated**:
- Title: "High Absenteeism Detected"
- Priority: Medium
- Category: Staffing
- Actions:
  - Activate Contingency Plan (primary)
  - Redistribute Workload (secondary)

**Expected Impact**: Maintain service levels

### 7. Break Management

**Trigger**: `staff_on_break > active_staff_count * 0.25`

**Action Generated**:
- Title: "Optimize Break Scheduling"
- Priority: Low
- Category: Break
- Actions:
  - Stagger Break Times (primary)
  - View Break Schedule (secondary)

**Expected Impact**: Improve availability during peak times

## User Interactions

### Expanding Actions

Click on any action card to view:
- Detailed metadata (current vs target values)
- Estimated improvement metrics
- Time to implement
- Action buttons

### Taking Actions

Each recommendation provides:
- **Primary Action** - Main recommended step
- **Secondary Action** - Alternative or supporting step

Clicking an action button:
1. Triggers the `onActionTaken` callback
2. Logs the action (for analytics)
3. Can trigger actual system changes (in production)

### Dismissing Actions

Click the ✕ button to:
- Remove action from view
- Trigger `onActionDismissed` callback
- Store dismissal state (persists during session)

## Visual States

### Empty State

When no actions are recommended:
```
┌─────────────────────────┐
│          ✓              │
│  All Systems Optimal    │
│                         │
│ No immediate actions    │
│ required. Keep up the   │
│ great work!             │
└─────────────────────────┘
```

### Collapsed Action Card

```
┌─────────────────────────────────────────┐
│ 🚨 👥  Critical Staffing Shortage    ✕  │
│        [critical] [quick]                │
│                                          │
│ Short 3 staff members. Immediate        │
│ action needed to prevent SLA breach.     │
│                                          │
│ Expected Impact: Prevent SLA penalties   │
└─────────────────────────────────────────┘
```

### Expanded Action Card

```
┌─────────────────────────────────────────┐
│ 🚨 👥  Critical Staffing Shortage    ✕  │
│        [critical] [quick]                │
│                                          │
│ Short 3 staff members. Immediate        │
│ action needed to prevent SLA breach.     │
│                                          │
│ Expected Impact: Prevent SLA penalties   │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Current: 12                         │ │
│ │ Target: 15                          │ │
│ │ Improvement: Restore optimal coverage│ │
│ │ Time: 30-45 minutes                 │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ [Call in Backup Staff] [Request Overtime]│
└─────────────────────────────────────────┘
```

## Integration with Dashboard

### Layout Position

The Recommended Actions component is placed:
- **After**: Attendance section
- **Before**: Alert section
- **Width**: Full width (12 columns)

### Dashboard Grid Update

```scss
.recommendations-section {
  grid-column: span 12;
}
```

### Data Flow

```
Real-time WebSocket Updates
         ↓
   Dashboard State
         ↓
   (currentKPIs, currentBacklog, currentAttendance)
         ↓
 RecommendedActions Component
         ↓
   AI Rule Engine
         ↓
  Prioritized Actions List
```

## Usage Example

```tsx
import RecommendedActions from './RecommendedActions';

<RecommendedActions
  kpiData={currentKPIs}
  backlogData={currentBacklog}
  attendanceData={currentAttendance}
  onActionTaken={(actionId, actionType) => {
    // Log analytics
    analytics.track('action_taken', { actionId, actionType });
    
    // Trigger actual action handler
    switch (actionType) {
      case 'redistribute':
        handleWorkRedistribution();
        break;
      case 'call-backup':
        openBackupStaffModal();
        break;
      // ... other cases
    }
  }}
  onActionDismissed={(actionId) => {
    // Log dismissal
    analytics.track('action_dismissed', { actionId });
    
    // Optionally store in user preferences
    saveUserPreference('dismissed_actions', actionId);
  }}
/>
```

## Styling Customization

### Priority Colors

```scss
.priority-critical { border-left-color: #f44336; }
.priority-high { border-left-color: #ff9800; }
.priority-medium { border-left-color: #2196f3; }
.priority-low { border-left-color: #9e9e9e; }
```

### Effort Tags

```scss
.effort-quick { color: #4caf50; }    // Green
.effort-moderate { color: #f57c00; } // Orange
.effort-complex { color: #9c27b0; }  // Purple
```

### Animations

```scss
@keyframes expandDetails {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}
```

## Responsive Behavior

### Desktop (> 768px)
- Multi-column metadata grid
- Horizontal action buttons
- Hover effects enabled

### Mobile (≤ 768px)
- Single-column metadata
- Stacked action buttons
- Full-width cards
- Touch-optimized tap targets

## Best Practices

### 1. Keep Actions Specific

✅ **Good**: "Call in 2 backup staff from Pool A"
❌ **Bad**: "Fix staffing issue"

### 2. Provide Clear Impact

✅ **Good**: "Reduce wait time by 8 minutes, prevent 15 SLA breaches"
❌ **Bad**: "Improve performance"

### 3. Set Realistic Timeframes

✅ **Good**: "15-20 minutes to implement"
❌ **Bad**: "Quick"

### 4. Prioritize Accurately

- **Critical**: Immediate business impact, potential penalties
- **High**: Urgent but not emergency
- **Medium**: Important optimization
- **Low**: Nice-to-have improvements

### 5. Limit Recommendations

- Show only top 5-7 most impactful actions
- Too many recommendations = analysis paralysis
- Focus on actionable, achievable steps

## Future Enhancements

### Phase 2 Features

1. **ML-Based Predictions**
   - Historical pattern analysis
   - Predictive recommendations
   - Success rate tracking

2. **Action Templates**
   - Pre-configured action workflows
   - One-click execution
   - Automated delegation

3. **Impact Tracking**
   - Before/after metrics
   - ROI calculation
   - Success scoring

4. **User Preferences**
   - Persistent dismissals
   - Custom thresholds
   - Notification settings

5. **Collaborative Actions**
   - Multi-user approval
   - Team notifications
   - Action history log

## Performance Considerations

### Recommendation Generation

- **Memoized**: Uses `useMemo` to prevent unnecessary recalculations
- **Conditional**: Only generates when data changes
- **Efficient**: Sorting and filtering done once per update

### State Management

- **Minimal Re-renders**: Dismissals use Set for O(1) lookups
- **Controlled Expansion**: Only one card expanded at a time
- **Event Delegation**: Efficient click handling

## Testing Strategy

### Unit Tests

```typescript
describe('RecommendedActions', () => {
  it('generates low utilization action when below 60%', () => {
    const kpiData = { utilization: { current_utilization: 0.55 } };
    const { recommendations } = renderComponent({ kpiData });
    expect(recommendations[0].title).toContain('Utilization');
  });

  it('prioritizes critical actions first', () => {
    const { recommendations } = renderWithCriticalData();
    expect(recommendations[0].priority).toBe('critical');
  });

  it('handles action dismissal', () => {
    const onDismiss = jest.fn();
    const { getByText } = render({ onActionDismissed: onDismiss });
    fireEvent.click(getByText('✕'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
```

### Integration Tests

- Verify recommendations update with real-time data
- Test action button click handlers
- Validate expand/collapse behavior
- Check responsive layout breakpoints

## Accessibility

- ✅ Keyboard navigation for all buttons
- ✅ ARIA labels for icon buttons
- ✅ Semantic HTML structure
- ✅ Screen reader friendly descriptions
- ✅ Color contrast compliance (WCAG AA)
- ✅ Focus indicators on interactive elements

## Analytics Events

Track these events for insights:

```typescript
// Action taken
analytics.track('recommended_action_taken', {
  action_id: string,
  action_type: string,
  priority: string,
  category: string,
  timestamp: Date
});

// Action dismissed
analytics.track('recommended_action_dismissed', {
  action_id: string,
  priority: string,
  timestamp: Date
});

// Action expanded
analytics.track('recommended_action_expanded', {
  action_id: string,
  timestamp: Date
});
```

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: January 31, 2026
