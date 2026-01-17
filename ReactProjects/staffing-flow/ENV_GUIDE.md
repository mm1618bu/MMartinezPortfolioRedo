# Environment Variable Management

This document explains how environment variables are configured and used across the Staffing Flow application.

## Overview

The application uses environment variables for configuration across three main components:

1. **Frontend (Vite/React)** - Uses `VITE_` prefixed variables
2. **Node/Express API** - Standard Node.js environment variables
3. **Python/FastAPI** - Python-specific configuration

## Setup

### Initial Setup

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` with your configuration values

3. Never commit `.env` files (already in `.gitignore`)

## Environment Files

### `.env`

Main environment file for all services. Contains actual values (git-ignored).

### `.env.example`

Template file with all available variables and descriptions. This file is committed to the repository.

### `.env.local`

Optional file for local overrides (git-ignored).

## Frontend Variables (Vite)

All frontend environment variables **must** be prefixed with `VITE_`.

### Available Variables

```bash
VITE_API_URL=http://localhost:3001              # Node API endpoint
VITE_PYTHON_API_URL=http://localhost:8000       # Python API endpoint
VITE_ENABLE_DEBUG=true                          # Enable debug features
VITE_ENABLE_ANALYTICS=false                     # Enable analytics
VITE_APP_NAME="Staffing Flow"                   # Application name
VITE_APP_VERSION=0.1.0                          # Application version
```

### Usage in Code

```typescript
import config from './config';

// Access variables through the config object
console.log(config.api.baseUrl); // Type-safe
console.log(config.app.name);
console.log(config.features.debug);

// Or access directly (not type-safe)
console.log(import.meta.env.VITE_API_URL);
```

### Type Definitions

TypeScript definitions are in `src/vite-env.d.ts` for autocomplete and type checking.

## Node/Express API Variables

### Available Variables

```bash
NODE_ENV=development                            # Environment (development/production/test)
PORT=3001                                       # Server port
API_HOST=localhost                              # Server host
CORS_ORIGINS=http://localhost:5173,http://localhost:3000  # CORS allowed origins
```

### Usage in Code

```typescript
import config from './api/config';

// Access validated configuration
console.log(config.server.port); // Type-safe and validated
console.log(config.cors.origins); // Parsed array
console.log(config.isDevelopment); // Boolean helpers
```

### Validation

The API uses `envalid` to validate environment variables at startup. The app will fail fast if required variables are missing or invalid.

## Python API Variables

### Available Variables

```bash
PYTHON_ENV=development                          # Environment
PYTHON_PORT=8000                                # Server port
PYTHON_HOST=0.0.0.0                            # Server host
PYTHON_CORS_ORIGINS=http://localhost:5173,...  # CORS origins
LOG_LEVEL=INFO                                  # Logging level
```

### Usage in Code

```python
from python.config import settings

# Access validated settings
print(settings.python_port)           # Type-safe with Pydantic
print(settings.cors_origins_list)     # Parsed list
print(settings.is_development)        # Boolean helpers
```

### Validation

The Python API uses `pydantic-settings` to validate and parse environment variables. Invalid configurations will raise clear errors at startup.

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
VITE_ENABLE_DEBUG=true
LOG_LEVEL=DEBUG
```

### Production

```bash
NODE_ENV=production
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
LOG_LEVEL=WARNING
```

### Testing

```bash
NODE_ENV=test
PYTHON_ENV=test
```

## Security Best Practices

### ✅ DO

- Store sensitive data (API keys, secrets) in environment variables
- Use `.env.local` for local development overrides
- Keep `.env.example` updated with all variables (without sensitive values)
- Use strong validation in config files
- Rotate secrets regularly

### ❌ DON'T

- Commit `.env` files to version control
- Expose backend environment variables to the frontend
- Store secrets in the frontend (all `VITE_` vars are public)
- Use default secrets in production
- Share `.env` files through unsecure channels

## Adding New Variables

### Frontend Variable

1. Add to `.env.example` with documentation:

```bash
VITE_NEW_FEATURE=true  # Description of the feature
```

2. Add TypeScript type in `src/vite-env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly VITE_NEW_FEATURE: string;
  // ... other variables
}
```

3. Add to `src/config.ts`:

```typescript
export const config = {
  features: {
    newFeature: import.meta.env.VITE_NEW_FEATURE === 'true',
  },
};
```

### Node API Variable

1. Add to `.env.example`
2. Add validation in `api/config.ts`:

```typescript
export const env = cleanEnv(process.env, {
  NEW_VAR: str({ default: 'value' }),
});
```

### Python API Variable

1. Add to `.env.example`
2. Add to `python/config.py`:

```python
class Settings(BaseSettings):
    new_var: str = "default_value"
```

## Troubleshooting

### Variables Not Loading

1. Check `.env` file exists
2. Restart dev servers after changing `.env`
3. Verify variable names (especially `VITE_` prefix for frontend)
4. Check for syntax errors in `.env` file

### Type Errors

1. Update TypeScript definitions in `src/vite-env.d.ts`
2. Restart TypeScript server in VS Code
3. Check config file imports

### Validation Errors

1. Check error message for missing/invalid variables
2. Verify `.env` has all required variables
3. Check variable types match expected format

## Tools & Packages

- **Vite**: Built-in environment variable support
- **dotenv**: Loads `.env` files in Node.js
- **envalid**: Validates Node.js environment variables
- **pydantic-settings**: Validates Python settings
- **cross-env**: Sets environment variables cross-platform

## Example Commands

```bash
# Development (uses .env)
npm run dev

# Production build
NODE_ENV=production npm run build

# Custom environment
cross-env VITE_API_URL=https://api.example.com npm run dev
```
