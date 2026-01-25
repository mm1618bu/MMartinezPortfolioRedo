# Buffer and SLA Configuration System

## Overview

The Buffer and SLA Configuration System provides staffing flexibility and compliance tracking by allowing organizations to:

1. **Define staffing buffers** - Safety margins above calculated headcount requirements
2. **Configure SLA windows** - Service level agreements for staffing availability windows
3. **Track compliance** - Monitor how well staffing meets SLA targets
4. **Optimize planning** - Get recommendations for buffer adjustments

## Architecture

### Core Components

#### 1. **bufferSlaConfig.ts** - Configuration Types and Utilities
Defines the data structures and validation logic for buffer and SLA configurations.

**Key Types:**
- `BufferConfig` - Configuration for a single buffer setting
- `SlaWindow` - Service level agreement window definition
- `BufferSlaConfiguration` - Complete configuration for an organization
- `BufferedHeadcount` - Headcount with buffer applied

**Functions:**
- `calculateBufferedHeadcount()` - Applies buffer to a headcount value
- `validateSlaCompliance()` - Checks if headcount meets SLA requirements
- `checkAllSlaCompliance()` - Validates against all SLA windows
- `validateBufferConfig()` / `validateSlaWindow()` - Input validation

#### 2. **bufferSlaCalculations.ts** - Calculation Engine
Applies buffer and SLA logic to demands and headcount data.

**Key Types:**
- `BufferedHeadcountSummary` - Headcount summary with buffer info
- `DemandWithBuffer` - Demand with buffer and SLA status
- `BufferStatistics` - Statistical analysis of buffer effectiveness
- `BufferRecommendation` - Recommendations for buffer optimization

**Functions:**
- `applyBufferToDemands()` - Apply buffer to demand list
- `calculateBufferedHeadcountSummary()` - Get buffered summary
- `calculateBufferStatistics()` - Generate buffer statistics
- `getBufferRecommendations()` - Get optimization recommendations

#### 3. **bufferSlaConfigService.ts** - Persistence Layer
Handles saving and loading configurations from localStorage.

**Functions:**
- `loadConfiguration()` - Load config from storage
- `saveConfiguration()` - Save config to storage
- `getAllConfigurations()` - Get all stored configs
- `importConfiguration()` / `exportConfiguration()` - Import/export as JSON

#### 4. **BufferSlaConfig.tsx** - Configuration UI
Modal component for configuring buffers and SLA windows.

**Features:**
- Tab-based interface (Buffers | SLA Windows)
- Overall and priority-based buffer settings
- Create/edit/delete SLA windows
- Form validation with error messages
- Save/reset functionality

#### 5. **BufferSlaDisplay.tsx** - Display Component
Shows buffer statistics, SLA compliance, and recommendations.

**Displays:**
- Buffer statistics grid
- SLA compliance metrics with progress bar
- Recommendations with priority levels
- Detailed SLA status table

### Integration with Demand Service

The `demandService` now includes buffer and SLA methods:

```typescript
// Apply buffer to headcount
const buffered = demandService.applyBufferToValue(
  baseHeadcount,
  config,
  priority
);

// Apply buffer to demands array
const demandsWithBuffer = demandService.applyBufferToDemands(
  demands,
  config
);

// Calculate buffered summary
const bufferedSummary = demandService.calculateBufferedSummary(
  demands,
  config,
  baseSummary
);

// Get statistics and recommendations
const stats = demandService.getBufferStatistics(demandsWithBuffer);
const recs = demandService.getBufferRecommendations(stats);
```

## Usage Examples

### Basic Buffer Configuration

```typescript
import { createDefaultConfiguration } from '../utils/bufferSlaConfig';
import { loadConfiguration, saveConfiguration } from '../services/bufferSlaConfigService';

// Load existing or create default
let config = loadConfiguration('org-123');

// Update buffer
config.buffers.overall = {
  enabled: true,
  type: 'percentage',
  value: 15, // 15% buffer
};

// Save to localStorage
saveConfiguration(config);
```

