# GitHub Actions Status

## Current Workflows

### Main CI Pipeline

- **File:** `.github/workflows/ci.yml`
- **Status:** ![CI](https://github.com/mm1618bu/MMartinezPortfolioRedo/actions/workflows/ci.yml/badge.svg)
- **Triggers:** Push to main/develop, Pull Requests
- **Jobs:** Lint, Type Check, Test, Build, Security Scan

### Deploy Pipeline

- **File:** `.github/workflows/deploy.yml`
- **Status:** ![Deploy](https://github.com/mm1618bu/MMartinezPortfolioRedo/actions/workflows/deploy.yml/badge.svg)
- **Triggers:** Push to main, Version tags
- **Jobs:** Build & Deploy to Production

### Nightly Tests

- **File:** `.github/workflows/nightly.yml`
- **Triggers:** Daily at 2 AM UTC, Manual dispatch
- **Jobs:** Extended testing across Node/Python versions

### PR Checks

- **File:** `.github/workflows/pr-checks.yml`
- **Triggers:** Pull Request events
- **Jobs:** PR quality checks, file size validation

## Viewing Workflow Runs

Visit: [https://github.com/mm1618bu/MMartinezPortfolioRedo/actions](https://github.com/mm1618bu/MMartinezPortfolioRedo/actions)

## Testing Locally

```bash
# Full CI simulation
npm run ci

# Quick checks (essential only)
npm run ci:quick

# Individual checks
npm run lint
npm run type-check
npm run test
npm run build
```

## Workflow Status

| Workflow    | Last Run | Duration   | Status |
| ----------- | -------- | ---------- | ------ |
| CI Pipeline | -        | ~10-15 min | -      |
| Deploy      | -        | ~5-8 min   | -      |
| Nightly     | -        | ~20-30 min | -      |
| PR Checks   | -        | ~3-5 min   | -      |

## Failed Build Recovery

If a workflow fails:

1. Check the workflow run logs
2. Run checks locally: `npm run ci`
3. Fix issues and commit
4. Re-run failed jobs (if transient failure)

## Manual Workflow Dispatch

Trigger workflows manually from GitHub Actions tab:

- Go to Actions → Select workflow → Run workflow
