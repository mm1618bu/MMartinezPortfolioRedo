# CI/CD Pipeline Configuration

This document describes the CI/CD pipeline setup for the Staffing Flow project.

## Overview

The project uses **GitHub Actions** for continuous integration and deployment. The pipeline runs on every push and pull request to ensure code quality and catch issues early.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Lint & Format Check

- Runs Prettier format checking
- Runs ESLint for JavaScript/TypeScript
- Runs Ruff for Python linting
- Checks Black formatting for Python

#### TypeScript Type Check

- Type checks frontend code
- Type checks Node API code

#### Python Tests

- Runs pytest with coverage
- Uploads coverage reports to Codecov

#### Build Frontend

- Builds the React application
- Uploads build artifacts
- Sets production environment variables

#### Build Node API

- Compiles TypeScript API
- Uploads build artifacts

#### Build Python API

- Validates Python syntax
- Verifies all imports work

#### Security Scan

- Runs `npm audit` for Node.js dependencies
- Runs Bandit for Python security issues
- Continues on non-critical findings

#### CI Success

- Final job that depends on all others
- Fails if any required job fails

### 2. Deploy Pipeline (`deploy.yml`)

**Triggers:**

- Push to `main` branch
- Version tags (e.g., `v1.0.0`)

**Jobs:**

- Builds all components for production
- Creates deployment package
- Uploads artifacts for deployment
- Ready for deployment to hosting services

### 3. Nightly Tests (`nightly.yml`)

**Triggers:**

- Scheduled: Every day at 2 AM UTC
- Manual trigger via workflow dispatch

**Jobs:**

- Tests across multiple Node.js versions (18, 20, 22)
- Tests across multiple Python versions (3.10, 3.11, 3.12)
- Runs extended test suite
- Notifies on failure

### 4. PR Checks (`pr-checks.yml`)

**Triggers:**

- Pull request opened, synchronized, or reopened

**Jobs:**

- Checks for merge conflicts
- Identifies large files
- Lints only changed files
- Checks code complexity
- Comments on PR with results

## Status Badges

Add these to your README.md:

```markdown
![CI Pipeline](https://github.com/mm1618bu/MMartinezPortfolioRedo/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/mm1618bu/MMartinezPortfolioRedo/actions/workflows/deploy.yml/badge.svg)
```

## Local Testing

Before pushing, you can run the same checks locally:

```bash
# Run all linting
npm run lint
npm run format:check

# Run type checking
npm run type-check

# Run Python tests
make test-cov

# Build all components
npm run build
```

## Required Secrets

For deployment, configure these secrets in GitHub Settings > Secrets:

### Production Environment Variables

- `VITE_API_URL` - Production API endpoint
- `VITE_PYTHON_API_URL` - Production Python API endpoint

### Optional

- `CODECOV_TOKEN` - For coverage reports
- Deployment service credentials (AWS, Vercel, etc.)

## CI Performance

### Typical Run Times

- Lint & Format: ~2-3 minutes
- Type Check: ~1-2 minutes
- Python Tests: ~2-3 minutes
- Build Frontend: ~2-3 minutes
- Build API: ~1-2 minutes
- Total: ~10-15 minutes

### Optimization Tips

1. Use caching for dependencies (already configured)
2. Run jobs in parallel (already configured)
3. Skip CI for docs-only changes:
   ```
   git commit -m "docs: update README [skip ci]"
   ```

## Troubleshooting

### Build Fails on Environment Variables

**Problem:** Frontend build fails with missing VITE\_ variables

**Solution:** Ensure all VITE\_ variables are set in workflow or use defaults:

```yaml
env:
  VITE_API_URL: ${{ secrets.VITE_API_URL || 'http://localhost:3001' }}
```

### Tests Pass Locally but Fail in CI

**Problem:** Tests work on your machine but fail in GitHub Actions

**Solutions:**

1. Check Python/Node versions match
2. Verify all dependencies in requirements.txt/package.json
3. Check for environment-specific code
4. Use `npm ci` instead of `npm install`

### Slow CI Runs

**Problem:** CI takes too long to complete

**Solutions:**

1. Use dependency caching (already enabled)
2. Run linting on changed files only (PR workflow)
3. Skip jobs when not needed
4. Use matrix strategy for parallel testing

### Security Scan Failures

**Problem:** Security scans fail on known vulnerabilities

**Solutions:**

1. Update dependencies: `npm audit fix`
2. Review and accept risk: `continue-on-error: true`
3. Add exceptions in workflow configuration

## Branch Protection

Recommended branch protection rules for `main`:

1. ✅ Require pull request reviews (1 reviewer)
2. ✅ Require status checks to pass:
   - Lint & Format Check
   - TypeScript Type Check
   - Python Tests
   - Build Frontend
   - Build Node API
   - Build Python API
3. ✅ Require branches to be up to date
4. ✅ Require signed commits (optional)
5. ✅ Include administrators

## Deployment Strategy

### Staging Deployment

```yaml
on:
  push:
    branches: [develop]
```

### Production Deployment

```yaml
on:
  push:
    branches: [main]
    tags: ['v*.*.*']
```

### Manual Deployment

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - staging
          - production
```

## Monitoring & Notifications

### Slack Integration

Add Slack notifications on failure:

```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

GitHub automatically emails on workflow failures if you're watching the repo.

### Status Dashboard

View all workflow runs: `https://github.com/mm1618bu/MMartinezPortfolioRedo/actions`

## Best Practices

1. **Fast Feedback:** Critical jobs run first (linting, type checking)
2. **Parallel Execution:** Independent jobs run simultaneously
3. **Fail Fast:** Stop on first critical failure
4. **Caching:** Dependencies cached for faster runs
5. **Artifacts:** Build outputs saved for debugging
6. **Security:** Secrets never exposed in logs
7. **Versioning:** Use specific action versions (@v4, not @main)

## Maintenance

### Update Dependencies

```bash
# Update GitHub Actions
# Check: https://github.com/actions/setup-node/releases
# Update version in workflows: uses: actions/setup-node@v4
```

### Review Workflow Runs

Regularly check: `https://github.com/mm1618bu/MMartinezPortfolioRedo/actions`

### Clean Up Old Artifacts

Artifacts are automatically deleted after retention period (7-30 days).

## Future Enhancements

- [ ] Add integration tests
- [ ] Add end-to-end tests (Playwright/Cypress)
- [ ] Add performance benchmarks
- [ ] Add visual regression testing
- [ ] Add dependency update automation (Dependabot)
- [ ] Add automatic changelog generation
- [ ] Add semantic versioning automation
