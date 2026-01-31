# Intraday Dashboard UI - Complete Implementation Guide

## Overview

The Intraday Dashboard is a comprehensive real-time operational monitoring interface that displays live KPIs, backlog metrics, attendance statistics, and system alerts through WebSocket connections.

## Architecture

### Component Structure

```
IntradayDashboard/
├── IntradayDashboard.tsx          # Main container component
├── IntradayDashboard.scss         # Main dashboard styles
├── KPIWidget.tsx                  # Individual KPI display
├── KPIWidget.scss                 # KPI widget styles
├── BacklogWidget.tsx              # Backlog metrics display
├── BacklogWidget.scss             # Backlog widget styles
├── AttendanceWidget.tsx           # Attendance tracking display
├── AttendanceWidget.scss          # Attendance widget styles
├── AlertPanel.tsx                 # Slide-out alert management panel
├── AlertPanel.scss                # Alert panel styles
├── ConnectionStatus.tsx           # WebSocket connection indicator
├── ConnectionStatus.scss          # Connection status styles
├── DashboardHeader.tsx            # Dashboard header with controls
└── DashboardHeader.scss           # Header styles
```

## Components

### 1. IntradayDashboard (Main Container)

**Purpose**: Orchestrates all dashboard components and manages WebSocket connections.

**Props**:
```typescript
interface IntradayDashboardProps {
  userId: string;
  organizationId: string;
  departmentId?: string;
  queueName?: string;
  siteName?: string;
}
```

**Key Features**:
- **WebSocket Integration**: Uses all custom hooks (useWebSocket, useKPIUpdates, useBacklogUpdates, useAttendanceUpdates, useAlertNotifications, useWebSocketHealth)
- **State Management**: Manages real-time data for KPIs, backlog, attendance, and alerts
- **Health Calculation**: Computes overall system health from KPI health_score
  - Excellent: ≥ 85
  - Good: ≥ 70
  - Warning: ≥ 50
  - Critical: < 50