### Apply Buffer to Headcount

```typescript
const baseHeadcount = 10;
const config = loadConfiguration('org-123');

// Apply overall buffer
const buffered = demandService.applyBufferToValue(
  baseHeadcount,
  config
);

console.log(buffered);
// {
//   baseHeadcount: 10,
//   bufferAmount: 1.5,
//   bufferPercentage: 15,
//   totalWithBuffer: 12,
//   rounding: 'up'
// }
```

### Apply Buffer to Demands with SLA Check

```typescript
const config = loadConfiguration('org-123');
const demands = await demandService.getDemands();

// Apply buffer and check SLA
const demandsWithBuffer = demandService.applyBufferToDemands(
  demands,
  config
);

// Check which demands meet SLA
const compliant = demandsWithBuffer.filter(d => d.meetsAllSla);
console.log(`${compliant.length}/${demandsWithBuffer.length} demands are SLA compliant`);
```

### Get Recommendations

```typescript
const demandsWithBuffer = demandService.applyBufferToDemands(demands, config);
const stats = demandService.getBufferStatistics(demandsWithBuffer);
const recommendations = demandService.getBufferRecommendations(
  stats,
  95 // target 95% SLA compliance
);

recommendations.forEach(rec => {
  if (rec.type === 'increase') {
    console.log(`Increase buffer from ${rec.currentBuffer}% to ${rec.suggestedBuffer}%`);
    console.log(`Reason: ${rec.reason}`);
  }
});
```

## Configuration Structure

### Buffer Types

**Percentage Buffer:**
```typescript
{
  enabled: true,
  type: 'percentage',
  value: 10, // 10% above requirement
  description: 'Standard buffer'
}
```

**Fixed Buffer:**
```typescript
{
  enabled: true,
  type: 'fixed',
  value: 2, // 2 additional employees
  description: '2 extra staff'
}
```

### Priority-Based Buffers

```typescript
config.buffers.byPriority = {
  low: { type: 'percentage', value: 5 },
  medium: { type: 'percentage', value: 10 },
  high: { type: 'percentage', value: 15 }
};
```

### SLA Windows

```typescript
const slaWindow: SlaWindow = {
  id: 'sla-peak-hours',
  name: 'Peak Hours (9 AM - 5 PM)',
  startTime: '09:00',
  endTime: '17:00',
  minimumStaffPercentage: 95, // 95% of required staff
  enabled: true
};
```

## Default Configurations

### Default Buffer
- Type: Percentage
- Value: 10%
- Applied to: All demands without priority-specific override

### Default SLA Windows
1. **Peak Hours (9 AM - 5 PM)** - 95% minimum
2. **Business Hours (8 AM - 6 PM)** - 85% minimum  
3. **Full Day Coverage** - 70% minimum

## Statistics and Analytics

### Buffer Statistics

```typescript
interface BufferStatistics {
  totalDemands: number;
  averageBufferPercentage: number;
  minBuffer: number;
  maxBuffer: number;
  totalBaseHeadcount: number;
  totalBufferAmount: number;
  totalBufferedHeadcount: number;
  slaMeetsCount: number;
  slaFailureCount: number;
  slaCompliancePercentage: number;
}
```

### Recommendations

The system provides three types of recommendations:

1. **Increase** - Current compliance is below target
2. **Decrease** - Compliance exceeds target with room for optimization
3. **Optimal** - Compliance is at target level

Each recommendation includes:
- Current buffer setting
- Suggested buffer setting
- Reason for recommendation
- Priority level (high, medium, low)

## UI Components

### Configuration Modal
Opens configuration interface with tabs for:
- Buffer Settings (Overall + Priority-based)
- SLA Windows (Create/Edit/Delete)

