# GitHub Actions CI/CD Workflows

This directory contains automated CI/CD pipelines for the TripSync project.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Lint Job
- Runs ESLint to check code quality
- Ensures code follows project style guidelines
- Fails the build if linting errors are found

#### Test Job
- Runs the complete test suite
- Generates code coverage reports
- Uploads coverage to Codecov (optional)
- Runs in CI mode with `--watchAll=false`

#### Build Job
- Verifies the application builds successfully
- Depends on lint and test jobs passing
- Creates production-ready build artifacts
- Uploads build artifacts for 7 days
- Reports build size

#### Status Check Job
- Aggregates results from all jobs
- Provides a single status check for branch protection
- Fails if any previous job failed

### 2. PR Checks (`pr-checks.yml`)

**Triggers:**
- Pull request opened, synchronized, or reopened
- Only runs if changes affect `tripsync/` directory

**Jobs:**

#### PR Validation
- **PR Title Check**: Validates PR titles follow conventional commits format
  - Valid formats: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `perf:`
  - Optional scope: `feat(auth): add login`
- **TODO Check**: Identifies TODO/FIXME/HACK comments in code
- **Linting**: Runs ESLint checks
- **Testing**: Executes full test suite with coverage
- **Build**: Verifies production build
- **Bundle Size**: Reports JavaScript bundle sizes
- **PR Comment**: Posts automated comment with coverage and build status

#### Dependency Check
- Runs `npm audit` for security vulnerabilities
- Checks for outdated dependencies
- Non-blocking (doesn't fail the PR)

## Node.js Version

All workflows use **Node.js 18** with npm caching enabled for faster builds.

## Setting Up Branch Protection

To require these checks before merging, configure branch protection rules:

1. Go to repository Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass before merging"
4. Select required checks:
   - Code Quality & Linting
   - Run Tests
   - Build Verification
   - PR Validation

## Codecov Integration (Optional)

To enable code coverage reporting:

1. Sign up at [codecov.io](https://codecov.io)
2. Add repository to Codecov
3. Add `CODECOV_TOKEN` to repository secrets (if private repo)

## GitHub Token Permissions

The PR comment feature requires write permissions. Ensure workflow permissions are set:

Settings → Actions → General → Workflow permissions → "Read and write permissions"

## Local Testing

Before pushing, run these commands locally:

```bash
cd tripsync

# Install dependencies
npm ci

# Run linting
npm run lint

# Run tests
npm test -- --coverage --watchAll=false

# Build
npm run build
```

## Customization

### Adjust Code Coverage Thresholds

Edit the test script in `package.json` to add coverage thresholds:

```json
"test": "react-scripts test --coverage --coverageThreshold='{\"global\":{\"lines\":80}}'"
```

### Change Node.js Version

Update the `node-version` in both workflow files if your project requires a different version.

### Add Deployment

To add automated deployment to the CI pipeline, add a new job to `ci.yml`:

```yaml
deploy:
  name: Deploy to Production
  runs-on: ubuntu-latest
  needs: [build]
  if: github.ref == 'refs/heads/main'
  steps:
    - name: Deploy
      run: |
        # Add your deployment commands here
```

## Troubleshooting

### Workflow Not Triggering

- Ensure workflows are on the correct branch
- Check if paths match your changes
- Verify repository has Actions enabled

### Build Failures

- Check Node.js version compatibility
- Ensure `package-lock.json` is committed
- Verify environment variables are set

### Permission Errors

- Check workflow permissions in repository settings
- Ensure GitHub token has necessary scopes
