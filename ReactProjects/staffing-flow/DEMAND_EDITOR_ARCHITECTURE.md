# Demand Editor UI - Architecture & Integration Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Application                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              DemandEditor.tsx (Main)                     │   │
│  │              - State Management                          │   │
│  │              - Data Fetching                             │   │
│  │              - Modal Control                             │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  Summary Cards                                     │ │   │
│  │  │  (Statistics)                                      │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  DemandFilters.tsx                                 │ │   │
│  │  │  ├─ Text Search                                    │ │   │
│  │  │  ├─ Date Range                                     │ │   │
│  │  │  ├─ Multi-Select Checkboxes                        │ │   │
│  │  │  ├─ Advanced Filters Toggle                        │ │   │
│  │  │  └─ Export Buttons (CSV/JSON/XLSX)                 │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  DemandGrid.tsx                                    │ │   │
│  │  │  ├─ Sortable Table                                 │ │   │
│  │  │  ├─ Select All / Select Row                        │ │   │
│  │  │  ├─ Edit/Delete Buttons                            │ │   │
│  │  │  ├─ Priority Badges                                │ │   │
│  │  │  ├─ Skill Tags                                     │ │   │
│  │  │  └─ Pagination Controls                            │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │  DemandForm.tsx (Modal)                            │ │   │
│  │  │  ├─ Date Picker                                    │ │   │
│  │  │  ├─ Shift Type Select                              │ │   │
│  │  │  ├─ Conditional Time Inputs                        │ │   │
│  │  │  ├─ Employee Count Input                           │ │   │
│  │  │  ├─ Department Select                              │ │   │
│  │  │  ├─ Priority Select                                │ │   │
│  │  │  ├─ Skill Manager                                  │ │   │
│  │  │  └─ Notes Textarea                                 │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         DemandService (demandService.ts)                        │
│         - API Methods                                           │
│         - Request/Response Handling                             │
│         - Authentication Headers                                │
│         - Error Management                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Backend API (Express.js)                           │
│  Running on: http://localhost:3001/api/demands                 │
├─────────────────────────────────────────────────────────────────┤
│  GET    /grid              - Fetch grid data                    │
│  GET    /grid/:id          - Get single demand                  │
│  POST   /grid              - Create demand                      │
│  PUT    /grid/:id          - Update demand                      │
│  DELETE /grid/:id          - Delete demand                      │
│  POST   /grid/bulk-delete  - Bulk delete                        │
│  POST   /grid/bulk-update  - Bulk update                        │
│  POST   /grid/export       - Export data                        │
│  GET    /grid/summary      - Get statistics                     │
│  GET    /grid/filters      - Get filter options                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            Supabase PostgreSQL Database                         │
│  Table: demands                                                 │
│  - 13 columns                                                   │
│  - 8 indexes                                                    │
│  - RLS policies                                                 │
│  - Validation triggers                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
DemandEditor (Container)
├── Summary Cards
│   ├── Card (Total Records)
│   ├── Card (Total Employees)
│   ├── Card (Avg per Day)
│   └── Card (High Priority Count)
├── Alert Messages
│   ├── Success Alert
│   └── Error Alert
├── DemandFilters (Filter Component)
│   ├── Search Input
│   ├── Basic Filters
│   │   ├── Date Range
│   │   ├── Shift Type Checkboxes
│   │   └── Priority Checkboxes
│   ├── Advanced Filters (Collapsible)
│   │   ├── Department Checkboxes
│   │   └── Employee Range
│   └── Actions
│       ├── Clear Filters Button
│       └── Export Buttons
├── DemandGrid (Table Component)
│   ├── Table Header
│   │   ├── Checkbox (Select All)
│   │   ├── Sortable Columns (8)
│   │   └── Actions Column
│   ├── Table Body (Rows)
│   │   └── Demand Row × N
│   │       ├── Checkbox
│   │       ├── Date
│   │       ├── Shift Type
│   │       ├── Employees Badge
│   │       ├── Skills Tags
│   │       ├── Priority Badge
│   │       ├── Notes
│   │       ├── Created Date
│   │       └── Actions (Edit/Delete)
│   └── Pagination Controls
│       ├── First/Previous/Next/Last
│       ├── Page Indicator
│       └── Page Size Selector
└── DemandForm (Modal - When Open)
    ├── Modal Header (Title + Close)
    └── Modal Body
        ├── Date Input
        ├── Shift Type Select
        ├── Time Inputs (Conditional)
        ├── Employee Count Input
        ├── Department Select
        ├── Priority Select
        ├── Skills Manager
        ├── Notes Textarea
        └── Form Buttons (Submit/Cancel)
