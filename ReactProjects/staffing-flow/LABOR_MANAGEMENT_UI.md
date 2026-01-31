# Labor Actions Management UI - Complete Documentation

## Overview

The Labor Actions Management UI is a comprehensive manager/administrator portal for overseeing and managing all aspects of the labor actions system. It provides powerful tools for managing VET/VTO opportunities, approving PTO requests, monitoring UPT exceptions, and viewing team analytics.

## Architecture

### Component Structure

```
labor-actions-management/
├── LaborActionsManagement.tsx       # Main container with tab navigation
├── VETVTOManagement.tsx             # VET/VTO creation & response management
├── PTOApprovalDashboard.tsx         # PTO approval workflow
├── UPTManagement.tsx                # UPT exception oversight
├── AnalyticsDashboard.tsx           # Team analytics & metrics
└── LaborActionsManagement.css       # Comprehensive styling
```

### Service Layer

- **File**: `services/laborActionsManagementService.ts`
- **Purpose**: Clean API abstraction for all management operations
- **Functions**: 15 API functions covering VET/VTO, PTO, UPT, and Analytics

## Features by Component

### 1. Main Portal (LaborActionsManagement.tsx)

**Purpose**: Central hub with tab-based navigation

**Features**:
- 5-tab navigation system
  - Overview Dashboard
  - VET/VTO Management
  - PTO Approvals
  - UPT Management
  - Analytics
- Manager information header
- Compact mode for overview dashboard

**Props**:
```typescript
interface ManagerInfo {
  manager_id: string;
  manager_name: string;
  department_id: string;
  department_name: string;
  organization_id: string;
  role: 'manager' | 'admin' | 'hr';
}
```

**Usage**:
```tsx
import { LaborActionsManagement } from './components/labor-actions-management/LaborActionsManagement';

// With specific manager
<LaborActionsManagement manager={managerData} />

// With demo data (uses mock manager)
<LaborActionsManagement />
```

---

### 2. VET/VTO Management (VETVTOManagement.tsx)

**Purpose**: Create labor action opportunities and manage employee responses

**Features**:

#### Create Offer Form
- **Action Type**: VET or VTO dropdown
- **Shift Date**: Date picker (minimum: today)
- **Shift Type**: Day/Night/Evening/Weekend
- **Time Range**: Start and end time inputs
- **Positions Offered**: Number input (1-50)
- **Optional Deadline**: Datetime picker for response cutoff
- **Optional Reason**: Textarea for offer explanation
- **Form Validation**: Ensures all required fields are filled

#### Active Offers List
- **Visual Distinction**: 
  - VET offers: Green border and gradient background
  - VTO offers: Orange border and gradient background
- **Offer Details**:
  - Shift date and time
  - Shift type
  - Position tracking (filled/offered/remaining)
  - Deadline display
- **Actions**: Close offer button with confirmation

#### Response Management
- **Response List**: Shows all employee responses per offer
- **Response Information**:
  - Employee name and acceptance status (✅/❌)
  - Status badge (pending/approved/rejected)
  - Response timestamp
- **Actions**:
  - **Approve**: Confirm employee acceptance
  - **Reject**: Prompt for reason and reject

**Key Methods**:
```typescript
loadActions(): Promise<void>
handleCreateAction(e: FormEvent): Promise<void>
handleApproveResponse(responseId: string): Promise<void>
handleRejectResponse(responseId: string): Promise<void>
handleCloseAction(actionId: string): Promise<void>
```

**Compact Mode**: Limits display to 3 offers for overview dashboard

---

### 3. PTO Approval Dashboard (PTOApprovalDashboard.tsx)

**Purpose**: Review and approve/deny employee PTO requests

**Features**:

#### Request Display
- **Table View**: Comprehensive table with all pending requests
- **Employee Information**:
  - Name and department
  - Current PTO balance
- **Request Details**:
  - PTO type (Vacation/Sick/Personal/etc.)
  - Date range (start to end)
  - Total hours requested
  - Submission date
  - Request reason
- **Balance Indicator**:
  - ✅ Green: Sufficient balance
  - ⚠️ Red: Insufficient balance

#### Approval Actions
- **Approve Button**: Instantly approve request
- **Deny Button**: Prompt for denial reason before rejecting
- **Processing State**: Buttons disabled during API call

**Key Methods**:
```typescript
loadRequests(): Promise<void>
handleApprove(requestId: string): Promise<void>
handleDeny(requestId: string): Promise<void>
```

**Compact Mode**: Limits display to 5 requests for overview dashboard

---

### 4. UPT Management (UPTManagement.tsx)

**Purpose**: Monitor attendance exceptions and manage at-risk employees

**Features**:

