# Environment Variable Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    .env File (git-ignored)                   │
│  Contains actual configuration values for all components     │
└───────────┬────────────────────────────────┬────────────────┘
            │                                │
            │                                │
┌───────────▼──────────┐      ┌──────────────▼────────────────┐
│   VITE_ prefixed     │      │  Standard environment vars     │
│   Frontend Variables │      │  Backend Variables             │
└───────────┬──────────┘      └──────────┬────────────────────┘
            │                            │
            │                            │
┌───────────▼──────────┐      ┌──────────▼──────────┬─────────▼──────────┐
│  Frontend (Vite)     │      │  Node API (Express) │  Python API (FastAPI)│
│  ─────────────       │      │  ──────────────────  │  ───────────────────│
│  import.meta.env     │      │  process.env         │  os.environ          │
│         │            │      │         │            │         │            │
│         ▼            │      │         ▼            │         ▼            │
│  src/vite-env.d.ts   │      │  api/config.ts       │  python/config.py    │
│  (TypeScript types)  │      │  (envalid)           │  (pydantic)          │
│         │            │      │         │            │         │            │
│         ▼            │      │         ▼            │         ▼            │
│   src/config.ts      │      │   Validated Config   │   Settings Class     │
│   (Typed config)     │      │                      │                      │
│         │            │      │         │            │         │            │
│         ▼            │      │         ▼            │         ▼            │
│    React App         │      │   Express Server     │   FastAPI Server     │
└──────────────────────┘      └──────────────────────┴──────────────────────┘
```

## Data Flow

### 1. Frontend Variables

```
.env
  ↓
VITE_API_URL=http://localhost:3001
  ↓
Vite build process (only VITE_ prefixed vars)
  ↓
import.meta.env.VITE_API_URL
  ↓
src/vite-env.d.ts (TypeScript definition)
  ↓
src/config.ts (config.api.baseUrl)
  ↓
React Components
```

### 2. Node API Variables

```
.env
  ↓
PORT=3001
NODE_ENV=development
  ↓
dotenv package loads into process.env
  ↓
api/config.ts (envalid validates)
  ↓
config.server.port (validated and typed)
  ↓
Express Server
```

### 3. Python API Variables

```
.env
  ↓
PYTHON_PORT=8000
PYTHON_ENV=development
  ↓
pydantic-settings loads from .env
  ↓
python/config.py (Settings class)
  ↓
settings.python_port (validated with Pydantic)
  ↓
FastAPI Server
```

## Variable Visibility

```
┌──────────────────────────────────────────────────────────┐
│  .env File                                               │
│  ────────                                                │
│                                                          │
│  ┌────────────────────────────────────┐                 │
│  │ VITE_* variables                   │ → Public        │
│  │ (embedded in frontend bundle)      │   (in browser)  │
│  └────────────────────────────────────┘                 │
│                                                          │
│  ┌────────────────────────────────────┐                 │
│  │ NODE_*, PORT, etc.                 │ → Private       │
│  │ (Node API only)                    │   (server only) │
│  └────────────────────────────────────┘                 │
│                                                          │
│  ┌────────────────────────────────────┐                 │
│  │ PYTHON_*, LOG_LEVEL, etc.          │ → Private       │
│  │ (Python API only)                  │   (server only) │
│  └────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────┘
```

## Validation Layers

### Frontend (src/config.ts)

- ✅ TypeScript type checking
- ✅ Runtime defaults
- ✅ Boolean conversions
- ⚠️ No validation (values can be anything)

### Node API (api/config.ts)

- ✅ TypeScript type checking
- ✅ envalid validation
- ✅ Type coercion (string → number)
- ✅ Required vs optional
- ✅ Default values
- ✅ Enum choices

### Python API (python/config.py)

- ✅ Pydantic type validation
- ✅ Type coercion
- ✅ Default values
- ✅ Custom validators
- ✅ Computed properties

## File Hierarchy

```
staffing-flow/
├── .env                    # Active config (git-ignored)
├── .env.example            # Template (committed)
├── .env.quickstart         # Quick reference
├── ENV_GUIDE.md            # Full documentation
├── ENV_SUMMARY.md          # This summary
│
├── src/
│   ├── vite-env.d.ts       # TypeScript definitions
│   └── config.ts           # Frontend config module
│
├── api/
│   └── config.ts           # Node API config module
│
└── python/
    └── config.py           # Python API config module
```

## Security Boundaries

```
┌─────────────────────────────────────────────────┐
│  Browser (Public)                               │
│  ───────────────                                │
│  • VITE_* variables are PUBLIC                  │
│  • Embedded in JavaScript bundle                │
│  • Visible to anyone                            │
│  • Never put secrets here!                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Node API Server (Private)                      │
│  ─────────────────────                          │
│  • All environment variables available          │
│  • Can contain secrets                          │
│  • Not exposed to browser                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Python API Server (Private)                    │
│  ──────────────────────                         │
│  • All environment variables available          │
│  • Can contain secrets                          │
│  • Not exposed to browser                       │
└─────────────────────────────────────────────────┘
```

## Common Patterns

### Feature Flags

```typescript
// Frontend
if (config.features.debug) {
  console.log('Debug mode enabled');
}

// Backend
if (config.isDevelopment) {
  app.use(morgan('dev'));
}
```

### API Endpoints

```typescript
// Frontend calls backend
const response = await fetch(`${config.api.baseUrl}/api/staff`);

// Backend runs on configured port
app.listen(config.server.port);
```

### Environment-Specific Behavior

```python
# Python API
if settings.is_production:
    # Production optimizations
    pass
else:
    # Development features
    app.debug = True
```
