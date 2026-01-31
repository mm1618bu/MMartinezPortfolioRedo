# Employee Portal UI - Documentation

## Overview

The Employee Portal is a comprehensive self-service UI that allows employees to manage their labor actions (VET/VTO), request PTO, view attendance exceptions (UPT), and see their work schedule.

## 🎯 Features

### 1. **Labor Actions (VET/VTO)**
- View available VET (Voluntary Extra Time) and VTO (Voluntary Time Off) opportunities
- Accept or decline labor action offers
- Track response status (pending/approved/rejected)
- See offer deadlines and remaining positions

### 2. **PTO Requests**
- View PTO balances by type (vacation, sick, personal, etc.)
- Submit new PTO requests with date ranges
- Track request status (pending/approved/denied)
- Cancel pending requests
- View approval history

### 3. **UPT Tracking (Attendance)**
- Visual UPT balance display with circular progress indicator
- Balance status monitoring (healthy/warning/critical/terminated)
- Recent attendance exceptions list
- Exception details (type, severity, hours deducted)
- Threshold warnings

### 4. **My Schedule**
- Week and month view options
- Visual calendar display of shifts
- Shift details (time, type, department, duration)
- Total hours summary
- Navigate between periods

## 📁 File Structure

```
src/
├── components/
│   └── employee-portal/
│       ├── EmployeePortal.tsx          # Main portal container
│       ├── LaborActionsCard.tsx        # VET/VTO management
│       ├── PTORequestCard.tsx          # PTO requests & balances
│       ├── UPTBalanceCard.tsx          # UPT balance & exceptions
│       ├── MyScheduleCard.tsx          # Schedule calendar
│       ├── EmployeePortal.css          # Comprehensive styling
│       └── index.ts                    # Barrel exports
└── services/
    └── laborActionsService.ts          # API service layer
```

## 🚀 Getting Started

### Installation

The Employee Portal is already integrated into the main application. Simply navigate to the "Employee Portal" tab in the navigation bar.

### Usage

```tsx
import { EmployeePortal } from './components/employee-portal';

// With default mock employee
<EmployeePortal />

// With custom employee data
<EmployeePortal 
  employee={{
    employee_id: 'emp-123',
    employee_name: 'Jane Smith',
    organization_id: 'org-456',
    department_id: 'dept-789',
    department_name: 'Warehouse B',
    email: 'jane.smith@company.com'
  }}
/>
```

## 🎨 Component Details

### EmployeePortal (Main Container)

**Props:**
- `employee?: EmployeeInfo` - Employee information (uses mock data if not provided)

**Features:**
- Tabbed navigation (Overview, VET/VTO, PTO, Attendance, Schedule)
- Overview dashboard with all cards in compact mode
- Individual tabs show full card views

### LaborActionsCard

**Props:**
- `employee: EmployeeInfo` - Employee information
- `compact?: boolean` - Display mode (default: false)

**Features:**
- Lists available VET/VTO opportunities
- Accept/Decline buttons for each offer
- Shows position availability and deadlines
- Tracks employee responses
- Visual distinction between VET (green) and VTO (orange)

**States:**
- Loading state while fetching data
- Error state with retry button
- Empty state when no opportunities available

### PTORequestCard

**Props:**
- `employee: EmployeeInfo` - Employee information
- `compact?: boolean` - Display mode (default: false)

**Features:**
- **PTO Balances**: Displays available hours by type
- **Request Form**: Submit new PTO requests
  - Select PTO type (vacation, sick, personal, etc.)
  - Choose date range
  - Enter total hours
  - Optional reason
- **Request List**: View all PTO requests
  - Status badges (pending/approved/denied)
  - Cancel pending requests
  - View denial reasons

### UPTBalanceCard

**Props:**
- `employee: EmployeeInfo` - Employee information
- `compact?: boolean` - Display mode (default: false)

**Features:**
- **Balance Circle**: Visual representation of remaining UPT
  - Color-coded by status (green/yellow/red/black)
  - Percentage-based progress circle
- **Balance Details**: Statistics breakdown
  - Initial balance
  - Total used/excused hours
  - Monthly/yearly exception counts
- **Thresholds Bar**: Visual threshold markers
  - Warning threshold (e.g., 10 hours)
  - Critical threshold (e.g., 5 hours)
  - Termination threshold (0 hours)
- **Status Alerts**: Contextual warnings
  - Warning alert when below warning threshold
  - Critical alert when below critical threshold
