# Quick Start Guide - Site Management UI

## Prerequisites

Before running the application, ensure you have:
1. ✅ Node.js installed (v18 or higher)
2. ✅ npm installed
3. ✅ Supabase instance configured
4. ✅ Environment variables set up

## Running the Application

### 1. Start the Development Server

```bash
cd /workspaces/MMartinezPortfolioRedo/ReactProjects/staffing-flow

# Start both web and API servers
npm run dev

# Or start them separately:
npm run dev:web   # Frontend only (port 5173)
npm run dev:api   # Backend only (port 3000)
```

### 2. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

### 3. Navigate to Site Management

1. Click the **"Sites"** button in the navigation bar
2. Or click **"Manage Sites →"** on the home page

## Using the Site Management UI

### Creating a Site

1. Click **"+ Create New Site"** button
2. Fill in the required fields:
   - **Site Name** (required)
   - **Site Code** (required, uppercase letters/numbers/hyphens)
3. Optional: Fill in address fields
4. Select timezone (defaults to America/New_York)
5. Click **"Create Site"**

### Editing a Site

1. Find the site in the table
2. Click the **✏️ (Edit)** button
3. Modify the fields you want to change
4. Toggle **Active Site** checkbox if needed
5. Click **"Update Site"**

### Deleting a Site

1. Find the site in the table
2. Click the **🗑️ (Delete)** button once
3. Button will turn red with ⚠️ symbol
4. Click again within 3 seconds to confirm

### Viewing Statistics

1. Find the site in the table
2. Click the **📊 (Statistics)** button
3. View department and employee counts
4. Click X or outside the modal to close

### Searching & Filtering

**Search:**
- Type in the search box to filter by name or code
- Search is case-insensitive
- Results update in real-time

**Filter by Status:**
- Use the status dropdown to filter:
  - All Sites
  - Active Only
  - Inactive Only

**Pagination:**
- Use **Previous** and **Next** buttons to navigate
- Page info shows current page and total pages
- 10 sites per page

## API Connection

The UI connects to the API at:
```
http://localhost:3000/api/sites
```

### Setting Authentication Token

Currently using demo mode. For production, add authentication:

```typescript
import { siteService } from './services/siteService';

// Set JWT token
siteService.setToken('your-jwt-token-here');
```

## Troubleshooting

### Issue: "Failed to fetch sites"

**Solutions:**
1. Check if API server is running: `http://localhost:3000/api/health`
2. Verify Supabase credentials in `.env`
3. Check browser console for CORS errors
4. Ensure database tables exist (run SUPABASE_SETUP.md scripts)

### Issue: "Validation error"

**Solutions:**
1. Check site code format (uppercase only)
2. Verify ZIP code format (12345 or 12345-1234)
3. Ensure required fields are filled

### Issue: TypeScript errors

**Solutions:**
```bash
# Run type check
npm run type-check:web

# If errors persist, try:
rm -rf node_modules
npm install
```

### Issue: UI not updating after changes

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console for errors
3. Verify API response in Network tab
4. Restart dev server

## Development Commands

```bash
# Type checking
npm run type-check:web      # Check web types
npm run type-check:api      # Check API types
npm run type-check          # Check all types

# Linting
npm run lint                # Run all linters
npm run lint:fix            # Auto-fix linting issues

# Formatting
npm run format              # Format all files
npm run format:check        # Check formatting

# Building
npm run build               # Build for production
npm run build:web           # Build web only
npm run build:api           # Build API only
```

## Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

## Browser Requirements

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Tips

1. **Search**: Use specific search terms to reduce results
2. **Pagination**: Adjust limit in code if needed (default 10)
3. **Caching**: Browser caches site data automatically
4. **Network**: Check Network tab for slow API calls

## Keyboard Shortcuts

Currently not implemented. Future versions will include:
- `Ctrl/Cmd + N` - New site
- `Ctrl/Cmd + F` - Focus search
- `Esc` - Close modals/forms
- `Arrow Keys` - Navigate table

## Next Steps

After setting up Site Management:
1. Explore the API documentation: `API_IMPLEMENTATION_SUMMARY.md`
2. Review the UI documentation: `SITE_UI_DOCUMENTATION.md`
3. Check out other modules: Skills, Labor Standards, Shift Templates
4. Set up authentication for production use

## Support

For questions or issues:
- Check the documentation files
- Review the API logs
- Check browser console
- Verify database connections

Happy managing! 🏢