```

---

## Data Flow Diagram

### 1. Initial Load Flow
```
App Mounts
    ↓
DemandEditor useEffect
    ↓
fetchGridData() + fetchSummary()
    ↓
demandService.getGridData(filters)
    ↓
API GET /grid?filters...
    ↓
Response: {data, pagination, filters, sort}
    ↓
setGridState(response)
    ↓
DemandGrid Renders with Data
```

### 2. Filter Flow
```
User Changes Filter
    ↓
onFiltersChange(newFilters)
    ↓
setFilters(newFilters)
    ↓
useEffect Triggered (filters dependency)
    ↓
fetchGridData()
    ↓
API Call with New Filters
    ↓
Results Update
```

### 3. Sort Flow
```
User Clicks Column Header
    ↓
handleSort(fieldName)
    ↓
Update gridState.sort
    ↓
useEffect Triggered
    ↓
fetchGridData()
    ↓
API Returns Sorted Data
    ↓
Grid Re-renders
```

### 4. Create Demand Flow
```
User Clicks "+ New Demand"
    ↓
handleCreateDemand()
    ↓
setShowForm(true)
    ↓
DemandForm Mounts
    ↓
User Fills Form
    ↓
User Submits
    ↓
demandService.createDemand(input)
    ↓
API POST /grid
    ↓
Success Message
    ↓
fetchGridData() (Refresh)
    ↓
setShowForm(false)
```

### 5. Edit Demand Flow
```
User Clicks Edit Button
    ↓
handleEditDemand(demand)
    ↓
setEditingDemand(demand)
    ↓
setShowForm(true)
    ↓
DemandForm Mounts (with demand data)
    ↓
Form Pre-fills
    ↓
User Edits Fields
    ↓
User Submits
    ↓
demandService.updateDemand(id, input)
    ↓
API PUT /grid/:id
    ↓
Success Message
    ↓
fetchGridData() (Refresh)
    ↓
setShowForm(false)
```

### 6. Delete Demand Flow
```
User Clicks Delete Button
    ↓
Confirmation Dialog
    ↓
User Confirms
    ↓
demandService.deleteDemand(id)
    ↓
API DELETE /grid/:id
    ↓
Success Message
    ↓
fetchGridData() (Refresh)
```

### 7. Bulk Delete Flow
```
User Selects Rows
    ↓
handleSelectDemand() Updates selectedIds
    ↓
Rows Highlight
    ↓
"Delete N Selected" Button Appears
    ↓
User Clicks Button
    ↓
Confirmation Dialog
    ↓
demandService.bulkDeleteDemands(ids)
    ↓
API POST /grid/bulk-delete
    ↓
Success Message
    ↓
fetchGridData() (Refresh)
    ↓
selectedIds.clear()
```

### 8. Export Flow
```
User Clicks Export Button (CSV/JSON/XLSX)
    ↓
onExport(format)
    ↓
demandService.exportDemands(filters, format)
    ↓
API POST /grid/export?format=csv
    ↓
Response: Blob
    ↓
Create Download Link
    ↓
Trigger Download
    ↓
Browser Downloads File
```

---

## State Management

### DemandEditor State
```typescript
gridState = {
  data: Demand[]                    // Current page demands
  pagination: {...}                 // Page info & navigation
  filters: {...}                    // Applied & available filters
  sort: {field, order}              // Current sort
  loading: boolean                  // Loading state
  error: string | null              // Error message
}

filters = {
  departmentIds: string[]           // Selected departments
  shiftTypes: string[]              // Selected shifts
  priorities: string[]              // Selected priorities
  startDate: string                 // Date from
  endDate: string                   // Date to
  minEmployees?: number             // Min count
  maxEmployees?: number             // Max count
  search: string                    // Text search
}