#### Two Views
1. **At-Risk Employees** (default)
   - Lists employees with low UPT balances
   - Status categories: Healthy, Warning, Critical
   - Shows exception count (last 30 days)
   - Displays last exception date
   - Provides recommended actions

2. **Recent Exceptions**
   - Lists unexcused attendance exceptions
   - Shows exception type, date/time, severity
   - Displays minutes missed and UPT deducted
   - Shows current employee balance
   - Excuse button for legitimate absences

#### View Toggle
- Switch between "At-Risk Employees" and "Recent Exceptions"
- Only available in full view (not compact mode)

#### Exception Detection
- **Manual Trigger**: "Detect Exceptions" button
- **Functionality**:
  - Analyzes attendance data for today
  - Creates new exceptions
  - Deducts UPT hours
  - Returns summary of detected issues
- **Confirmation**: Requires user confirmation before running

#### Status Indicators
- **Balance Status**:
  - Healthy: Green badge (≥20 hours)
  - Warning: Yellow badge (10-19 hours)
  - Critical: Red badge (<10 hours)
- **Severity Levels**:
  - Minor: Blue badge
  - Moderate: Yellow badge
  - Major: Orange badge
  - Critical: Red badge

**Key Methods**:
```typescript
loadData(): Promise<void>
handleExcuse(exceptionId: string): Promise<void>
handleDetectExceptions(): Promise<void>
```

**Helper Functions**:
```typescript
getBalanceStatusColor(status: string): string
getSeverityColor(severity: string): string
```

---

### 5. Analytics Dashboard (AnalyticsDashboard.tsx)

**Purpose**: Visualize team performance and labor metrics

**Features**:

#### Date Range Selector
- Last Week
- Last Month
- Last Quarter
- Dynamically refreshes data on selection

#### Summary Cards
Three color-coded summary cards:

1. **VET/VTO Card** (Blue)
   - Total VET offered
   - Total VTO offered
   - VET acceptance rate
   - VTO acceptance rate

2. **PTO Card** (Green)
   - Total requests
   - Pending requests
   - Approval rate
   - Average approval time (hours)

3. **UPT Card** (Orange)
   - Total exceptions
   - Employees healthy
   - Employees warning
   - Employees critical

#### Detailed Breakdowns
(Only in full view, not compact mode)

1. **PTO Requests by Type**
   - Table showing request counts by PTO type
   - Approval rate with visual progress bar
   - Color-coded for easy scanning

2. **UPT Exceptions by Type**
   - Table showing exception counts by type
   - Average hours deducted per type
   - Helps identify common issues

3. **Performance by Department**
   - Total exceptions per department
   - Employees at risk count
   - Visual badges for at-risk status

**Key Methods**:
```typescript
loadAnalytics(): Promise<void>
getDateRange(): { startDate: string; endDate: string }
```

**Compact Mode**: Shows only summary cards without detailed breakdowns

---

## Service Layer API

### VET/VTO Functions

```typescript
// Create new VET or VTO opportunity
createLaborAction(request: CreateLaborActionRequest): Promise<LaborAction>

// Get labor actions with responses
getLaborActions(
  orgId: string,
  filters?: { department_id?: string; status?: string; limit?: number }
): Promise<LaborActionWithResponses[]>

// Approve employee response
approveResponse(
  responseId: string,
  orgId: string,
  reviewedBy: string
): Promise<void>

// Reject employee response
rejectResponse(
  responseId: string,
  orgId: string,
  reviewedBy: string,
  reason: string
): Promise<void>

// Close labor action to new responses
closeLaborAction(actionId: string, orgId: string): Promise<void>
```

### PTO Functions

```typescript
// Get pending PTO requests
getPendingPTORequests(
  orgId: string,
  deptId?: string
): Promise<PTORequestWithEmployee[]>

// Approve PTO request
approvePTORequest(
  requestId: string,
  orgId: string,
  approvedBy: string,
  notes?: string
): Promise<void>

// Deny PTO request
denyPTORequest(
  requestId: string,
  orgId: string,
  approvedBy: string,
  denialReason: string
): Promise<void>
```

### UPT Functions

```typescript
// Get UPT exceptions with filters
getUPTExceptions(
  orgId: string,
  filters?: {
    employee_id?: string;
    department_id?: string;
    is_excused?: boolean;
    severity?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<UPTExceptionWithEmployee[]>

// Excuse exception and optionally refund UPT
excuseUPTException(
  exceptionId: string,
  orgId: string,
  approvedBy: string,
  reason: string,
  refundHours: boolean
): Promise<void>

// Get at-risk employees
getEmployeesAtRisk(
  orgId: string,
  deptId?: string,
  statusFilter?: string[]
): Promise<EmployeeAtRisk[]>

// Manually trigger exception detection
detectUPTExceptions(
  orgId: string,
  deptId?: string,
  dates?: string[]
): Promise<{
  exceptions_detected: number;
  exceptions_created: number;
  upt_hours_deducted: number;
  employees_affected: number;
}>
```

