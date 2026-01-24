# Site Management UI - Component Architecture

## Component Hierarchy

```
App
├── Navigation Bar
│   ├── Brand (Staffing Flow)
│   └── Nav Links
│       ├── Home
│       └── Sites
│
└── Main Content
    ├── Home Page
    │   ├── Welcome Section
    │   ├── Quick Actions
    │   └── Feature Cards (4)
    │
    └── SiteManagement (Container)
        ├── Page Header
        │   ├── Title
        │   └── Create Button
        │
        ├── Alerts
        │   ├── Success Alert (conditional)
        │   └── Error Alert (conditional)
        │
        ├── Filters Section
        │   ├── Search Box
        │   └── Status Filter Dropdown
        │
        ├── Content (conditional)
        │   │
        │   ├── SiteForm (when showForm = true)
        │   │   ├── Form Header
        │   │   ├── Basic Information Section
        │   │   │   ├── Site Name Input*
        │   │   │   ├── Site Code Input*
        │   │   │   ├── Timezone Select
        │   │   │   └── Active Checkbox (edit mode)
        │   │   ├── Address Section
        │   │   │   ├── Address Line 1 Input
        │   │   │   ├── Address Line 2 Input
        │   │   │   ├── City Input
        │   │   │   ├── State Input
        │   │   │   ├── ZIP Code Input
        │   │   │   └── Country Input
        │   │   └── Form Actions
        │   │       ├── Cancel Button
        │   │       └── Submit Button
        │   │
        │   └── SiteList + Pagination (when showForm = false)
        │       ├── Loading State
        │       ├── Table
        │       │   ├── Header Row
        │       │   │   ├── Name
        │       │   │   ├── Code
        │       │   │   ├── Address
        │       │   │   ├── Timezone
        │       │   │   ├── Status
        │       │   │   └── Actions
        │       │   └── Data Rows (for each site)
        │       │       ├── Site Name
        │       │       ├── Site Code (monospace)
        │       │       ├── Formatted Address
        │       │       ├── Timezone
        │       │       ├── Status Badge
        │       │       └── Action Buttons
        │       │           ├── Stats Button (📊)
        │       │           ├── Edit Button (✏️)
        │       │           └── Delete Button (🗑️)
        │       │
        │       └── Pagination Controls
        │           ├── Previous Button
        │           ├── Page Info
        │           └── Next Button
        │
        └── SiteStatisticsModal (conditional)
            ├── Modal Overlay
            └── Modal Content
                ├── Modal Header
                │   ├── Title
                │   └── Close Button (×)
                └── Modal Body
                    ├── Loading State
                    ├── Error State
                    └── Stats Grid
                        ├── Site Name Card
                        ├── Site Code Card
                        ├── Departments Card
                        └── Employees Card

* = Required field
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      SiteManagement                          │
│  (Container - Manages all state and orchestrates)           │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Props
                        ▼
        ┌───────────────┬───────────────┬────────────────┐
        │               │               │                │
        ▼               ▼               ▼                ▼
   ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐
   │SiteList │    │SiteForm │    │Filters   │    │  Modal   │
   │         │    │         │    │          │    │          │
   └─────────┘    └─────────┘    └──────────┘    └──────────┘
        │               │               │                │
        │               │               │                │
        │ Callbacks     │ Callbacks     │ Events         │ Events
        │               │               │                │
        ▼               ▼               ▼                ▼
   ┌─────────────────────────────────────────────────────────┐
   │              SiteManagement (Handlers)                   │
   │  • handleEdit()        • handleDelete()                  │
   │  • handleViewStats()   • handleSubmit()                  │
   │  • handleSearch()      • handleFilterChange()            │
   └─────────────────────────────────────────────────────────┘
                        │
                        │ API Calls
                        ▼
   ┌─────────────────────────────────────────────────────────┐
   │                   siteService                            │
   │  • getAll()           • getById()                        │
   │  • create()           • update()                         │
   │  • delete()           • getStatistics()                  │
   └─────────────────────────────────────────────────────────┘
                        │
                        │ HTTP Requests
                        ▼
   ┌─────────────────────────────────────────────────────────┐
   │              API Backend (Express)                       │
   │  GET    /api/sites                                       │
   │  GET    /api/sites/:id                                   │
   │  GET    /api/sites/:id/statistics                        │
   │  POST   /api/sites                                       │
   │  PUT    /api/sites/:id                                   │
   │  DELETE /api/sites/:id                                   │
   └─────────────────────────────────────────────────────────┘
                        │
                        │ Database Queries
                        ▼
   ┌─────────────────────────────────────────────────────────┐
   │                Supabase (PostgreSQL)                     │
   │  sites table                                             │
   └─────────────────────────────────────────────────────────┘
```

## State Management

### SiteManagement Component State

```typescript
{
  // Data
  sites: Site[],                    // Array of site objects
  editingSite: Site | null,         // Site being edited, or null
  viewingStats: string | null,      // Site ID for stats modal
  
  // UI State
  loading: boolean,                 // Initial data loading
  isSubmitting: boolean,            // Form submission in progress
  showForm: boolean,                // Show form vs. list view
  
  // Messages
  error: string | null,             // Error message to display
  successMessage: string | null,    // Success message (auto-dismiss)
  
  // Filters
  searchTerm: string,               // Search input value
  filterActive: boolean | undefined, // Active filter (true/false/undefined)
  currentPage: number,              // Current pagination page
  totalPages: number,               // Total pages available
}
```

### Event Flow Examples