- **Alert Management**: Stores last 50 alerts, auto-shows panel for critical alerts
- **Connection Monitoring**: Displays connection status with latency metrics
- **User Controls**: Time range filter (1h/4h/8h/24h) and auto-refresh toggle

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ DashboardHeader                                 │
├─────────────────────────────────────────────────┤
│ ConnectionStatus                                │
├─────────────────────────────────────────────────┤
│ KPI Section (4 widgets in a row)              │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│ │Util │ │HC   │ │SLA  │ │Health│              │
│ └─────┘ └─────┘ └─────┘ └─────┘              │
├───────────────────────────┬─────────────────────┤
│ Backlog Section          │ Attendance Section  │
│ (8 columns)              │ (4 columns)         │
├─────────────────────────────────────────────────┤
│ Alert Section (Latest alert + View All)        │
└─────────────────────────────────────────────────┘
```

### 2. KPIWidget

**Purpose**: Displays individual KPI metrics with real-time updates.

**Props**:
```typescript
interface KPIWidgetProps {
  type: 'utilization' | 'headcount' | 'sla' | 'health';
  data: KPIUpdatePayload | null;
  isLoading?: boolean;
}
```

**Features by Type**:

**Utilization**:
- Current utilization percentage
- Productive hours / Available hours
- Efficiency rate
- Change indicator (positive/negative)

**Headcount**:
- Headcount gap value
- Staffing level status (optimal/acceptable/understaffed/critical)
- Current vs. required headcount
- Coverage ratio

**SLA**:
- Risk score (0-100)
- Risk level (low/medium/high)
- Compliance percentage
- Average wait time
- Items at risk count

**Health**:
- Overall health score (0-100)
- Animated SVG ring visualization
- Summary of utilization, coverage, SLA

**Visual States**:
- Status colors: Excellent (green), Good (lime), Warning (orange), Critical (red)
- Hover effects with elevation
- Skeleton loading states

### 3. BacklogWidget

**Purpose**: Displays real-time backlog metrics and trends.

**Props**:
```typescript
interface BacklogWidgetProps {
  data: BacklogUpdatePayload | null;
  isLoading?: boolean;
}
```

**Metrics Displayed**:
- **Total Items**: With trend indicator (growing/decreasing/stable)
- **Avg Wait Time**: In minutes
- **Items Over SLA**: Warning-styled count
- **SLA Compliance**: Percentage with progress bar

**Activity Section**:
- Items added this interval
- Items completed this interval
- Net change calculation

**Visual Features**:
- Primary metric card with gradient background
- Trend icons (📈 growing, 📉 decreasing, ➡️ stable)
- Color-coded activity indicators
- Progress bar for SLA compliance

### 4. AttendanceWidget

**Purpose**: Displays real-time attendance metrics and recent check-ins.

**Props**:
```typescript
interface AttendanceWidgetProps {
  data: AttendanceUpdatePayload | null;
  isLoading?: boolean;
}
```

**Features**:
- **Attendance Ring**: Animated SVG circle showing attendance rate
- **Breakdown Grid**:
  - Present count (green checkmark)
  - Absent count (red X)
  - Late count (orange clock)
  - Total scheduled (blue people)
- **Recent Check-ins**: List of last 5 check-ins with:
  - Employee avatar (initial letter)
  - Employee name
  - Check-in time
  - Status indicator (present/late)

**Visual Features**:
- Circular attendance visualization
- Color-coded status items
- Animated transitions on hover
- Avatar-based check-in list

### 5. AlertPanel

**Purpose**: Slide-out panel for viewing and managing alerts.

**Props**:
```typescript
interface AlertPanelProps {
  alerts: AlertNotification[];
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}
```

**Features**:
- **Filtering**:
  - By severity (critical/high/medium/low)
  - By status (pending/acknowledged/resolved)
- **Alert Display**:
  - Severity icon (🔴🟠🟡🟢)
  - Rule name
  - Status badge
  - Alert message
  - Detailed metrics (current value, threshold, queue, site)
  - Timestamps (triggered, acknowledged, resolved)
- **Actions**:
  - Acknowledge button (for pending alerts)
  - Resolve button (for pending/acknowledged alerts)

**Visual Features**:
- Slide-in animation from right
- Backdrop overlay
- Color-coded severity borders
- Responsive mobile (full-screen)

### 6. ConnectionStatus

**Purpose**: Banner showing WebSocket connection health.

**Props**:
```typescript
interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
  error?: string | null;
  latency?: number;
  socketId?: string;
}
```

**Status States**:
- **Excellent**: < 100ms latency (green)
- **Good**: 100-299ms (lime green)
- **Fair**: 300-999ms (orange)
- **Poor**: ≥ 1000ms (red)
- **Connecting**: Blue with pulsing animation
- **Error**: Red with error message

**Displayed Metrics**:
- Connection quality label
- Latency in milliseconds
- Socket ID (truncated)

### 7. DashboardHeader

**Purpose**: Header bar with controls and overall status.

**Props**:
```typescript
interface DashboardHeaderProps {
  siteName?: string;
  queueName?: string;
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  autoRefresh: boolean;
  onAutoRefreshToggle: () => void;
  onRefresh?: () => void;
}
```

**Sections**:
- **Left**: Dashboard title + site/queue context badges
- **Center**: Overall health indicator with icon
- **Right**: Time range selector, auto-refresh toggle, manual refresh button

**Visual Features**:
- Gradient title text
- Color-coded health indicator with pulsing animation for critical status
- Custom toggle switch for auto-refresh
- Rotating refresh button animation

## Styling System

### Color Palette

**Health/Status Colors**:
- Excellent: `#4caf50` (green)
- Good: `#8bc34a` (lime green)
- Warning: `#ff9800` (orange)
- Critical: `#f44336` (red)

**Severity Colors**:
- Critical: `#f44336`
- High: `#ff9800`
- Medium: `#ffc107`
- Low: `#4caf50`

**Brand Gradients**:
- Primary: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Background: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`

### Responsive Breakpoints

```scss
// Desktop (default)
@media (max-width: 1400px) {
  // Tablet landscape
  - KPI widgets: 2 columns
  - Backlog: full width
  - Attendance: full width
}

@media (max-width: 768px) {
  // Mobile
  - KPI widgets: 1 column
  - All sections: full width
  - Alert panel: full screen
  - Header: stacked layout
}
```

### Animations

**Loading Spinner**:
```scss
animation: spin 1s linear infinite;
```

**Skeleton Loader**:
```scss
animation: loading 1.5s infinite;
background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
```

**Health Pulse** (critical status):
```scss
animation: pulse-health 2s infinite;
```

**Slide-In** (alert panel):
```scss
transition: right 0.3s ease;
```

## Usage Example

```typescript
import React from 'react';
import IntradayDashboard from './components/IntradayDashboard/IntradayDashboard';

