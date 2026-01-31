# Real-Time Validation Warnings Implementation

## Overview
This implementation adds comprehensive real-time validation warnings to the staffing-flow schedule grid, providing instant feedback on scheduling issues, constraint violations, and potential problems.

## Features Implemented

### 1. Real-Time Validation Service
- **File**: `RealtimeValidationService.ts`
- **Functionality**: 
  - Performs comprehensive schedule validation
  - Checks for constraint violations (hard and soft)
  - Monitors workload balance issues
  - Detects coverage problems
  - Identifies skill match issues
  - Tracks availability conflicts
  - Analyzes scheduling patterns for burnout risk

### 2. Validation Hook
- **File**: `useRealtimeValidation.ts`
- **Features**:
  - Auto-validation with configurable debounce (default: 300ms)
  - Warning management (dismiss, filter by severity/type)
  - Per-assignment and per-employee warning lookup
  - Real-time updates when schedule changes

### 3. Validation Warnings Panel
- **File**: `ValidationWarningsPanel.tsx`
- **Features**:
  - Grouped warnings by severity (Critical, Warning, Info)
  - Expandable warning details
  - Live indicator for critical issues
  - New warning animations
  - Navigate to affected assignments
  - Dismiss individual warnings
  - Compact mode support
  - Real-time updates with smooth transitions

### 4. Toast Notifications
- **File**: `ValidationToast.tsx`
- **Features**:
  - Pop-up notifications for critical and warning-level issues
  - Auto-hide for non-critical warnings (5 seconds)
  - Manual dismiss for critical warnings
  - Animated entry/exit
  - Multiple toast support (max 3)
  - Positioned at top-right corner
  - Accessibility-friendly

### 5. Visual Indicators
- **In ScheduleGrid Component**:
  - Colored borders on assignments with validation issues
  - Severity badges (critical ⚠️, warning ⚡, info ℹ️)
  - Pulsing animations for critical issues
  - Warning count badge on validation toggle button
  - Disabled publish button when critical violations exist

## Integration Points

### ScheduleGrid Component
The main schedule grid now includes:

1. **Validation Hook Integration**:
   ```typescript
   const {
     warnings,
     totalWarnings,
     criticalCount,
     warningCount,
     dismissWarning,
     getAssignmentSeverity,
   } = useRealtimeValidation(schedule, assignments, {
     autoValidate: true,
     validationDebounceMs: 300,
   });
   ```

2. **Toast Container**:
   - Displays at top-right
   - Shows up to 3 most important warnings
   - Auto-manages display lifecycle

3. **Validation Panel**:
   - Toggleable via header button
   - Shows all warnings grouped by severity
   - Highlights new warnings with animation

4. **Assignment Indicators**:
   - Each assignment shows validation status
   - Hover tooltips explain issues
   - Color-coded severity levels

## Validation Types

### Constraint Violations
- **Hard Violations**: Must be resolved before publishing
- **Soft Violations**: Suggestions for improvement

### Workload Balance
- Detects employee overload (>50 hours)
- Tracks workload imbalances
- Suggests rebalancing

### Coverage Issues
- No coverage dates
- Low coverage warnings (<3 shifts per day)
- Under-staffed periods

### Skill Matching
- Identifies skill mismatches
- Warns about qualification gaps

### Availability
- Unconfirmed availability
- Potential conflicts

### Scheduling Patterns
- Burnout risk (8+ consecutive days)
- Long work stretches
- Insufficient rest periods

## Styling & Animations

### CSS Animations
1. **Pulse Effects**: Critical warnings pulse to draw attention
2. **Slide-In**: New warnings slide in from the side
3. **Highlight Flash**: New warnings briefly highlight
4. **Progress Bar**: Toast auto-hide progress indicator
5. **Expand/Collapse**: Smooth transitions for details

### Color Coding
- **Critical**: Red (#f44336)
- **Warning**: Orange (#ffa500)
- **Info**: Blue (#2196f3)

### Responsive Design
- Mobile-friendly layouts
- Touch-optimized controls
- Adaptive panel sizing

## Usage Examples

### Basic Integration
```typescript
import { ScheduleGrid } from './components/ScheduleGrid';

<ScheduleGrid
  schedule={schedule}
  assignments={assignments}
  onAssignmentMove={handleMove}
  onSchedulePublish={handlePublish}
/>
```

### Custom Validation Configuration
```typescript
const validation = useRealtimeValidation(schedule, assignments, {
  autoValidate: true,
  validationDebounceMs: 500, // Custom debounce
});
```

### Manual Validation Trigger
```typescript
const { validateSchedule } = useRealtimeValidation(schedule, assignments, {
  autoValidate: false, // Disable auto-validation
});

// Trigger manually
await validateSchedule();
```

## Performance Considerations

1. **Debounced Validation**: 300ms debounce prevents excessive re-validation
2. **Memoized Computations**: Warning groups and filters are memoized
3. **Efficient DOM Updates**: Only re-renders changed warnings
4. **Virtual Scrolling**: Large warning lists remain performant

## Accessibility

- **Keyboard Navigation**: All controls keyboard-accessible
- **ARIA Labels**: Proper labeling for screen readers
- **Focus Management**: Logical focus flow
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Color Contrast**: WCAG AA compliant

## Configuration Options

### Hook Options
```typescript
interface UseRealtimeValidationOptions {
  autoValidate?: boolean;        // Default: true
  validationDebounceMs?: number; // Default: 500
}
```

### Toast Options
```typescript
interface ValidationToastContainerProps {
  maxToasts?: number;     // Default: 3
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}
```

### Panel Options
```typescript
interface ValidationWarningsPanelProps {
  compactMode?: boolean; // Default: false
}
```

## Future Enhancements

1. **Custom Validation Rules**: Allow users to define custom validation logic
2. **Warning History**: Track dismissed warnings
3. **Batch Actions**: Resolve multiple warnings at once
4. **Export Reports**: Generate validation reports
5. **Sound Notifications**: Optional audio alerts for critical issues
6. **Email Notifications**: Send alerts for critical violations
7. **ML-Powered Suggestions**: AI-based resolution recommendations

## Testing Recommendations

1. **Unit Tests**: Test validation logic in `RealtimeValidationService`
2. **Integration Tests**: Test hook behavior with various schedules
3. **Component Tests**: Verify UI rendering and interactions
4. **E2E Tests**: Test full validation workflow
5. **Performance Tests**: Measure validation speed with large datasets

## Troubleshooting

### Warnings Not Appearing
- Check that `autoValidate` is enabled
- Verify schedule and assignments data is valid
- Check browser console for errors

### Performance Issues
- Increase `validationDebounceMs` value
- Reduce `maxToasts` count
- Enable compact mode on warnings panel

### Styling Issues
- Ensure SCSS files are imported
- Check for CSS conflicts
- Verify theme variables are defined

## Related Files

- `RealtimeValidationService.ts` - Core validation logic
- `useRealtimeValidation.ts` - React hook
- `ValidationWarningsPanel.tsx` - Main UI panel
- `ValidationToast.tsx` - Toast notifications
- `ScheduleGrid.tsx` - Integration point
- `ScheduleGrid.scss` - Grid styling
- `ValidationWarningsPanel.scss` - Panel styling
- `ValidationToast.scss` - Toast styling

## Version
- **Version**: 1.0.0
- **Last Updated**: January 31, 2026
- **Author**: GitHub Copilot

## License
Part of the staffing-flow project.
