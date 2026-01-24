# Site Management UI Documentation

## Overview
The Site Management UI is a comprehensive admin interface for managing physical locations and facilities in the Staffing Flow application.

## Features

### ✅ Implemented Features

1. **Site List View**
   - Tabular display of all sites
   - Active/inactive status badges
   - Formatted address display
   - Pagination support (10 items per page)
   - Hover effects for better UX

2. **Search & Filtering**
   - Real-time search by site name or code
   - Filter by status (All / Active / Inactive)
   - Search resets pagination to page 1

3. **Create Site**
   - Form validation (required fields, format validation)
   - Address fields (line 1, line 2, city, state, ZIP, country)
   - Timezone selection (US timezones + UTC)
   - Site code validation (uppercase letters, numbers, hyphens)
   - ZIP code format validation (5 digits or 5+4 format)

4. **Edit Site**
   - Pre-populated form with existing data
   - Active/inactive toggle
   - Only sends changed fields to API
   - Validation on all fields

5. **Delete Site**
   - Two-click confirmation to prevent accidental deletion
   - Visual warning on first click (⚠️)
   - 3-second timeout for confirmation
   - Soft delete (sets is_active to false)

6. **Site Statistics Modal**
   - View department count
   - View employee count
   - Site details display
   - Modal overlay with click-outside-to-close

7. **User Feedback**
   - Success alerts (auto-dismiss after 3 seconds)
   - Error alerts (persistent until dismissed)
   - Loading states on all async operations
   - Disabled buttons during form submission

8. **Responsive Design**
   - Mobile-friendly layout
   - Responsive tables
   - Stacked forms on small screens
   - Touch-friendly buttons

## File Structure

```
src/
├── services/
│   └── siteService.ts          # API client for Site CRUD operations
├── components/
│   └── sites/
│       ├── SiteManagement.tsx  # Main container component
│       ├── SiteList.tsx        # Table view component
│       ├── SiteForm.tsx        # Create/Edit form component
│       └── SiteManagement.css  # Styling for all Site components
├── App.tsx                     # Updated with navigation
└── App.css                     # Updated with navigation styles
```

## Component Architecture

### SiteManagement (Container)
- **Purpose**: Main orchestrator component
- **State Management**:
  - Sites list
  - Loading/error states
  - Form visibility
  - Editing state
  - Search/filter state
  - Pagination state
  - Statistics modal state
  - Success messages
- **Key Methods**:
  - `fetchSites()` - Fetch sites with filters
  - `handleCreate()` - Open create form
  - `handleEdit(site)` - Open edit form
  - `handleSubmit(data)` - Create or update site
  - `handleDelete(id)` - Delete site
  - `handleViewStats(id)` - View site statistics

### SiteList (Presentation)
- **Props**:
  - `sites: Site[]` - Array of sites to display
  - `onEdit: (site) => void` - Edit callback
  - `onDelete: (id) => void` - Delete callback
  - `onViewStats: (id) => void` - Stats callback
- **Features**:
  - Table rendering
  - Action buttons
  - Delete confirmation logic
  - Address formatting

### SiteForm (Form)
- **Props**:
  - `site?: Site | null` - Site to edit (null for create)
  - `organizationId: string` - Organization ID for new sites
  - `onSubmit: (data) => Promise<void>` - Submit callback
  - `onCancel: () => void` - Cancel callback
  - `isLoading?: boolean` - Loading state
- **Features**:
  - Form validation
  - Error display
  - Field formatting (uppercase code, state)
  - Timezone selection
  - Active/inactive toggle (edit mode only)

## API Integration

### Endpoints Used
- `GET /api/sites` - List sites with pagination
- `GET /api/sites/:id` - Get site by ID
- `GET /api/sites/:id/statistics` - Get site statistics
- `POST /api/sites` - Create new site
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site

### API Client (siteService)
```typescript
// Set authentication token
siteService.setToken(token);

// Get all sites with filters
const response = await siteService.getAll({
  organizationId: 'xxx',
  search: 'warehouse',
  is_active: true,
  page: 1,
  limit: 10
});

// Create site
const newSite = await siteService.create({
  organization_id: 'xxx',
  name: 'Main Warehouse',
  code: 'MAIN-WH-01',
  // ... other fields
});

// Update site
const updated = await siteService.update(siteId, {
  name: 'Updated Name',
  is_active: false
});

// Delete site
await siteService.delete(siteId);

// Get statistics
const stats = await siteService.getStatistics(siteId);
```