function App() {
  return (
    <IntradayDashboard
      userId="user-123"
      organizationId="org-456"
      departmentId="dept-789"
      queueName="Customer Service"
      siteName="Chicago Facility"
    />
  );
}

export default App;
```

## WebSocket Integration

### Connection Flow

1. **Initialize**: Dashboard calls `useWebSocket()` with auto-connect
2. **Authenticate**: Hook automatically authenticates with userId/orgId
3. **Subscribe**: Dashboard subscribes to all data streams:
   - `useKPIUpdates()` → KPI metrics
   - `useBacklogUpdates()` → Backlog data
   - `useAttendanceUpdates()` → Attendance stats
   - `useAlertNotifications()` → System alerts
4. **Update**: State updates trigger component re-renders
5. **Monitor**: `useWebSocketHealth()` tracks connection quality

### Data Flow Diagram

```
Backend Services → WebSocket Server → Client Hooks → Dashboard State → UI Components
                    ↑                                     ↓
                    └─────────── Subscriptions ───────────┘
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Use `useMemo` for computed values (overall health)
2. **Alert Limiting**: Store only last 50 alerts to prevent memory bloat
3. **Conditional Rendering**: Only render components when data is available
4. **CSS Transitions**: Hardware-accelerated transforms and opacity
5. **Debouncing**: Avoid excessive re-renders on rapid updates

### Resource Management

- **WebSocket**: Single persistent connection shared across hooks
- **State**: Minimal state duplication, use props for data flow
- **Styling**: SCSS modules for component-scoped styles, no global pollution
- **Assets**: SVG graphics for scalable icons

## Accessibility

### ARIA Labels

- Add `aria-label` to icon buttons
- Use semantic HTML (`<header>`, `<main>`, `<section>`)
- Ensure keyboard navigation for interactive elements

### Screen Reader Support

- Provide text alternatives for visual indicators
- Announce connection status changes
- Alert notifications should use `role="alert"`

## Testing Strategy

### Unit Tests

```typescript
// Example: KPIWidget.test.tsx
describe('KPIWidget', () => {
  it('renders utilization metrics correctly', () => {
    const mockData = { /* ... */ };
    render(<KPIWidget type="utilization" data={mockData} />);
    expect(screen.getByText(/utilization/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<KPIWidget type="utilization" data={null} isLoading={true} />);
    expect(screen.getByClassName('skeleton-loader')).toBeInTheDocument();
  });
});
```

### Integration Tests

- Test WebSocket connection lifecycle
- Verify data updates propagate to UI
- Test alert panel interactions
- Validate filter functionality

## Deployment Checklist

- [ ] Configure WebSocket server URL for production
- [ ] Set up environment variables for API endpoints
- [ ] Enable CORS for WebSocket connections
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify mobile responsiveness
- [ ] Load test with multiple concurrent users
- [ ] Set up monitoring for WebSocket errors
- [ ] Configure auto-reconnection settings
- [ ] Document deployment process

## Troubleshooting

### Common Issues

**WebSocket connection fails**:
- Check server URL configuration
- Verify CORS settings
- Ensure authentication token is valid

**Data not updating**:
- Confirm broadcasting is enabled in services
- Check network tab for WebSocket messages
- Verify subscription topics match server events

**UI performance issues**:
- Check for excessive re-renders (React DevTools)
- Verify alert list is limited to 50 items
- Ensure CSS animations are GPU-accelerated

## Future Enhancements

1. **Export Functionality**: CSV/PDF export of dashboard data
2. **Custom Layouts**: Drag-and-drop widget rearrangement
3. **Historical Playback**: Scrub timeline to view past states
4. **Alert Rules UI**: In-dashboard rule configuration
5. **Multi-Site View**: Compare metrics across multiple sites
6. **Mobile App**: Native iOS/Android applications
7. **Voice Alerts**: Audio notifications for critical alerts
8. **Dark Mode**: User-selectable theme

## Support

For issues or questions:
- Check WEBSOCKET_IMPLEMENTATION.md for connection troubleshooting
- Review REALTIME_BROADCASTING.md for backend integration
- Consult component source code for detailed implementation

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
