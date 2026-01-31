# Real-Time Validation Quick Start Guide

## Getting Started

The real-time validation system is automatically enabled when you use the `ScheduleGrid` component. Here's what you need to know to get started.

## Basic Usage

### 1. Import and Use ScheduleGrid
```typescript
import { ScheduleGrid } from './components/ScheduleGrid';

function MySchedulePage() {
  return (
    <ScheduleGrid
      schedule={schedule}
      assignments={assignments}
      onAssignmentMove={handleMove}
      onSchedulePublish={handlePublish}
    />
  );
}
```

That's it! Validation warnings will appear automatically.

## User Interface Elements

### 1. Validation Toggle Button
- Located in the schedule header (top-right area)
- Shows warning count badge when issues exist
- Changes color based on severity:
  - **Red**: Critical violations present
  - **Orange**: Warnings present
  - **Gray**: No issues or only info-level warnings
- Click to show/hide validation panel

### 2. Validation Warnings Panel
- Appears below header when enabled
- Groups warnings by severity:
  - **Critical** 🛑: Must be fixed before publishing
  - **Warning** ⚠️: Should be addressed
  - **Info** ℹ️: Suggestions for improvement
- Features:
  - Click warning to expand details
  - View affected assignments and employees
  - See suggested actions
  - Dismiss individual warnings
  - Navigate to affected assignments

### 3. Toast Notifications
- Pop up in top-right corner for important warnings
- Auto-hide after 5 seconds (except critical)
- Show most recent/important issues
- Click × to dismiss

### 4. Visual Indicators on Assignments
- Colored borders around assignments with issues:
  - **Red border**: Critical violation
  - **Orange border**: Warning
  - **Blue border**: Information
- Small severity badge in corner
- Hover for issue summary

### 5. Publish Button
- Automatically disabled when critical violations exist
- Tooltip explains why publishing is blocked
- Returns to normal once critical issues are resolved

## Common Validation Warnings

### Critical Issues (Block Publishing)

**Hard Constraint Violations**
- **What**: Assignments that violate mandatory scheduling rules
- **Fix**: Remove or modify the violating assignments
- **Example**: Scheduling someone during their unavailable time

**No Coverage on Dates**
- **What**: Days with zero assigned shifts
- **Fix**: Add shifts to uncovered dates
- **Impact**: Service gaps, customer issues

### Warnings (Should Fix)

**Soft Constraint Violations**
- **What**: Assignments that break preference rules
- **Fix**: Adjust assignments to improve schedule quality
- **Example**: Scheduling someone outside preferred hours

**Workload Imbalance**
- **What**: Some employees significantly overworked vs others
- **Fix**: Redistribute shifts more evenly
- **Impact**: Employee satisfaction, burnout risk

**Low Coverage**
- **What**: Days with fewer than 3 shifts
- **Fix**: Add more shifts to improve coverage
- **Impact**: Service quality may suffer

**Burnout Risk**
- **What**: Employees scheduled 8+ consecutive days
- **Fix**: Add rest days between work stretches
- **Impact**: Employee health and performance

### Information (Nice to Know)

**Unconfirmed Availability**
- **What**: Assignments pending availability confirmation
- **Action**: Request confirmation from employees
- **Impact**: Scheduling uncertainty

## Workflow Tips

### Publishing a Schedule
1. Create schedule and assign shifts
2. Check validation toggle button for warnings
3. If red badge appears: **DO NOT PUBLISH**
4. Click validation toggle to see issues
5. Fix all critical (🛑) warnings
6. Consider fixing warnings (⚠️)
7. Publish button will enable when safe

### Handling Warnings Efficiently
1. **Prioritize by Severity**: Fix critical first, then warnings
2. **Use Suggested Actions**: Each warning has a recommended fix
3. **Navigate to Assignments**: Click assignment IDs to jump to them
4. **Dismiss Non-Issues**: If a warning doesn't apply, dismiss it
5. **Group Similar Issues**: Address patterns, not individual cases

### Best Practices
- **Check Early**: Review warnings as you build the schedule
- **Auto-Validation**: System validates in real-time (300ms delay)
- **Don't Ignore Orange**: Warnings often become critical later
- **Use Info Warnings**: They help improve schedule quality
- **Regular Reviews**: Check warnings before major changes

## Keyboard Shortcuts

- **Tab**: Navigate between warnings
- **Enter**: Expand/collapse warning details
- **Space**: Same as Enter
- **Escape**: Close validation panel
- **Delete**: Dismiss focused warning

## Mobile Experience

On mobile devices:
- Validation panel adapts to screen size
- Toast notifications are full-width
- Swipe to dismiss warnings
- Tap to expand details
- Compact mode automatically enabled

## Troubleshooting

### "No warnings showing but I know there are issues"
- Check if validation panel is hidden (click toggle button)
- Verify auto-validation is enabled
- Refresh the page

### "Too many warnings, can't focus"
- Use compact mode for less detail
- Dismiss info-level warnings
- Filter by severity
- Fix critical issues first

### "Warnings won't dismiss"
- Check if the issue still exists
- Try refreshing the page
- Clear browser cache

### "Performance is slow"
- Reduce number of assignments
- Increase validation debounce time
- Use compact mode
- Close validation panel when not needed

## Advanced Configuration

### Custom Debounce Time
If validation is too frequent/slow:
```typescript
const validation = useRealtimeValidation(schedule, assignments, {
  validationDebounceMs: 1000, // 1 second instead of 300ms
});
```

### Manual Validation
Disable auto-validation:
```typescript
const { validateSchedule } = useRealtimeValidation(schedule, assignments, {
  autoValidate: false,
});

// Trigger manually when needed
validateSchedule();
```

### Custom Toast Position
```typescript
<ValidationToastContainer
  warnings={warnings}
  position="bottom-right" // or top-left, bottom-left
  maxToasts={5} // show up to 5 toasts
/>
```

## Integration with Other Features

### Export Functions
- Validation status included in exports
- CSV export shows warning counts
- PDF export highlights issues
- JSON export includes full warning data

### Filtering
- Filter schedules by validation status
- Show only schedules with critical issues
- Hide info-level warnings

### Notifications
- Email alerts for critical violations (coming soon)
- Slack integration for team warnings (coming soon)
- SMS for urgent issues (coming soon)

## Need Help?

- Check the full documentation: `REALTIME_VALIDATION_IMPLEMENTATION.md`
- Review validation rules: `RealtimeValidationService.ts`
- Report issues: GitHub Issues
- Ask questions: Team Slack channel

## Updates

This feature is actively maintained. Check release notes for:
- New validation rules
- Performance improvements
- UI enhancements
- Bug fixes

---

**Version**: 1.0.0  
**Last Updated**: January 31, 2026  
**Feedback**: Always welcome!
