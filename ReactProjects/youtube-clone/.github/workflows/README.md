# GitHub Actions Workflows

This directory contains all CI/CD workflows for the YouTube Clone project.

## 📁 Workflow Files

### [`ci.yml`](./ci.yml) - Main CI Pipeline
**Purpose**: Continuous Integration for all code changes

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs** (runs in parallel where possible):
1. **quality**: Code quality checks (ESLint, syntax validation)
2. **build**: Production build with artifact upload
3. **test**: Unit tests with coverage reports
4. **security**: Security vulnerability scanning
5. **dependencies**: Check for outdated packages
6. **analyze**: Bundle size analysis
7. **summary**: Aggregate results and generate report

**Runtime**: ~8-15 minutes

**Artifacts**:
- `eslint-report.txt` (7 days)
- `build-artifacts/` (7 days)
- `coverage/` (30 days)
- `security-audit-report.txt` (30 days)
- `dependency-report.txt` (7 days)
- `bundle-analysis.txt` (7 days)

---

### [`deploy.yml`](./deploy.yml) - Deployment Pipeline
**Purpose**: Automated deployment to production/staging

**Triggers**:
- Push to `main` branch (automatic)
- Manual workflow dispatch with environment selection

**Jobs**:
1. **build-production**: Create optimized production build
2. **deploy-vercel**: Deploy to Vercel (production)
3. **deploy-netlify**: Deploy to Netlify (staging)
4. **health-check**: Verify deployment health
5. **rollback**: Revert to previous version (manual only)
6. **deployment-summary**: Generate deployment report

**Runtime**: ~5-10 minutes

**Environments**:
- `production` (main branch)
- `staging` (manual trigger)
- `rollback` (manual trigger)

**Required Secrets**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN` (for Vercel deployment)
- `VERCEL_ORG_ID` (for Vercel deployment)
- `VERCEL_PROJECT_ID` (for Vercel deployment)
- `NETLIFY_AUTH_TOKEN` (for Netlify deployment)
- `NETLIFY_SITE_ID` (for Netlify deployment)

---

### [`cron-jobs.yml`](./cron-jobs.yml) - Scheduled Maintenance
**Purpose**: Automated security and maintenance tasks

**Triggers**:
- Daily: Security audit at 2:00 AM UTC
- Weekly: Dependency check at 9:00 AM UTC on Mondays
- Manual: Workflow cleanup (on-demand)

**Jobs**:
1. **daily-security-audit**: 
   - Runs `npm audit`
   - Flags critical/high vulnerabilities
   - Uploads audit report

2. **weekly-dependency-check**:
   - Runs `npm outdated`
   - Lists outdated packages
   - Generates update recommendations

3. **cleanup-workflow-runs**:
   - Deletes old workflow runs (>30 days)
   - Manual trigger only
   - Frees up storage space

**Artifacts**:
- `security-report.txt` (90 days)
- `dependency-report.txt` (90 days)

---

### [`pr-checks.yml`](./pr-checks.yml) - Pull Request Validation
**Purpose**: Automated PR quality checks and reporting

**Triggers**:
- Pull request opened
- Pull request synchronized (new commits)
- Pull request reopened

**Jobs**:
1. **validate**:
   - Check PR title format (conventional commits)
   - Verify PR description exists
   - Detect merge conflicts

2. **analyze-changes**:
   - Count changed files by type
   - Check if tests were added with code changes
   - Generate file change report

3. **build-preview**:
   - Build preview version
   - Calculate build size
   - Post build info comment on PR

4. **size-impact**:
   - Compare bundle size with base branch
   - Show size difference and percentage
   - Warn if increase > 512KB

5. **pr-summary**:
   - Post comprehensive summary comment
   - Include all job results
   - Show PR metadata

**What You'll See**:
- ✅ Status checks on PR page
- 💬 Automated comments with build info and size comparison
- ⚠️ Warnings for large size increases or missing tests

---

## 🚀 Quick Start

### First-Time Setup

1. **Configure GitHub Secrets**:
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add all required secrets (see [CICD_SETUP_GUIDE.md](../CICD_SETUP_GUIDE.md))

2. **Push workflows to GitHub**:
   ```bash
   git add .github/
   git commit -m "ci: add GitHub Actions workflows"
   git push origin main
   ```

3. **Verify workflows are running**:
   - Go to: Repository → Actions
   - Check for running workflows

### Daily Usage

**Before pushing code**:
```bash
# Test CI pipeline locally
./scripts/ci-local.sh
```

**Creating a PR**:
- PR will automatically trigger validation checks
- Wait for all checks to pass (green ✅)
- Review automated comments for build info

**Deploying**:
```bash
# Automatic on push to main
git push origin main

# Or manual deployment
# GitHub → Actions → Deploy → Run workflow
```

---

## 🔍 Monitoring Workflows

### View Workflow Status

**In GitHub UI**:
1. Go to **Actions** tab
2. Click on workflow name
3. View recent runs

**In Terminal** (requires GitHub CLI):
```bash
# List recent workflow runs
gh run list

# View specific workflow
gh run view <run-id>