- **Exceptions List**: Recent attendance exceptions
  - Exception type icons
  - Severity badges
  - Minutes missed and UPT deducted
  - Excuse status
- **UPT Info**: Educational section explaining the system

### MyScheduleCard

**Props:**
- `employee: EmployeeInfo` - Employee information
- `compact?: boolean` - Display mode (default: false)

**Features:**
- **View Modes**: Week or month calendar view
- **Navigation**: Previous/Next/Today buttons
- **Summary Stats**: Total shifts and hours
- **Calendar Display**: 
  - Day-by-day breakdown
  - Shift details (time, type, department)
  - Weekend highlighting
  - Today indicator
  - Off days display

## 🎨 Styling

### Color Scheme

**Brand Colors:**
- Primary: `#667eea` (Purple)
- Secondary: `#764ba2` (Dark Purple)

**Status Colors:**
- Success: `#48bb78` (Green)
- Warning: `#ed8936` (Orange)
- Danger: `#f56565` (Red)
- Info: `#4299e1` (Blue)

**Neutral Colors:**
- Dark: `#2d3748`
- Medium: `#4a5568`
- Light: `#718096`
- Background: `#f7fafc`

### Layout

**Breakpoints:**
- Desktop: Default (1400px max-width container)
- Tablet: 768px and below (single column layout)

**Grid System:**
- Overview: Auto-fit grid with 450px min column width
- Calendar: Auto-fill grid with 150px min column width

## 📡 API Integration

### Labor Actions Service

The `laborActionsService.ts` provides a clean API interface:

```typescript
// VET/VTO
getAvailableLaborActions(orgId, employeeId)
respondToLaborAction(actionId, employeeId, responseType, orgId)
getMyLaborActionResponses(orgId, employeeId)

// PTO
getPTORequests(orgId, employeeId)
getPTOBalances(orgId, employeeId)
submitPTORequest(request)
cancelPTORequest(requestId, orgId, employeeId)

// UPT
getUPTBalance(orgId, employeeId)
getUPTExceptions(orgId, employeeId, limit)

// Schedule
getMySchedule(orgId, employeeId, startDate, endDate)
```

### API Endpoints

All endpoints are under `/api/labor-actions`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/actions/available` | Get available VET/VTO |
| POST | `/actions/:id/respond` | Accept/decline offer |
| GET | `/responses` | Get employee responses |
| GET | `/pto/requests` | Get PTO requests |
| GET | `/pto/balance` | Get PTO balances |
| POST | `/pto/requests` | Submit PTO request |
| POST | `/pto/requests/:id/cancel` | Cancel request |
| GET | `/upt/balance` | Get UPT balance |
| GET | `/upt/exceptions` | Get UPT exceptions |
| GET | `/schedule` | Get employee schedule |

## 🔧 Configuration

### Mock Data

The portal includes a default mock employee for demo purposes:

```typescript
const defaultEmployee: EmployeeInfo = {
  employee_id: 'emp-001',
  employee_name: 'John Doe',
  organization_id: 'org-123',
  department_id: 'dept-456',
  department_name: 'Warehouse A',
  email: 'john.doe@company.com',
};
```

### Compact Mode

Each card supports a `compact` prop for the overview dashboard:
- Limits displayed items (e.g., 3 VET/VTO opportunities)
- Hides detailed information
- Shows "View all" links

## 🎯 User Experience

### Loading States

All cards display a loading spinner while fetching data:
```tsx
<div className="loading-spinner">Loading...</div>
```

### Error States

Errors are displayed with retry functionality:
```tsx
<div className="error-message">{error}</div>
<button onClick={loadData}>Retry</button>
```

### Empty States

Friendly messages when no data is available:
```tsx
<div className="empty-state">
  <p>No items available at this time.</p>
  <p className="text-muted">Check back later...</p>
