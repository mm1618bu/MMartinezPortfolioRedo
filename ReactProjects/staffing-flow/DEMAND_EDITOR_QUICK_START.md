# Demand Editor UI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: View the Component
The component is already built and ready to use!

**Location:** `/src/components/demands/`

**Files:**
- `DemandEditor.tsx` - Main component (324 LOC)
- `DemandGrid.tsx` - Data table (226 LOC)
- `DemandFilters.tsx` - Search & filter (264 LOC)
- `DemandForm.tsx` - Create/edit modal (353 LOC)
- `DemandEditor.css` - Styling (600+ LOC)
- `demandService.ts` - API layer (264 LOC)

### Step 2: Import in Your App

**Option A: Simple Integration**
```tsx
import { DemandEditor } from './components/demands';

function App() {
  return (
    <div>
      <DemandEditor />
    </div>
  );
}

export default App;
```

**Option B: With Layout**
```tsx
import { DemandEditor } from './components/demands';

function App() {
  return (
    <div className="app">
      <header>
        <h1>Staffing Flow</h1>
      </header>
      <main>
        <DemandEditor />
      </main>
    </div>
  );
}
```

### Step 3: Start Development Server

```bash
npm run dev
```

The component will be available at `http://localhost:5173`

### Step 4: Test It Out

1. **Create a demand:** Click "+ New Demand" button
2. **Fill the form:** Date, shift type, employees, priority
3. **Submit:** Click "Create Demand"
4. **View in grid:** Your demand appears in the table
5. **Filter:** Try filtering by date, priority, etc.
6. **Edit:** Click the ✏️ button to edit
7. **Delete:** Click 🗑️ to delete
8. **Export:** Click CSV/JSON/Excel to download

---

## 📋 What You Get

### Features Out of the Box
✅ Sortable table (click headers)  
✅ Multi-select checkboxes  
✅ Advanced filtering (5+ dimensions)  
✅ Text search  
✅ Date range picker  
✅ Create/Edit/Delete operations  
✅ Bulk delete  
✅ Data export (CSV, JSON, Excel)  
✅ Pagination  
✅ Summary statistics  
✅ Responsive design  
✅ Loading states  
✅ Error handling  

### No Additional Setup Required
- ✅ No npm packages to install
- ✅ No CSS frameworks needed
- ✅ No configuration files
- ✅ No database setup
- ✅ Uses existing config.ts

---

## 🔧 Configuration

### Environment Variables
Already configured in `.env`:
```
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Staffing Flow
VITE_APP_VERSION=0.1.0
```

### Authentication Setup
The component expects auth token in localStorage:
```typescript
// In your login/auth component
localStorage.setItem('auth_token', 'your-jwt-token');
localStorage.setItem('organization_id', 'org-id');
```

### API Backend
Ensure backend is running:
```bash
# In another terminal
npm run dev:api
```

---

## 🎯 Common Tasks

### Change Colors
Edit `src/components/demands/DemandEditor.css`:
```css
/* Change primary color from blue to purple */
.btn-primary {
  background-color: #7c3aed;  /* was #1976d2 */
}

.priority-high {
  background-color: #fce7f3;  /* was #ffebee */
  color: #be185d;             /* was #c62828 */
}
```

### Add New Filter
Edit `DemandFilters.tsx`:
```tsx
// Add to FilterState interface
departmentIds: string[];
shiftTypes: string[];
skills?: string[];  // <- Add this

// Add to filter grid
<div className="filter-group">
  <label>Skills</label>
  <div className="checkbox-group">
    {availableOptions.skills?.map(skill => (
      <label key={skill}>
        <input type="checkbox" />
        {skill}
      </label>
    ))}
  </div>
</div>
```

### Customize Grid Columns
Edit `DemandGrid.tsx`:
```tsx
<th className="sortable" onClick={() => onSort('custom_field')}>
  Custom Field {renderSortIcon('custom_field')}
</th>
```

### Change Page Size Options
Edit `DemandGrid.tsx`:
```tsx
<select id="pageSize" value={pagination.pageSize}>
  <option value="5">5</option>
  <option value="10">10</option>
  <option value="20">20</option>
  <option value="50">50</option>
  <option value="100">100</option>
  <option value="500">500</option>  {/* Add this */}
</select>
```

---

## 🐛 Debugging

### Check TypeScript
```bash
npm run type-check:web
```

### Check Console Errors
Open browser DevTools (F12) → Console tab

### Test API Directly
```bash
# Get demands
curl http://localhost:3001/api/demands/grid \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create demand
curl -X POST http://localhost:3001/api/demands/grid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-15",
    "shift_type": "morning",
    "required_employees": 5,
    "priority": "high",
    "organization_id": "org-123"
  }'
```

### Enable Debug Mode
Edit `.env`:
```
VITE_ENABLE_DEBUG=true
```

Then add logging:
```tsx
if (config.features.debug) {
  console.log('GridState:', gridState);
  console.log('Filters:', filters);
}
```

---

## 📱 Responsive Design

The component is fully responsive:

