# Department Management UI - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on port 3001
- Supabase database configured with departments table

### Installation

The Department Management UI is already integrated into the Staffing Flow application. No additional installation needed.

### Starting the Application

**Option 1: Development Mode (Recommended)**

```bash
# Terminal 1: Start the backend API
npm run dev:api

# Terminal 2: Start the web frontend
npm run dev:web
```

Then open your browser to: `http://localhost:5173`

**Option 2: Production Build**

```bash
# Build the application
npm run build:web

# Serve the built files
npm run preview
```

## 📖 Using the Department Management UI

### Navigation

1. Open the application in your browser
2. Click **"Departments"** in the top navigation bar
3. You'll see the Department Management page

### Creating a Department

1. Click the **"+ Create Department"** button (top right)
2. Fill in the required fields:
   - **Department Name** (required) - e.g., "Engineering", "Sales"
   - **Description** (optional) - Brief description of the department
   - **Manager ID** (optional) - UUID of the department manager
3. Click **"Create Department"**
4. Success message will appear, and the new department will be added to the list

### Editing a Department

1. Find the department you want to edit in the table
2. Click the **✏️ Edit** button in the Actions column
3. Modify the fields you want to change
4. Click **"Update Department"**
5. Changes will be saved and reflected immediately

### Deleting a Department

1. Find the department you want to delete
2. Click the **🗑️ Delete** button in the Actions column
3. The button will turn red and pulse
4. Click the button **again within 3 seconds** to confirm deletion
5. The department will be removed from the list

### Viewing Department Statistics

1. Find the department you want to view stats for
2. Click the **📊 Statistics** button
3. A modal will open showing:
   - Total Employees in the department
   - Active Employees count
   - Shifts scheduled this week
4. Click the **✕** button or outside the modal to close

### Searching Departments

1. Use the **search box** at the top of the department list
2. Type the department name you're looking for
3. The list will filter in real-time as you type
4. Clear the search box to see all departments

### Pagination

- Use the **← Previous** and **Next →** buttons at the bottom
- Page information shows current page and total pages
- Each page displays 10 departments

## 🎨 Form Validation

The form validates your input before submission:

### Department Name
- **Required**: Cannot be empty
- **Maximum Length**: 100 characters
- **Error**: "Department name is required"

### Description
- **Optional**: Can be left empty
- **Maximum Length**: 500 characters
- **Character Counter**: Shows remaining characters
- **Error**: "Description must be 500 characters or less"

### Manager ID
- **Optional**: Can be left empty
- **Format**: Must be a valid UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- **Error**: "Invalid manager ID format"

## 🔧 Troubleshooting

### "Failed to fetch departments"

**Problem**: Cannot connect to the backend API

**Solutions**:
1. Verify the API server is running: `npm run dev:api`
2. Check the API URL in `src/config.ts` (default: http://localhost:3001)
3. Ensure Supabase credentials are configured in `.env`

### "Failed to create department"

**Problem**: Department creation fails

**Solutions**:
1. Check that all required fields are filled
2. Verify the organization ID is valid
3. Check backend API logs for detailed error messages
4. Ensure database connection is working

### "Invalid manager ID format"

**Problem**: Manager ID is not a valid UUID

**Solutions**:
1. Ensure the manager ID is in UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
2. Leave the field empty if no manager is assigned
3. Copy the UUID from the employees table if available

### Departments not appearing

**Problem**: Department list is empty

**Solutions**:
1. Check if any departments exist in the database
2. Verify the organization ID filter is correct
3. Clear the search box to ensure filtering isn't hiding results
4. Check browser console for JavaScript errors

### UI not responsive on mobile

**Problem**: Layout breaks on small screens

**Solutions**:
1. Clear browser cache and reload
2. Ensure CSS file is loaded (check Network tab in DevTools)
3. Try a different browser
4. Check for JavaScript errors in console

## 🔐 Configuration

### Changing the API URL

Edit `src/config.ts`:

```typescript
export const config = {
  api: {
    baseUrl: 'http://your-api-url:3001',  // Change this
    ...
  },
  ...
};
```

### Setting Organization ID

Currently uses a demo organization ID. To use your organization:

Edit `src/components/departments/DepartmentManagement.tsx`:

```typescript
// Replace this line:
const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

// With your organization ID:
const DEMO_ORG_ID = 'your-org-uuid-here';
```

Or better yet, implement authentication and get it from the user context.

### Adjusting Pagination

Edit `src/components/departments/DepartmentManagement.tsx`:

```typescript
const itemsPerPage = 10;  // Change to desired number
```

## 📱 Keyboard Shortcuts

- **Tab**: Navigate through form fields
- **Enter**: Submit form (when in form)
- **Escape**: Close modal (when modal is open)

## 🎯 Best Practices

1. **Always fill required fields** - Department name is mandatory
2. **Use descriptive names** - Clear, unique department names help with search
3. **Add descriptions** - Help team members understand department purpose
4. **Confirm before deleting** - Double-check before the second delete click
5. **Use search effectively** - Search is case-insensitive and instant

## 📊 Performance Tips

- **Pagination**: List shows 10 items per page for optimal performance
- **Search**: Filters locally for fast results
- **Caching**: Recently fetched data is cached temporarily
- **Auto-refresh**: List refreshes after create/update/delete operations

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console for errors (F12 → Console tab)
2. Review the backend API logs
3. Verify database connection and table structure
4. Check that all environment variables are set
5. Ensure npm packages are installed (`npm install`)

---

**Need more help?** Check the comprehensive documentation:
- [Department UI Documentation](./DEPARTMENT_UI_DOCUMENTATION.md)
- [Component Architecture](./DEPARTMENT_COMPONENT_ARCHITECTURE.md)
- [API Integration Guide](./API_INTEGRATION.md)