### Analytics Functions

```typescript
// Get VET/VTO analytics
getLaborActionsAnalytics(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<LaborActionsAnalytics>

// Get PTO analytics
getPTOAnalytics(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<PTOAnalytics>

// Get UPT analytics
getUPTAnalytics(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<UPTAnalytics>
```

---

## Data Models

### CreateLaborActionRequest
```typescript
interface CreateLaborActionRequest {
  action_type: 'VET' | 'VTO';
  shift_date: string;
  shift_type: 'Day' | 'Night' | 'Evening' | 'Weekend';
  start_time: string;
  end_time: string;
  positions_offered: number;
  department_id?: string;
  reason?: string;
  deadline?: string;
}
```

### LaborActionWithResponses
```typescript
interface LaborActionWithResponses {
  action_id: string;
  action_type: 'VET' | 'VTO';
  shift_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  positions_offered: number;
  positions_filled: number;
  status: 'open' | 'filled' | 'closed';
  deadline?: string;
  reason?: string;
  responses: LaborActionResponse[];
}
```

### PTORequestWithEmployee
```typescript
interface PTORequestWithEmployee {
  request_id: string;
  employee_id: string;
  employee_name: string;
  department_name: string;
  pto_type: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  reason?: string;
  submitted_at: string;
  employee_balance?: number;
}
```

### UPTExceptionWithEmployee
```typescript
interface UPTExceptionWithEmployee {
  exception_id: string;
  employee_id: string;
  employee_name: string;
  department_name: string;
  exception_type: string;
  exception_date: string;
  occurrence_time: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  minutes_missed: number;
  upt_hours_deducted: number;
  is_excused: boolean;
  excuse_reason?: string;
  current_balance?: number;
  balance_status?: string;
}
```

### EmployeeAtRisk
```typescript
interface EmployeeAtRisk {
  employee_id: string;
  employee_name: string;
  department_id: string;
  department_name: string;
  current_balance_hours: number;
  balance_status: 'healthy' | 'warning' | 'critical';
  exceptions_last_30_days: number;
  last_exception_date?: string;
  recommended_action: string;
}
```

---

## Styling

### CSS Architecture

- **File**: `LaborActionsManagement.css`
- **Lines**: ~800 lines
- **Approach**: Component-scoped classes with BEM-like naming

### Key Style Features