### Display Component
Shows:
- Buffer statistics grid
- SLA compliance metrics with progress bar
- Recommendations (if compliance below target)
- Detailed SLA status table (first 10 demands)

## Validation

### Buffer Configuration
- Value cannot be negative
- Percentage buffers cannot exceed 100%
- Fixed buffers must be valid numbers

### SLA Windows
- Window must have a name
- Start/end times must be HH:MM format (00:00-23:59)
- Minimum staff percentage must be 0-100%

## Storage

Configurations are persisted to localStorage with key format:
```
bufferSlaConfig_{organizationId}
```

### Export/Import
Configurations can be exported as JSON and imported from JSON strings:

```typescript
// Export
const json = bufferSlaConfigService.exportConfigurationAsJson(config);
localStorage.setItem('my-backup', json);

// Import
const imported = bufferSlaConfigService.importConfigurationFromJson(json);
```

## Performance Considerations

- **O(n) complexity** - Buffer calculations scale linearly with number of demands
- **No external dependencies** - Pure calculation functions
- **Lazy evaluation** - Recommendations only calculated when requested
- **Caching** - Consider caching statistics for frequently accessed data

## Best Practices

1. **Set reasonable buffers** - 5-20% is typical for staffing
2. **Use priority-based buffers** - High-priority demands need more buffer
3. **Monitor SLA compliance** - Track compliance metrics weekly
4. **Adjust based on analytics** - Use recommendations to optimize
5. **Document SLA windows** - Clearly communicate agreements to team
6. **Regular reviews** - Review buffer effectiveness quarterly

## Integration Example

### In DemandEditor Component

```typescript
const [config, setConfig] = useState<BufferSlaConfiguration>(
  loadConfiguration(organizationId)
);

// Apply buffer to demands
const demandsWithBuffer = demandService.applyBufferToDemands(
  demands,
  config
);

// Get statistics
const stats = demandService.getBufferStatistics(demandsWithBuffer);
const recs = demandService.getBufferRecommendations(stats);

// Render
return (
  <>
    <button onClick={() => setConfigOpen(true)}>
      Configure Buffer & SLA
    </button>
    
    <BufferSlaConfigComponent
      isOpen={configOpen}
      currentConfig={config}
      onSave={(newConfig) => {
        setConfig(newConfig);
        saveConfiguration(newConfig);
      }}
    />

    <BufferSlaDisplay
      demandsWithBuffer={demandsWithBuffer}
      bufferStatistics={stats}
      recommendations={recs}
    />
  </>
);
```

## Testing

Key scenarios to test:

1. ✓ Load/save configuration
2. ✓ Apply percentage buffers
3. ✓ Apply fixed buffers
4. ✓ Priority-based buffers override overall
5. ✓ SLA window validation
6. ✓ Compliance calculations
7. ✓ Recommendation generation
8. ✓ Import/export JSON

## Future Enhancements

1. API persistence instead of localStorage
2. Department-specific buffers
3. Time-series SLA tracking
4. Predictive buffer recommendations based on historical data
5. Buffer by skill type or department
6. Custom SLA metrics beyond percentage
7. Alerts for SLA breaches
8. Buffer effectiveness dashboard

## Related Files

- [HEADCOUNT_CALCULATIONS.md](HEADCOUNT_CALCULATIONS.md) - Core headcount calculation system
- [src/utils/bufferSlaConfig.ts](../src/utils/bufferSlaConfig.ts) - Configuration types
- [src/utils/bufferSlaCalculations.ts](../src/utils/bufferSlaCalculations.ts) - Calculation engine
- [src/services/bufferSlaConfigService.ts](../src/services/bufferSlaConfigService.ts) - Storage layer
- [src/components/demands/BufferSlaConfig.tsx](../src/components/demands/BufferSlaConfig.tsx) - Config UI
- [src/components/demands/BufferSlaDisplay.tsx](../src/components/demands/BufferSlaDisplay.tsx) - Display UI