</div>
```

## 📱 Responsive Design

The portal is fully responsive:

- **Desktop (>768px)**: Multi-column grid layout
- **Tablet/Mobile (≤768px)**: Single column stack
  - Header switches to vertical layout
  - Tabs become horizontally scrollable
  - Cards stack vertically
  - Forms use single-column layout

## 🚨 Status Indicators

### UPT Balance Status

| Status | Color | Threshold | Action |
|--------|-------|-----------|--------|
| Healthy | Green | > 10 hrs | Monitor only |
| Warning | Yellow | ≤ 10 hrs | Coaching |
| Critical | Red | ≤ 5 hrs | Written warning |
| Terminated | Black | ≤ 0 hrs | Termination review |

### Exception Severity

| Severity | Color | Badge |
|----------|-------|-------|
| Minor | Blue | `badge-info` |
| Moderate | Orange | `badge-warning` |
| Major | Orange | `badge-warning` |
| Critical | Red | `badge-danger` |

### PTO Request Status

| Status | Color | Badge |
|--------|-------|-------|
| Pending | Orange | `badge-warning` |
| Approved | Green | `badge-success` |
| Denied | Red | `badge-danger` |
| Cancelled | Gray | `badge-secondary` |

## 🔐 Security Considerations

### Authentication

The portal assumes the employee is already authenticated. In production:
1. Add authentication middleware
2. Verify employee_id matches authenticated user
3. Implement role-based access control (RBAC)
4. Add CSRF protection for form submissions

### Data Privacy

- Employees can only view their own data
- API should enforce employee-level filtering
- Sensitive data (SSN, etc.) should not be exposed

## 🧪 Testing

### Manual Testing Checklist

**Labor Actions:**
- ✅ View available VET/VTO opportunities
- ✅ Accept an offer
- ✅ Decline an offer
- ✅ Verify response status updates

**PTO Requests:**
- ✅ View PTO balances
- ✅ Submit new PTO request
- ✅ Cancel pending request
- ✅ View request history

**UPT Balance:**
- ✅ View current balance
- ✅ See recent exceptions
- ✅ Verify status colors
- ✅ Check threshold warnings

**Schedule:**
- ✅ View week calendar
- ✅ Switch to month view
- ✅ Navigate to previous/next period
- ✅ Return to today

### Test Data Requirements

For proper testing, ensure your API returns:
1. At least 2-3 VET/VTO opportunities
2. PTO balances for multiple types
3. 5-10 recent UPT exceptions
4. 2 weeks of shift assignments

## 🎓 Best Practices

### Component Design
- Each card is self-contained and reusable
- Props-based configuration (compact mode)
- Consistent loading/error/empty states
- Clean separation of concerns

### State Management
- Local state for card-specific data
- Async data fetching with useEffect
- Error handling with try-catch
- Loading states during API calls

### Performance
- Debounce API calls where appropriate
- Limit displayed items in compact mode
- Use React.memo for expensive renders
- Lazy load calendar dates as needed

### Accessibility
- Semantic HTML elements
- ARIA labels for screen readers
- Keyboard navigation support
- Color contrast compliance

## 📚 Future Enhancements

### Short Term
- [ ] Add notification preferences
- [ ] Export schedule to calendar (iCal)
- [ ] Print-friendly PTO request form
- [ ] Mobile app deep linking

### Medium Term
- [ ] Real-time updates (WebSockets)
- [ ] Push notifications for VET/VTO
- [ ] PTO balance projections
- [ ] Schedule conflict detection

### Long Term
- [ ] AI-powered schedule optimization
- [ ] Predictive UPT warnings
- [ ] Shift swap marketplace
- [ ] Integration with payroll systems

## 🆘 Troubleshooting

### Common Issues

**Issue: Cards show "Loading..." indefinitely**
- Check browser console for API errors
- Verify API endpoint URLs are correct
- Ensure employee data is properly formatted

**Issue: PTO form submission fails**
- Verify all required fields are filled
- Check date range is valid (end >= start)
- Ensure sufficient PTO balance

**Issue: Schedule calendar is empty**
- Verify date range includes assigned shifts
- Check employee has shift assignments
- Confirm API returns proper date format (YYYY-MM-DD)

**Issue: UPT balance not updating**
- Refresh the page to reload data
- Check if exceptions are being properly recorded
- Verify deduction calculations are correct

## 📞 Support

For technical support or questions:
- Check API documentation: [API_GUIDE.md](../API_GUIDE.md)
- Review UPT tracking: [UPT_TRACKING_DOCUMENTATION.md](../UPT_TRACKING_DOCUMENTATION.md)
- Review PTO workflow: [PTO_APPROVAL_WORKFLOW_DOCUMENTATION.md](../PTO_APPROVAL_WORKFLOW_DOCUMENTATION.md)

## 📄 License

This component is part of the Staffing Flow application and follows the same license terms.

---

**Version:** 1.0.0  
**Last Updated:** January 31, 2026  
**Maintained By:** Staffing Flow Development Team