# Watch workflow in real-time
gh run watch
```

### Check Artifacts

1. Go to completed workflow run
2. Scroll to **Artifacts** section
3. Download artifacts for review

### View Logs

1. Click on workflow run
2. Click on job name
3. Expand steps to see detailed logs

---

## 🐛 Troubleshooting

### Workflow not triggering

**Check**:
- YAML syntax is valid
- Branch name matches trigger conditions
- Actions are enabled in repository settings

**Solution**:
```bash
# Validate YAML
yamllint .github/workflows/*.yml

# Check GitHub Actions status
gh workflow list
```

### Workflow failing

**Common Issues**:

1. **Missing secrets**: Add required secrets in repository settings
2. **Lint errors**: Run `npm run lint:fix` locally
3. **Test failures**: Run `npm test` locally to debug
4. **Build errors**: Run `npm run build` locally to reproduce

**Debug Steps**:
```bash
# Run local CI check
./scripts/ci-local.sh

# If passes locally but fails in CI, check:
# - Node version (should be 18.x)
# - Environment variables
# - File permissions
```

### Deployment failing

**Check**:
1. All deployment secrets are configured
2. Deployment platform credentials are valid
3. Build artifacts were created successfully
4. Deployment commands are uncommented in `deploy.yml`

**Manual Test**:
```bash
# Test deployment script locally
./scripts/deploy.sh production
```

---

## ⚙️ Configuration

### Customizing Workflows

#### Change Node Version
Edit the `NODE_VERSION` environment variable in each workflow:
```yaml
env:
  NODE_VERSION: '18.x'  # Change to '20.x' if needed
```

#### Adjust Artifact Retention
```yaml
- uses: actions/upload-artifact@v4
  with:
    retention-days: 7  # Change to desired number of days
```

#### Modify Trigger Branches
```yaml
on:
  push:
    branches:
      - main
      - develop
      - feature/*  # Add pattern for feature branches
```

#### Add Environment Variables
```yaml
- name: Build
  run: npm run build
  env:
    REACT_APP_CUSTOM_VAR: ${{ secrets.CUSTOM_VAR }}
```

### Disabling Workflows

To temporarily disable a workflow without deleting it:

1. Go to: Actions → Select workflow → **···** → Disable workflow
2. Or add to top of workflow file:
   ```yaml
   # Workflow temporarily disabled
   on: []
   ```

---

## 📊 Workflow Metrics

### Performance Targets

| Workflow | Target Runtime | Typical Cost (minutes) |
|----------|----------------|------------------------|
| CI | < 15 min | ~12 min |
| Deploy | < 10 min | ~8 min |
| PR Checks | < 10 min | ~9 min |
| Security Audit | < 5 min | ~3 min |

**Total Monthly Usage** (estimate):
- 50 commits/month × 12 min = 600 minutes
- 20 PRs/month × 9 min = 180 minutes
- 30 security audits × 3 min = 90 minutes
- **Total: ~870 minutes/month** (well within free tier of 2000 min)

### Optimization Tips

1. **Cache dependencies**: Already implemented ✅
2. **Run jobs in parallel**: Already implemented ✅
3. **Skip redundant builds**: Use `paths` filter
4. **Fail fast**: Set `fail-fast: true` for matrix builds

---

## 🔒 Security

### Secrets Management

**Never commit secrets to repository**. Always use GitHub Secrets.

**Best Practices**:
- Rotate secrets regularly
- Use least-privilege access tokens
- Audit secret usage in workflows
- Delete unused secrets

### Permissions

Workflows use default permissions:
- Read access to repository
- Write access to Actions, Checks, Pull Requests
- No access to Issues, Packages, or other resources

To modify permissions, add to workflow:
```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write
```

---

## 📝 Workflow Patterns

### Running Tests Only on Changed Files

Add to workflow:
```yaml
- name: Get changed files
  id: changed-files
  uses: tj-actions/changed-files@v40

- name: Run tests
  if: steps.changed-files.outputs.any_changed == 'true'
  run: npm test -- ${{ steps.changed-files.outputs.all_changed_files }}
```

### Matrix Builds (Multiple Node Versions)

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

### Conditional Jobs

```yaml
jobs:
  build:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps: ...
```

---

## 🎯 Maintenance

### Regular Tasks

**Weekly**:
- Review security audit reports
- Check for outdated dependencies
- Monitor workflow runtime trends

**Monthly**:
- Review and clean up old artifacts
- Update workflow actions to latest versions
- Rotate API tokens and secrets

**Quarterly**:
- Review and optimize workflow performance
- Update Node.js version if needed
- Review and update this documentation

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Marketplace Actions](https://github.com/marketplace?type=actions)
- [CI/CD Setup Guide](../CICD_SETUP_GUIDE.md)

---

## 🆘 Getting Help

1. Check [CICD_SETUP_GUIDE.md](../CICD_SETUP_GUIDE.md) for detailed setup instructions
2. Review workflow logs in Actions tab
3. Search [GitHub Actions Community](https://github.community/c/actions/)
4. Check workflow file comments for inline documentation

---

**Last Updated**: January 2025  
**Maintained By**: Development Team
