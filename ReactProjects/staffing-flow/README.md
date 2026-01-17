# Staffing Flow

![CI Pipeline](https://github.com/mm1618bu/MMartinezPortfolioRedo/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/mm1618bu/MMartinezPortfolioRedo/actions/workflows/deploy.yml/badge.svg)

A full-stack staffing management application with TypeScript frontend/API and Python backend.

## Tech Stack

### Frontend

- React 19 with TypeScript
- Vite for build tooling
- ESLint for code quality

### Backend APIs

- **Node/TypeScript API**: Express server (Port 3001)
- **Python API**: FastAPI server (Port 8000)

### Python Tooling

- **Black**: Code formatter
- **Ruff**: Fast Python linter
- **Pytest**: Testing framework with coverage

## Project Structure

```
staffing-flow/
├── src/                    # React frontend (TypeScript)
├── api/                    # Node/Express API (TypeScript)
├── python/                 # Python FastAPI backend
├── tests/                  # Python tests
├── tsconfig.*.json         # TypeScript configurations
├── pyproject.toml          # Python project configuration
└── requirements*.txt       # Python dependencies
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn

### Installation

1. Install Node dependencies:

```bash
npm install
```

2. Install Python dependencies:

```bash
# Install development dependencies (includes black, ruff, pytest)
pip install -r requirements-dev.txt

# Or use make
make install-dev
```

3. Configure environment variables:

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

See [ENV_GUIDE.md](ENV_GUIDE.md) for detailed environment variable documentation.

### Development

Run all services concurrently:

```bash
npm run dev
```

This starts:

- Frontend (Vite): http://localhost:5173
- Node API (Express): http://localhost:3001
- Python API (FastAPI): http://localhost:8000

Or run services individually:

```bash
npm run dev:web      # Frontend only
npm run dev:api      # Node API only
npm run dev:python   # Python API only
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment.

### CI Pipeline

Runs on every push and pull request:

- ✅ Linting (ESLint, Ruff, Prettier)
- ✅ Type checking (TypeScript)
- ✅ Testing (Pytest)
- ✅ Building (Frontend, Node API, Python API)
- ✅ Security scanning

### Local CI Simulation

Test CI checks locally before pushing:

```bash
# Run all CI checks
./scripts/ci-local.sh

# Or run individual checks
npm run lint
npm run type-check
make test-cov
npm run build
```

See [CI_GUIDE.md](CI_GUIDE.md) for complete CI/CD documentation.

## Code Quality

### Formatting

```bash
npm run format              # Format JS/TS files with Prettier
npm run format:check        # Check formatting without changes
make format                 # Format Python files with Black
```

### Linting

```bash
npm run lint                # Lint all (JS/TS + Python)
npm run lint:js             # Lint JavaScript/TypeScript only
npm run lint:fix            # Lint and auto-fix JS/TS issues
npm run lint:python         # Lint Python only
make lint                   # Lint Python with Ruff
make lint-fix               # Lint Python and auto-fix
```

### Pre-commit Hooks

The project uses Husky and lint-staged for automatic code quality checks:

- **pre-commit**: Runs lint-staged to format and lint staged files
- **pre-push**: Runs TypeScript type checking
- **post-checkout**: Auto-installs dependencies when switching branches

Files are automatically formatted and linted before each commit:

- JS/TS files: ESLint + Prettier
- Python files: Black + Ruff
- JSON/CSS/MD files: Prettier

## Python Development

### Code Formatting

```bash
make format
# or
black python tests
```

### Linting

```bash
make lint
# or
ruff check python tests

# Auto-fix issues
make lint-fix
```

### Testing

```bash
# Run tests
make test
# or
pytest

# Run with coverage
make test-cov
# or
pytest --cov=python --cov-report=html
```

### Available Make Commands

```bash
make help          # Show all available commands
make install       # Install production dependencies
make install-dev   # Install development dependencies
make format        # Format code with black
make lint          # Lint code with ruff
make lint-fix      # Lint and auto-fix issues
make test          # Run tests
make test-cov      # Run tests with coverage
make clean         # Clean up cache files
```

## NPM Scripts

```bash
npm run dev              # Run all services
npm run dev:web          # Run frontend only
npm run dev:api          # Run Node API only
npm run dev:python       # Run Python API only
npm run build            # Build all
npm run build:web        # Build frontend
npm run build:api        # Build Node API
npm run lint             # Lint all (JS/TS + Python)
npm run lint:js          # Lint JavaScript/TypeScript
npm run lint:fix         # Auto-fix JS/TS lint issues
npm run lint:python      # Lint Python
npm run format           # Format JS/TS/JSON/CSS/MD files
npm run format:check     # Check formatting
npm run format:python    # Format Python code
npm run test:python      # Run Python tests
npm run type-check       # Type check all TypeScript
npm run type-check:web   # Type check frontend
npm run type-check:api   # Type check Node API
```

## Configuration Files

- `tsconfig.json` - Root TypeScript configuration
- `tsconfig.web.json` - Frontend TypeScript config
- `tsconfig.api.json` - Node API TypeScript config
- `tsconfig.node.json` - Build tooling TypeScript config
- `pyproject.toml` - Python project config (black, ruff, pytest)
- `.prettierrc` - Prettier configuration
- `.eslintrc.config.js` - ESLint configuration
- `.env.example` - Environment variable template
- `.env` - Environment variables (git-ignored)
- `src/config.ts` - Frontend configuration
- `api/config.ts` - Node API configuration
- `python/config.py` - Python API configuration
- `.vscode/settings.json` - VS Code editor settings
- `.vscode/extensions.json` - Recommended VS Code extensions
- `.python-version` - Python version specification
- `.husky/` - Git hooks for pre-commit, pre-push, post-checkout

See [ENV_GUIDE.md](ENV_GUIDE.md) for environment variable documentation.

## API Endpoints

### Node API (Port 3001)

- `GET /api/health` - Health check
- `GET /api/staff` - Get staff list

### Python API (Port 8000)

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/staff` - Get staff list
- `GET /docs` - Interactive API documentation (FastAPI auto-generated)

## License

Private