## Validation Rules

### Site Name
- **Required**: Yes
- **Format**: Any text
- **Error**: "Site name is required"

### Site Code
- **Required**: Yes
- **Format**: Uppercase letters, numbers, and hyphens only
- **Pattern**: `/^[A-Z0-9-]+$/`
- **Error**: "Code must contain only uppercase letters, numbers, and hyphens"
- **Auto-format**: Input transforms to uppercase

### ZIP Code
- **Required**: No
- **Format**: 5 digits or 5+4 format (e.g., 10001 or 10001-1234)
- **Pattern**: `/^\d{5}(-\d{4})?$/`
- **Error**: "Invalid ZIP code format"

### State
- **Required**: No
- **Format**: 2 characters
- **Auto-format**: Input transforms to uppercase
- **Max Length**: 2

## Styling

### Color Palette
- **Primary**: #007bff (Blue)
- **Success**: #d4edda (Light Green)
- **Error**: #f8d7da (Light Red)
- **Secondary**: #6c757d (Gray)
- **Borders**: #dee2e6 (Light Gray)

### Button States
- **Primary**: Blue background, white text
- **Secondary**: Gray background, white text
- **Danger**: Red background, white text
- **Danger Confirm**: Bright red with pulse animation
- **Disabled**: 50% opacity, cursor not allowed

### Responsive Breakpoints
- **Desktop**: > 768px
- **Mobile**: ≤ 768px

## Usage Example

```tsx
import { SiteManagement } from './components/sites/SiteManagement';

function AdminPanel() {
  return (
    <div>
      <SiteManagement />
    </div>
  );
}
```

## Authentication Note

⚠️ **Important**: The current implementation uses a hardcoded demo organization ID for testing purposes:

```typescript
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';
```

**Production Implementation**:
In production, this should be replaced with:
1. Get organization ID from authenticated user context
2. Use JWT token from authentication service
3. Set token on siteService: `siteService.setToken(authToken)`

Example:
```typescript
import { useAuth } from './context/AuthContext';

function SiteManagement() {
  const { user, token } = useAuth();
  
  useEffect(() => {
    if (token) {
      siteService.setToken(token);
    }
  }, [token]);
  
  const organizationId = user.organization_id;
  // ... rest of component
}
```

## Future Enhancements

### Planned Features
- [ ] Export sites to CSV/Excel
- [ ] Import sites from CSV
- [ ] Bulk edit operations
- [ ] Advanced filtering (by manager, multiple fields)
- [ ] Sort columns (name, code, status, etc.)
- [ ] Manager assignment dropdown
- [ ] Site analytics dashboard
- [ ] Map view of sites (geolocation)
- [ ] Site contact information
- [ ] Operating hours configuration
- [ ] Department management per site
- [ ] Employee assignment per site

### Technical Improvements
- [ ] Add React Router for proper routing
- [ ] Implement global state management (Redux/Zustand)
- [ ] Add unit tests (Jest, React Testing Library)
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Implement optimistic updates
- [ ] Add debounce to search input
- [ ] Implement infinite scroll as alternative to pagination
- [ ] Add keyboard shortcuts
- [ ] Implement undo/redo for deletions
- [ ] Add field-level validation on blur

## Testing Checklist

### Manual Testing
- [x] Create new site with all fields
- [x] Create new site with only required fields
- [x] Edit existing site
- [x] Toggle active/inactive status
- [x] Delete site with confirmation
- [x] Search sites by name
- [x] Search sites by code
- [x] Filter by active status
- [x] Filter by inactive status
- [x] Navigate pagination
- [x] View site statistics
- [x] Form validation (empty required fields)
- [x] Form validation (invalid code format)
- [x] Form validation (invalid ZIP format)
- [x] Error handling (API errors)
- [x] Success messages display
- [x] Loading states during API calls
- [x] Mobile responsive layout

## Known Issues

None currently identified.

## Support

For issues or questions:
1. Check API_IMPLEMENTATION_SUMMARY.md for API details
2. Review TypeScript types in siteService.ts
3. Check browser console for errors
4. Verify API is running on configured baseUrl

## Changelog

### Version 1.0.0 (January 2026)
- Initial release
- Complete CRUD operations
- Search and filtering
- Pagination
- Site statistics
- Form validation
- Responsive design
- Success/error alerts
- Delete confirmation
