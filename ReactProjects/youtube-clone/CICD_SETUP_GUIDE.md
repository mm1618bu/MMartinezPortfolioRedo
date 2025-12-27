# CI/CD Pipeline Setup Guide

Complete guide for setting up and using the YouTube Clone CI/CD pipeline with GitHub Actions.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [Workflow Overview](#workflow-overview)
6. [Deployment Setup](#deployment-setup)
7. [Local Testing](#local-testing)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### Minimal Setup (5 minutes)

```bash
# 1. Make scripts executable
chmod +x scripts/ci-local.sh scripts/deploy.sh

# 2. Test locally before pushing
./scripts/ci-local.sh

# 3. Commit and push to trigger CI
git add .
git commit -m "feat: add CI/CD pipeline"
git push origin main
```

That's it! Your CI pipeline will now run automatically on every push and PR.

---

## 📦 Prerequisites

### Required
- Node.js 18.x or higher
- npm 8.x or higher
- Git repository hosted on GitHub
- GitHub account with repository access

### Optional (for deployment)
- Vercel account (for production deployment)
- Netlify account (for staging deployment)
- Supabase project with credentials

### Verify Prerequisites

```bash
node --version  # Should be 18.x+
npm --version   # Should be 8.x+
git --version   # Any recent version
```

---

## 🛠️ Initial Setup

### Step 1: Repository Setup

1. **Push workflows to GitHub**:
   ```bash
   git add .github/
   git commit -m "ci: add GitHub Actions workflows"
   git push origin main
   ```

2. **Enable GitHub Actions** (if not already enabled):
   - Go to your repo on GitHub
   - Navigate to **Settings** → **Actions** → **General**
   - Under "Actions permissions", select **Allow all actions and reusable workflows**
   - Click **Save**

### Step 2: Branch Protection (Recommended)

1. Go to **Settings** → **Branches**
2. Click **Add rule** for `main` branch
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select: `quality`, `build`, `test` as required checks
4. Click **Create**

---

## 🔐 GitHub Secrets Configuration

Secrets are stored in **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required Secrets for Deployment

#### Supabase Secrets
```
SUPABASE_URL
  → Your Supabase project URL
  → Example: https://xxxxx.supabase.co

SUPABASE_ANON_KEY
  → Your Supabase anonymous key
  → Found in: Project Settings → API → anon public

SUPABASE_SERVICE_ROLE_KEY
  → Your Supabase service role key (keep private!)
  → Found in: Project Settings → API → service_role secret
```

#### Vercel Secrets (for production)
```
VERCEL_TOKEN
  → Personal Access Token from Vercel
  → Get it: Vercel → Settings → Tokens → Create

VERCEL_ORG_ID
  → Your Vercel organization ID
  → Get it: Run `vercel whoami` or check Vercel dashboard URL

VERCEL_PROJECT_ID
  → Your project ID
  → Get it: Vercel → Project → Settings → General
```

#### Netlify Secrets (for staging)
```
NETLIFY_AUTH_TOKEN
  → Personal Access Token from Netlify
  → Get it: Netlify → User Settings → Applications → New access token

NETLIFY_SITE_ID
  → Your site ID
  → Get it: Netlify → Site → Settings → General → Site information
```

### How to Add Secrets

1. Navigate to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter **Name** (e.g., `SUPABASE_URL`)
5. Enter **Value** (paste your actual key)
6. Click **Add secret**
7. Repeat for each secret

### Verify Secrets Setup

After adding secrets, they should appear in the secrets list (values are hidden).

---

## 📊 Workflow Overview

### 1. CI Pipeline (`ci.yml`)

**Triggers**: Push or PR to `main` or `develop` branches

**Jobs**:
- **quality** (2-3 min): ESLint checks, syntax validation
- **build** (3-5 min): Create production build, upload artifacts
- **test** (2-4 min): Run Jest tests with coverage
- **security** (1-2 min): npm audit for vulnerabilities
- **dependencies** (1 min): Check for outdated packages
- **analyze** (1 min): Bundle size analysis
- **summary** (1 min): Generate pipeline report

**Total Runtime**: ~8-15 minutes

**View Results**:
- GitHub → Actions → Click workflow run
- Check job status and logs
- Download artifacts from summary page

### 2. Deployment Pipeline (`deploy.yml`)

**Triggers**: 
- Automatic: Push to `main` branch
- Manual: Actions tab → Deploy → Run workflow

**Jobs**:
- **build-production**: Optimized production build
- **deploy-vercel**: Deploy to Vercel (production)
- **deploy-netlify**: Deploy to Netlify (staging)
- **health-check**: Verify deployment health
- **rollback**: Revert to previous version (manual)
- **deployment-summary**: Deployment report

**Manual Trigger**:
```bash
# Via GitHub UI:
# 1. Go to Actions → Deploy
# 2. Click "Run workflow"
# 3. Select environment (production/staging)
# 4. Click "Run workflow" button

# Via GitHub CLI:
gh workflow run deploy.yml -f environment=production
```

### 3. Scheduled Jobs (`cron-jobs.yml`)

**Schedules**:
- **Daily Security Audit**: 2:00 AM UTC every day
- **Weekly Dependency Check**: 9:00 AM UTC every Monday
- **Cleanup**: Manual trigger only

**View Results**:
- GitHub → Actions → Filter by workflow
- Check artifacts for detailed reports

**Manual Trigger**:
```bash
# Via GitHub UI:
# Actions → Scheduled Jobs → Run workflow

# Via GitHub CLI:
gh workflow run cron-jobs.yml
```

### 4. PR Validation (`pr-checks.yml`)

**Triggers**: PR opened, updated, or reopened

**Jobs**:
- **validate**: Check PR title, description, conflicts
- **analyze-changes**: File analysis, test coverage check
- **build-preview**: Preview build with size report
- **size-impact**: Compare bundle size vs base branch
- **pr-summary**: Post comprehensive PR comment

**What You'll See**:
- Automated comment on PR with build info
- Status checks on PR page
- Size comparison and warnings

---

## 🌐 Deployment Setup

### Option A: Vercel Deployment (Recommended for Production)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Link Project
```bash
cd /path/to/youtube-clone
vercel link
```

#### 3. Get Project IDs
```bash
# Get organization and project ID
vercel project ls
# OR check .vercel/project.json after linking
cat .vercel/project.json
```

#### 4. Get Vercel Token
- Go to [Vercel Tokens](https://vercel.com/account/tokens)
- Click **Create**
- Name it "GitHub Actions"
- Copy the token
- Add to GitHub secrets as `VERCEL_TOKEN`

#### 5. Configure Environment Variables in Vercel
- Go to Vercel dashboard → Your Project
- Click **Settings** → **Environment Variables**
- Add:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_ANON_KEY`

#### 6. Uncomment Deployment Commands in `deploy.yml`

In `.github/workflows/deploy.yml`, find these lines and uncomment them:

```yaml
# Uncomment these lines after setting up Vercel:
# - name: Deploy to Vercel
#   run: |
#     vercel deploy --prod \
#       --token ${{ secrets.VERCEL_TOKEN }} \
#       --build-env REACT_APP_SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
#       --build-env REACT_APP_SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }}
```

Remove the `#` from the beginning of each line.

#### 7. Test Deployment
```bash
# Test manually first
vercel --prod

# Then push to trigger automated deployment
git push origin main
```

---

### Option B: Netlify Deployment (Recommended for Staging)

#### 1. Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### 2. Login and Link
```bash
netlify login
cd /path/to/youtube-clone
netlify init
```

#### 3. Get Site ID
```bash
# Check netlify.toml or run:
netlify status
```

#### 4. Get Auth Token
- Go to [Netlify Tokens](https://app.netlify.com/user/applications#personal-access-tokens)
- Click **New access token**
- Name it "GitHub Actions"
- Copy the token
- Add to GitHub secrets as `NETLIFY_AUTH_TOKEN`

#### 5. Configure Build Settings

Create or update `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  REACT_APP_SUPABASE_URL = "your-url-or-use-env-vars"
  REACT_APP_SUPABASE_ANON_KEY = "your-key-or-use-env-vars"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 6. Uncomment Deployment Commands in `deploy.yml`

Similar to Vercel, uncomment the Netlify deployment section in `deploy.yml`.

#### 7. Test Deployment
```bash
# Test manually first
netlify deploy --prod

# Then push to trigger automated deployment
git push origin develop  # or main
```

---

### Option C: Custom Deployment (AWS S3, Digital Ocean, etc.)

#### For AWS S3 + CloudFront:

1. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://your-youtube-clone-bucket
   aws s3 website s3://your-youtube-clone-bucket --index-document index.html
   ```

2. **Add AWS Credentials to GitHub Secrets**:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

3. **Update `deploy.yml`**:
   ```yaml
   - name: Deploy to S3
     run: |
       aws s3 sync build/ s3://your-youtube-clone-bucket/ --delete
       aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

---

## 🧪 Local Testing

### Test CI Pipeline Locally

```bash
# Run full CI check (recommended before every push)
./scripts/ci-local.sh

# Individual checks
npm run lint              # ESLint
npm run format:check      # Prettier
npm run test:ci           # Tests with coverage
npm run build             # Production build
npm audit                 # Security check
```

### Test Build Locally

```bash
# Create production build
npm run build

# Serve build locally
npx serve -s build -l 3000

# Open in browser
open http://localhost:3000
```

### Test Deployment Script

```bash
# Test deployment script (doesn't actually deploy)
./scripts/deploy.sh production
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "npm run lint" fails in CI

**Error**: `npm ERR! Missing script: "lint"`

**Solution**: Ensure `package.json` has lint script:
```json
"scripts": {
  "lint": "eslint src --ext .js,.jsx --max-warnings 0"
}
```

#### 2. Build fails with "Cannot find module"

**Error**: `Module not found: Can't resolve 'XYZ'`

**Solution**: 
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 3. Tests fail in CI but pass locally

**Error**: Tests timeout or fail randomly

**Solution**: Add to `package.json`:
```json
"jest": {
  "testTimeout": 10000,
  "maxWorkers": 2
}
```

#### 4. Deployment succeeds but site is blank

**Possible Causes**:
- Missing environment variables
- Incorrect routing configuration
- Build artifacts not uploaded correctly

**Solution**:
1. Check browser console for errors
2. Verify environment variables in deployment platform
3. Check deployment logs
4. Ensure build artifacts include `index.html`

#### 5. GitHub Actions workflow not triggering

**Possible Causes**:
- Workflow file has syntax errors
- Branch name doesn't match trigger conditions
- Actions are disabled in repository

**Solution**:
1. Validate YAML syntax: https://www.yamllint.com/
2. Check workflow file location: `.github/workflows/`
3. Verify Actions are enabled: Settings → Actions
4. Check workflow logs for errors

### Debug GitHub Actions

#### View Detailed Logs
1. Go to Actions tab
2. Click on failed workflow
3. Click on failed job
4. Expand each step to see detailed output

#### Enable Debug Logging
Add secrets to repository:
- `ACTIONS_STEP_DEBUG` = `true`
- `ACTIONS_RUNNER_DEBUG` = `true`

#### Re-run Failed Jobs
1. Go to failed workflow run
2. Click **Re-run jobs** → **Re-run failed jobs**

---

## ✅ Best Practices

### Code Quality

1. **Run CI locally before pushing**:
   ```bash
   ./scripts/ci-local.sh
   ```

2. **Fix lint errors automatically**:
   ```bash
   npm run lint:fix
   npm run format
   ```

3. **Keep test coverage high** (aim for >80%):
   ```bash
   npm run test:coverage
   ```

### Git Workflow

1. **Use conventional commits**:
   ```
   feat: add new video player controls
   fix: resolve video buffering issue
   docs: update README with deployment steps
   test: add tests for video upload
   ci: update GitHub Actions Node version
   ```

2. **Create feature branches**:
   ```bash
   git checkout -b feature/video-recommendations
   # Make changes
   git push origin feature/video-recommendations
   # Create PR on GitHub
   ```

3. **Keep main branch protected**:
   - Require PR reviews
   - Require status checks to pass
   - Require branch to be up to date

### Deployment Strategy

1. **Use semantic versioning**:
   ```bash
   git tag v1.0.0
   git push --tags
   ```

2. **Deploy to staging first**:
   ```bash
   git push origin develop  # Triggers staging deployment
   # Test staging site
   git push origin main     # Triggers production deployment
   ```

3. **Monitor deployments**:
   - Check deployment logs
   - Verify health checks pass
   - Monitor error tracking (e.g., Sentry)

4. **Rollback if needed**:
   ```bash
   # Via GitHub UI:
   # Actions → Deploy → Run workflow → Select "rollback"
   
   # Or manually:
   git revert HEAD
   git push origin main
   ```

### Security

1. **Never commit secrets**:
   - Use `.env` for local development
   - Use GitHub Secrets for CI/CD
   - Add `.env` to `.gitignore`

2. **Review security audit regularly**:
   ```bash
   npm audit
   npm audit fix  # Apply automatic fixes
   ```

3. **Keep dependencies updated**:
   ```bash
   npm outdated
   npm update
   ```

4. **Review PR checks before merging**:
   - Check security audit results
   - Review dependency changes
   - Verify no new vulnerabilities

---

## 📚 Additional Resources

### Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Netlify CLI Documentation](https://docs.netlify.com/cli/get-started/)
- [React Scripts Documentation](https://create-react-app.dev/docs/available-scripts/)

### Tools
- [YAML Linter](https://www.yamllint.com/) - Validate workflow syntax
- [Act](https://github.com/nektos/act) - Run GitHub Actions locally
- [GitHub CLI](https://cli.github.com/) - Manage workflows from terminal

### Monitoring
- [Sentry](https://sentry.io/) - Error tracking
- [LogRocket](https://logrocket.com/) - Session replay
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - Performance monitoring

---

## 🎯 Next Steps

1. ✅ Complete initial setup (secrets, branch protection)
2. ✅ Test CI pipeline with a commit
3. ✅ Set up deployment platform (Vercel/Netlify)
4. ✅ Configure deployment workflow
5. ✅ Test full deployment cycle
6. ✅ Set up monitoring and alerts
7. ✅ Document team workflows
8. ✅ Add status badges to README

### Status Badge

Add to your README.md:
```markdown
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Deploy/badge.svg)
```

---

## 💡 Tips

- **Start simple**: Get basic CI working first, then add deployment
- **Test locally**: Always run `./scripts/ci-local.sh` before pushing
- **Monitor costs**: Check GitHub Actions minutes usage (free tier: 2000 min/month)
- **Use caching**: Workflows already cache `node_modules` for speed
- **Keep workflows fast**: Optimize build times and run jobs in parallel
- **Document changes**: Update this guide when you modify workflows

---

## 📞 Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review GitHub Actions logs
3. Search [GitHub Actions Community](https://github.community/c/actions/)
4. Open an issue in your repository

---

**Last Updated**: January 2025
**Pipeline Version**: 1.0.0