1. **Color Scheme**:
   - Primary: Purple gradient (#667eea → #764ba2)
   - Success: Green (#10b981)
   - Warning: Yellow/Orange (#f59e0b)
   - Danger: Red (#ef4444)
   - Info: Blue (#dbeafe)

2. **Layout**:
   - Responsive grid system
   - Card-based UI components
   - Flexible table layouts
   - Mobile-first approach

3. **Interactive Elements**:
   - Hover effects with elevation
   - Smooth transitions (0.2s)
   - Disabled states
   - Focus indicators

4. **Typography**:
   - System font stack
   - Consistent sizing scale
   - Font weights for hierarchy

5. **Responsive Design**:
   - Breakpoint: 768px
   - Grid adjustments for mobile
   - Stacked layouts on small screens

---

## Usage Examples

### Basic Setup

```tsx
import { LaborActionsManagement } from './components/labor-actions-management/LaborActionsManagement';

function App() {
  return (
    <div>
      <LaborActionsManagement />
    </div>
  );
}
```

### With Manager Data

```tsx
const managerData = {
  manager_id: 'mgr_001',
  manager_name: 'Sarah Johnson',
  department_id: 'dept_wh_a',
  department_name: 'Warehouse A',
  organization_id: 'org_001',
  role: 'manager' as const,
};

<LaborActionsManagement manager={managerData} />
```

### Standalone Components

```tsx
// Use individual components
import { VETVTOManagement } from './components/labor-actions-management/VETVTOManagement';
import { PTOApprovalDashboard } from './components/labor-actions-management/PTOApprovalDashboard';

<VETVTOManagement manager={managerData} />
<PTOApprovalDashboard manager={managerData} compact />
```

---

## Best Practices

### Manager Operations

1. **VET/VTO Creation**:
   - Set realistic deadlines
   - Provide clear reasons for VTO
   - Monitor acceptance rates
   - Close offers when filled

2. **PTO Approval**:
   - Review balance before approving
   - Respond within 24-48 hours
   - Provide clear denial reasons
   - Consider team coverage

3. **UPT Management**:
   - Review at-risk employees weekly
   - Investigate repeated exceptions
   - Document excuse reasons clearly
   - Take proactive action for critical cases

4. **Analytics Review**:
   - Check metrics weekly
   - Identify trends early
   - Address department disparities
   - Adjust policies based on data

### Development

1. **Error Handling**:
   - All API calls wrapped in try-catch
   - User-friendly error messages
   - Error state displayed in UI

2. **Loading States**:
   - Loading indicators during API calls
   - Disabled buttons during processing
   - Skeleton screens for large data

3. **Confirmations**:
   - Confirm destructive actions (close offer, reject)
   - Prompt for required information (denial reasons)
   - Success feedback after operations

4. **Data Refresh**:
   - Auto-refresh after mutations
   - Manual refresh option
   - Optimistic UI updates

---

## Integration with App.tsx

The management portal is integrated into the main application navigation:

```tsx
// In App.tsx
import { LaborActionsManagement } from './components/labor-actions-management/LaborActionsManagement';

type Page = '...' | 'labor-management';

// Navigation button
<button 
  className={currentPage === 'labor-management' ? 'active' : ''} 
  onClick={() => setCurrentPage('labor-management')}
>
  👔 Labor Management
</button>

// Route
{currentPage === 'labor-management' && <LaborActionsManagement />}
```

---

## File Structure Summary

```
staffing-flow/
├── src/
│   ├── components/
│   │   └── labor-actions-management/
│   │       ├── LaborActionsManagement.tsx       (100 lines)
│   │       ├── VETVTOManagement.tsx             (350 lines)
│   │       ├── PTOApprovalDashboard.tsx         (180 lines)
│   │       ├── UPTManagement.tsx                (300 lines)
│   │       ├── AnalyticsDashboard.tsx           (250 lines)
│   │       └── LaborActionsManagement.css       (800 lines)
│   ├── services/
│   │   └── laborActionsManagementService.ts     (350 lines)
│   └── App.tsx                                   (updated)
```

**Total**: ~2,330 lines of new code

---

## Testing Recommendations

### Component Testing

1. **VET/VTO Management**:
   - Test form validation
   - Test offer creation
   - Test response approval/rejection
   - Test close offer confirmation

2. **PTO Approval**:
   - Test approval flow
   - Test denial with reason
   - Test insufficient balance warning
   - Test request filtering

3. **UPT Management**:
   - Test view toggle
   - Test exception excuse flow
   - Test detection trigger
   - Test at-risk filtering

4. **Analytics**:
   - Test date range changes
   - Test data visualization
   - Test empty states
   - Test loading states

### Integration Testing

1. Test API service calls
2. Test error handling
3. Test loading states
4. Test data refresh after mutations
5. Test navigation between tabs

---

## Future Enhancements

### Potential Features

1. **Bulk Operations**:
   - Approve multiple PTO requests
   - Excuse multiple exceptions
   - Create recurring VET offers

2. **Advanced Filters**:
   - Filter by employee
   - Filter by date range
   - Filter by status
   - Sort by multiple columns

3. **Notifications**:
   - Alert for pending approvals
   - Notification for at-risk employees
   - Reminder for unfilled VET offers

4. **Export Functionality**:
   - Export analytics to CSV/PDF
   - Generate reports
   - Print-friendly views

5. **Calendar Integration**:
   - Visual calendar for VET/VTO
   - PTO calendar view
   - Conflict detection

6. **Employee Communication**:
   - Send messages to employees
   - Announce VET/VTO opportunities
   - Automated reminders

---

## Support & Maintenance

### Common Issues

**Issue**: Data not loading
- **Solution**: Check API endpoint configuration
- **Verify**: Organization ID and department ID are valid

**Issue**: Unable to approve/reject
- **Solution**: Verify manager permissions
- **Check**: Manager ID is valid and has correct role

**Issue**: Styles not applied
- **Solution**: Ensure CSS file is imported
- **Verify**: Build process includes CSS files

### Performance Optimization

1. **Data Pagination**:
   - Limit API results (use `limit` parameter)
   - Implement "Load More" functionality
   - Use virtual scrolling for large tables

2. **Caching**:
   - Cache analytics data
   - Implement stale-while-revalidate pattern
   - Use React Query or SWR

3. **Debouncing**:
   - Debounce search inputs
   - Throttle analytics refresh
   - Batch API calls

---

## Conclusion

The Labor Actions Management UI provides a comprehensive, production-ready solution for managing all aspects of labor operations. With 6 components, 15 API functions, and 800 lines of styling, it offers managers powerful tools to oversee VET/VTO, PTO, and UPT while maintaining visibility through detailed analytics.

### Key Strengths:
✅ Complete feature coverage
✅ Clean, maintainable code structure
✅ Responsive design
✅ User-friendly interface
✅ Comprehensive error handling
✅ Real-time data updates
✅ Extensible architecture

### Integration Status:
✅ Service layer complete
✅ All components implemented
✅ Styling complete
✅ App integration complete
✅ Documentation complete

**The system is ready for production use!**