currentPage: number                 // Current page (1-indexed)
pageSize: number                    // Items per page
summary: DemandSummary | null       // Statistics
selectedIds: Set<string>            // Selected demand IDs
showForm: boolean                   // Form modal visibility
editingDemand: Demand | null        // For edit mode
successMessage: string              // Success notification
```

---

## Props Passing

```
DemandEditor
├── passes gridState → DemandGrid
├── passes filters → DemandFilters
├── passes gridState.filters.available → DemandFilters
├── passes editingDemand → DemandForm
├── passes gridState.filters.available.departments → DemandForm
└── Callbacks
    ├── onFiltersChange → DemandFilters
    ├── onExport → DemandFilters
    ├── onSort → DemandGrid
    ├── onSelectAll → DemandGrid
    ├── onSelectDemand → DemandGrid
    ├── onEdit → DemandGrid
    ├── onDelete → DemandGrid
    ├── onPageChange → DemandGrid
    └── onPageSizeChange → DemandGrid
```

---

## API Request Examples

### Get Grid Data
```bash
GET /api/demands/grid?page=1&pageSize=20&sortBy=date&sortOrder=DESC&startDate=2026-01-01&endDate=2026-12-31&priorities=high,medium
Authorization: Bearer TOKEN

Response:
{
  "data": [...],
  "pagination": {...},
  "filters": {...},
  "sort": {...}
}
```

### Create Demand
```bash
POST /api/demands/grid
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "date": "2026-02-15",
  "shift_type": "morning",
  "start_time": "08:00",
  "end_time": "16:00",
  "required_employees": 5,
  "required_skills": ["Sales", "Customer Service"],
  "priority": "high",
  "notes": "Holiday rush coverage",
  "organization_id": "ORG-123",
  "department_id": "DEPT-456"
}

Response:
{
  "id": "DEM-789",
  "date": "2026-02-15",
  ...
}
```

### Update Demand
```bash
PUT /api/demands/grid/DEM-789
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "priority": "low",
  "notes": "Coverage no longer needed"
}

Response:
{
  "id": "DEM-789",
  "date": "2026-02-15",
  ...
}
```

---

## CSS Structure

### BEM Naming Convention
```
.demand-editor                    # Main block
├── .editor-header                # Element
├── .summary-cards
│   └── .summary-card             # Block modifier
│       ├── .summary-label
│       └── .summary-value
├── .demand-filters               # Block
│   ├── .filter-header            # Element
│   ├── .filter-section           # Element
│   ├── .filter-group             # Element
│   ├── .checkbox-group           # Block
│   │   └── .checkbox-label
│   └── .filter-actions           # Element
├── .demand-grid                  # Block
│   ├── .table-container          # Element
│   └── .pagination-controls      # Element
└── .modal-overlay                # Block
    └── .modal-content            # Element
```

---

## Error Handling Flow

```
User Action
    ↓
Try/Catch Block
    ↓
Error Occurs?
    ├─ YES → error instanceof Error?
    │        ├─ YES → error.message
    │        └─ NO → Generic message
    │        ↓
    │        setGridState(prev => ({...prev, error: msg}))
    │        ↓
    │        Display Alert
    │        ↓
    │        Auto-dismiss after 3s (optional)
    │
    └─ NO → Success
            ↓
            setSuccessMessage(msg)
            ↓
            Display Alert
            ↓
            Auto-dismiss after 3s
            ↓
            Refresh Data
```

---

## Performance Considerations

### Re-render Optimization
- useCallback for handleSort, fetchGridData, etc.
- useEffect dependencies carefully controlled
- Form isolated in separate component (doesn't affect grid)
- Filters separated from grid (independent updates)

### API Call Optimization
- Pagination limits data size
- Filters sent as query params
- No redundant requests (proper dependencies)
- Caching ready (could add localStorage caching)

### Bundle Size
- No external CSS framework
- Pure React (functional components)
- Type definitions don't add to bundle size
- CSS is scoped within component

---

## Integration Checklist

- [ ] Copy `/src/components/demands/` folder
- [ ] Copy `/src/services/demandService.ts`
- [ ] Import DemandEditor in your App
- [ ] Ensure backend API is running on port 3001
- [ ] Set authentication token in localStorage
- [ ] Set organization_id in localStorage
- [ ] Test create/read/update/delete operations
- [ ] Test filtering and sorting
- [ ] Test export functionality
- [ ] Test responsive design on mobile
- [ ] Customize colors if needed
- [ ] Deploy!

---

**Architecture Version:** 1.0
**Last Updated:** January 24, 2026
**Status:** Production Ready