| Breakpoint | Layout | Features |
|-----------|--------|----------|
| **Desktop** (1200px+) | 4-column grid | Full feature set |
| **Tablet** (768px) | Single column filters | Stacked layout |
| **Mobile** (480px) | Vertical stacking | Touch-friendly buttons |
| **Small** (<480px) | Full width | Optimized for small screens |

Test responsiveness:
```bash
# Open DevTools (F12)
# Click device toolbar icon
# Select different devices
```

---

## 📊 API Integration

### Backend Endpoints
The component calls these 10 endpoints:

```
GET    /api/demands/grid              # Required
GET    /api/demands/grid/:id          # Required
POST   /api/demands/grid              # Required
PUT    /api/demands/grid/:id          # Required
DELETE /api/demands/grid/:id          # Required
POST   /api/demands/grid/bulk-delete  # Optional (bulk ops)
POST   /api/demands/grid/bulk-update  # Optional (bulk ops)
POST   /api/demands/grid/export       # Optional (export)
GET    /api/demands/grid/summary      # Optional (stats)
GET    /api/demands/grid/filters      # Optional (filter dropdowns)
```

All are already implemented! See `/api/docs/DEMAND_GRID_API.md`

### Mock Data
To test without backend:
```tsx
// src/components/demands/DemandEditor.tsx
const mockDemands = [
  {
    id: '1',
    date: '2026-02-15',
    shift_type: 'morning',
    required_employees: 5,
    priority: 'high',
    organization_id: 'org-1',
    created_at: new Date().toISOString(),
    created_by: 'user-1'
  },
  // ... more demands
];

// Replace API calls
const fetchGridData = useCallback(async () => {
  setGridState(prev => ({
    ...prev,
    data: mockDemands,
    loading: false,
  }));
}, []);
```

---

## ✨ Tips & Tricks

### Keyboard Shortcuts
- **Ctrl/Cmd + A**: Select all (in filter checkboxes)
- **Tab**: Navigate form fields
- **Enter**: Submit form / Search
- **Esc**: Close modal

### Performance Tips
- Limit page size to 50 for better performance
- Use date range filters to reduce results
- Avoid searching for very common terms
- Clear old data before large exports

### Accessibility
- Component supports keyboard navigation
- Screen reader compatible
- High contrast colors
- Proper ARIA labels

---

## 🆘 Troubleshooting

### "Cannot find module" Error
```
Solution: Make sure all files are in /src/components/demands/
         Check imports use correct relative paths
```

### "API is not responding"
```
Solution: Check backend is running (npm run dev:api)
         Check API_URL in .env
         Check auth token in localStorage
```

### "No data showing"
```
Solution: Check browser console for errors (F12)
         Verify authentication token is valid
         Check API returns data (use curl to test)
         Check filters aren't too restrictive
```

### "Styling looks broken"
```
Solution: Clear browser cache (Ctrl+Shift+Delete)
         Check DemandEditor.css is imported
         Check no CSS conflicts with other stylesheets
```

### "Form submits but nothing happens"
```
Solution: Check browser console for errors
         Verify organization_id is set in localStorage
         Check backend validation rules
         Check network tab (F12) for API responses
```

---

## 📚 Documentation

### Quick References
- `README.md` - In same folder, component guide
- `DEMAND_EDITOR_SUMMARY.md` - Features & stats
- `DEMAND_EDITOR_ARCHITECTURE.md` - System design
- `/api/docs/DEMAND_GRID_API.md` - Backend API docs

### Code Documentation
- Inline JSDoc comments
- TypeScript types for all props
- Named functions explaining intent
- CSS classes using BEM convention

---

## 🎓 Learning Resources

### Understanding the Code
1. Start with `DemandEditor.tsx` - see overall structure
2. Look at `demandService.ts` - understand API layer
3. Check `DemandGrid.tsx` - see table rendering
4. Study `DemandFilters.tsx` - learn filtering logic
5. Review `DemandForm.tsx` - understand form validation

### Best Practices Demonstrated
- ✅ React hooks (useState, useEffect, useCallback)
- ✅ TypeScript strict mode
- ✅ Prop drilling with callbacks
- ✅ Error handling patterns
- ✅ Form validation
- ✅ API integration
- ✅ Responsive CSS
- ✅ State management

---

## 🚀 Production Checklist

Before deploying:
- [ ] Test all CRUD operations
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Test with large datasets (1000+ rows)
- [ ] Test error scenarios (invalid data, network errors)
- [ ] Run `npm run type-check:web`
- [ ] Check `npm run lint:js`
- [ ] Update API endpoint for production
- [ ] Ensure authentication is secure
- [ ] Monitor performance in DevTools

---

## 📞 Support

### Getting Help
1. Check browser console (F12) for errors
2. Review component comments in code
3. Check component README.md
4. Check architecture documentation
5. Test API endpoints with curl
6. Check backend logs

### Reporting Issues
When reporting issues, include:
- What you were doing
- What you expected
- What actually happened
- Browser console errors
- Network requests (F12 Network tab)

---

**Ready to use! Happy coding! 🎉**

For complete guide, see: `/src/components/demands/README.md`