#### Creating a Site
```
User clicks "Create New Site"
  ↓
handleCreate() called
  ↓
Set showForm = true, editingSite = null
  ↓
SiteForm renders in create mode
  ↓
User fills form and clicks "Create Site"
  ↓
Form validation runs
  ↓
onSubmit prop called with form data
  ↓
handleSubmit() called
  ↓
Set isSubmitting = true
  ↓
siteService.create() API call
  ↓
API returns new site data
  ↓
Set successMessage, showForm = false
  ↓
fetchSites() called to refresh list
  ↓
List updates with new site
```

#### Editing a Site
```
User clicks Edit (✏️) button
  ↓
handleEdit(site) called
  ↓
Set showForm = true, editingSite = site
  ↓
SiteForm renders in edit mode with pre-filled data
  ↓
User modifies fields and clicks "Update Site"
  ↓
Form validation runs
  ↓
onSubmit prop called with changed fields only
  ↓
handleSubmit() called
  ↓
Set isSubmitting = true
  ↓
siteService.update(id, data) API call
  ↓
API returns updated site data
  ↓
Set successMessage, showForm = false
  ↓
fetchSites() called to refresh list
  ↓
List updates with modified site
```

#### Deleting a Site
```
User clicks Delete (🗑️) button (first click)
  ↓
handleDelete(id) called
  ↓
Check if deleteConfirm === id
  ↓
If NO: Set deleteConfirm = id, start 3s timer
  ↓
Button turns red with ⚠️ (danger-confirm)
  ↓
User clicks Delete button again (second click)
  ↓
handleDelete(id) called
  ↓
Check if deleteConfirm === id
  ↓
If YES: Proceed with deletion
  ↓
Set deleteConfirm = null
  ↓
siteService.delete(id) API call
  ↓
API soft-deletes site (is_active = false)
  ↓
Set successMessage
  ↓
fetchSites() called to refresh list
  ↓
List updates, site marked inactive or removed
```

#### Searching
```
User types in search box
  ↓
handleSearch(e) called on onChange
  ↓
Set searchTerm = e.target.value
  ↓
Set currentPage = 1 (reset to first page)
  ↓
useEffect triggers (dependency: searchTerm)
  ↓
fetchSites() called with search param
  ↓
API filters sites by name or code
  ↓
List updates with filtered results
```

## Styling Architecture

### CSS Organization

```
SiteManagement.css
├── Layout
│   ├── .site-management (main container)
│   ├── .page-header (flex, space-between)
│   ├── .filters (flex, gap)
│   └── .pagination (flex, center)
│
├── Components
│   ├── Alerts
│   │   ├── .alert (base)
│   │   ├── .alert-success (green)
│   │   └── .alert-error (red)
│   │
│   ├── Table
│   │   ├── .site-list table (full-width)
│   │   ├── thead (gray background)
│   │   ├── tbody tr (hover effect)
│   │   └── .status-badge (active/inactive)
│   │
│   ├── Form
│   │   ├── .site-form-container (white card)
│   │   ├── .form-section (grouped fields)
│   │   ├── .form-group (field + label + error)
│   │   ├── .form-row (2-column grid)
│   │   └── .form-actions (flex, right-aligned)
│   │
│   └── Modal
│       ├── .modal-overlay (fixed, full-screen)
│       ├── .modal-content (centered, white)
│       ├── .modal-header (flex, space-between)
│       └── .stats-grid (responsive grid)
│
├── Elements
│   ├── Buttons
│   │   ├── .btn (base style)
│   │   ├── .btn-primary (blue)
│   │   ├── .btn-secondary (gray)
│   │   ├── .btn-danger (red)
│   │   ├── .btn-danger-confirm (animated red)
│   │   └── .btn-sm (small variant)
│   │
│   ├── Inputs
│   │   ├── input (text, select)
│   │   ├── input:focus (blue border)
│   │   └── input.error (red border)
│   │
│   └── Status
│       ├── .loading (centered text)
│       └── .error-message (red text)
│
└── Responsive
    └── @media (max-width: 768px)
        ├── Stacked navigation
        ├── Full-width search
        ├── Single-column forms
        └── Vertical action buttons
```

## Type Definitions

### Core Types

```typescript
// Site Entity
interface Site {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  timezone?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Create Input (POST)
interface CreateSiteInput {
  organization_id: string;
  name: string;
  code: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  timezone?: string;
  manager_id?: string;
}

// Update Input (PUT)
interface UpdateSiteInput {
  name?: string;
  code?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  timezone?: string;
  manager_id?: string;
  is_active?: boolean;
}

// Query Parameters
interface SiteQueryParams {
  organizationId?: string;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

// API Response
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Statistics Response
interface SiteStatistics {
  site: Site;
  departmentCount: number;
  employeeCount: number;
}
```

## Files Summary

| File | LOC | Purpose |
|------|-----|---------|
| `siteService.ts` | 190 | API client for backend communication |
| `SiteList.tsx` | 100 | Table display component |
| `SiteForm.tsx` | 280 | Create/Edit form component |
| `SiteManagement.tsx` | 240 | Container orchestrator component |
| `SiteManagement.css` | 520 | All styling for Site components |
| `App.tsx` | 60 | Main app with navigation |
| `App.css` | 100 | Navigation and home page styles |
| **Total** | **1,490** | **Complete Site Management UI** |

---

This architecture provides a clean separation of concerns, making the codebase:
- ✅ Easy to understand
- ✅ Simple to maintain
- ✅ Ready to extend
- ✅ Type-safe throughout
- ✅ Production-ready
