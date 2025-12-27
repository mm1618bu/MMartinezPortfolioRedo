# CI/CD Setup Checklist

Quick reference checklist for setting up and verifying your CI/CD pipeline.

---

## 📋 Initial Setup (5-10 minutes)

### 1. Prerequisites
- [ ] Node.js 18.x+ installed (`node --version`)
- [ ] npm 8.x+ installed (`npm --version`)
- [ ] Git repository on GitHub
- [ ] GitHub account with repository access

### 2. Script Permissions
```bash
chmod +x scripts/ci-local.sh scripts/deploy.sh
```
- [ ] Scripts are executable

### 3. Test Locally
```bash
./scripts/ci-local.sh
```
- [ ] Lint checks pass
- [ ] Format checks pass
- [ ] Tests pass
- [ ] Build succeeds
- [ ] No critical security vulnerabilities

### 4. Commit and Push
```bash
git add .
git commit -m "ci: add CI/CD pipeline"
git push origin main
```
- [ ] Committed to Git
- [ ] Pushed to GitHub

### 5. Verify GitHub Actions
- [ ] Go to GitHub → Actions tab
- [ ] See "CI" workflow running
- [ ] Wait for completion (~8-15 minutes)
- [ ] All jobs pass ✅

---

## 🔐 GitHub Secrets Configuration (5 minutes)

Navigate to: **GitHub Repository → Settings → Secrets and variables → Actions**

### Required Secrets
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Your Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### Optional (For Deployment)
- [ ] `VERCEL_TOKEN` - Vercel personal access token
- [ ] `VERCEL_ORG_ID` - Vercel organization ID
- [ ] `VERCEL_PROJECT_ID` - Vercel project ID
- [ ] `NETLIFY_AUTH_TOKEN` - Netlify personal access token
- [ ] `NETLIFY_SITE_ID` - Netlify site ID

**How to add**:
1. Click "New repository secret"
2. Enter name (e.g., `SUPABASE_URL`)
3. Paste value
4. Click "Add secret"
5. Repeat for each secret

---

## 🛡️ Branch Protection (2 minutes)

Navigate to: **GitHub Repository → Settings → Branches**

- [ ] Click "Add rule" for `main` branch
- [ ] Enable "Require status checks to pass before merging"
- [ ] Enable "Require branches to be up to date before merging"
- [ ] Select required checks:
  - [ ] `quality`
  - [ ] `build`
  - [ ] `test`
- [ ] Click "Create"

---

## 🚀 Deployment Setup (15-30 minutes)

### Option A: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```
   - [ ] Vercel CLI installed

2. **Link Project**
   ```bash
   cd ReactProjects/youtube-clone
   vercel link
   ```
   - [ ] Project linked to Vercel

3. **Get Credentials**
   - [ ] Get Vercel token from [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - [ ] Get project ID from `.vercel/project.json`
   - [ ] Get org ID from Vercel dashboard

4. **Add to GitHub Secrets**
   - [ ] `VERCEL_TOKEN`
   - [ ] `VERCEL_ORG_ID`
   - [ ] `VERCEL_PROJECT_ID`

5. **Configure Environment Variables in Vercel**
   - [ ] Add `REACT_APP_SUPABASE_URL`
   - [ ] Add `REACT_APP_SUPABASE_ANON_KEY`

6. **Uncomment Deployment in deploy.yml**
   - [ ] Edit `.github/workflows/deploy.yml`
   - [ ] Uncomment Vercel deployment section
   - [ ] Commit and push changes

7. **Test Deployment**
   ```bash
   vercel --prod
   ```
   - [ ] Manual deployment works
   - [ ] Site is accessible
   - [ ] No errors in console

### Option B: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```
   - [ ] Netlify CLI installed

2. **Initialize Project**
   ```bash
   netlify login
   netlify init
   ```
   - [ ] Project initialized

3. **Get Credentials**
   - [ ] Get auth token from [app.netlify.com/user/applications](https://app.netlify.com/user/applications)
   - [ ] Get site ID from Netlify dashboard

4. **Add to GitHub Secrets**
   - [ ] `NETLIFY_AUTH_TOKEN`
   - [ ] `NETLIFY_SITE_ID`

5. **Create netlify.toml**
   - [ ] Configure build settings
   - [ ] Add redirects for SPA routing

6. **Uncomment Deployment in deploy.yml**
   - [ ] Edit `.github/workflows/deploy.yml`
   - [ ] Uncomment Netlify deployment section

7. **Test Deployment**
   ```bash
   netlify deploy --prod
   ```
   - [ ] Deployment successful

---

## 🧪 Workflow Testing

### Test CI Pipeline
- [ ] Push commit to main or develop
- [ ] Check Actions tab in GitHub
- [ ] Verify all 7 jobs complete:
  - [ ] quality ✅
  - [ ] build ✅
  - [ ] test ✅
  - [ ] security ✅
  - [ ] dependencies ✅
  - [ ] analyze ✅
  - [ ] summary ✅
- [ ] Download and review artifacts

### Test Deployment Pipeline
- [ ] Push commit to main
- [ ] Check Actions tab → Deploy workflow
- [ ] Verify jobs complete:
  - [ ] build-production ✅
  - [ ] deploy-vercel (or deploy-netlify) ✅
  - [ ] health-check ✅
- [ ] Visit deployed site
- [ ] Test functionality

### Test PR Checks
- [ ] Create feature branch
- [ ] Make changes and push
- [ ] Open pull request
- [ ] Wait for PR checks to complete
- [ ] Verify automated PR comment appears
- [ ] Check bundle size comparison
- [ ] Verify all checks pass ✅

### Test Scheduled Jobs
Manual trigger (no need to wait):
```bash
gh workflow run cron-jobs.yml
```
- [ ] Daily security audit runs
- [ ] Weekly dependency check runs
- [ ] Artifacts are generated

---

## 🎨 Developer Tools Setup

### VS Code Extensions (Recommended)
- [ ] ESLint (`dbaeumer.vscode-eslint`)
- [ ] Prettier (`esbenp.prettier-vscode`)
- [ ] EditorConfig (`editorconfig.editorconfig`)

### VS Code Settings
Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```
- [ ] Format on save enabled
- [ ] ESLint auto-fix enabled

---

## 📝 Documentation Updates

### Update README.md
- [ ] Replace `YOUR_USERNAME/YOUR_REPO` in badges
- [ ] Add your GitHub username and repo name
- [ ] Verify status badges appear correctly

### Review Documentation
- [ ] Read [CICD_SETUP_GUIDE.md](CICD_SETUP_GUIDE.md)
- [ ] Read [.github/workflows/README.md](.github/workflows/README.md)
- [ ] Bookmark for reference

---

## ✅ Verification Checklist

### CI/CD is Working When:
- [ ] ✅ Green checkmarks on commits in GitHub
- [ ] ✅ CI runs automatically on every push
- [ ] ✅ All tests pass in CI
- [ ] ✅ No ESLint errors
- [ ] ✅ Builds complete successfully
- [ ] ✅ No critical security vulnerabilities
- [ ] ✅ PRs get automated comments
- [ ] ✅ Deployments succeed automatically
- [ ] ✅ Scheduled jobs run on time
- [ ] ✅ Artifacts are generated and downloadable

### Quality Metrics
- [ ] Test coverage > 80%
- [ ] Build size < 5MB
- [ ] No ESLint warnings
- [ ] Code formatted with Prettier
- [ ] No npm audit vulnerabilities (critical/high)
- [ ] Dependencies up to date

---

## 🐛 Troubleshooting

### If CI Fails
1. [ ] Check GitHub Actions logs
2. [ ] Run `./scripts/ci-local.sh` locally
3. [ ] Fix errors shown in output
4. [ ] Run `npm run lint:fix` for lint errors
5. [ ] Run `npm run format` for formatting
6. [ ] Push again

### If Deployment Fails
1. [ ] Verify all secrets are configured
2. [ ] Check deployment logs in Actions tab
3. [ ] Test manual deployment locally
4. [ ] Verify environment variables in platform
5. [ ] Check deployment platform status page

### If Tests Fail
1. [ ] Run `npm test` locally
2. [ ] Fix failing tests
3. [ ] Run `npm run test:ci` to verify
4. [ ] Push again

### Common Issues
- [ ] **"npm run lint" fails**: Add lint script to package.json ✅ (already done)
- [ ] **Missing secrets**: Add all required secrets to GitHub
- [ ] **Build fails**: Check for missing dependencies or env vars
- [ ] **Tests timeout**: Increase test timeout in package.json

---

## 🎓 Team Onboarding

When a new developer joins:

- [ ] Share this checklist
- [ ] Grant GitHub repository access
- [ ] Provide Supabase credentials
- [ ] Install recommended VS Code extensions
- [ ] Clone repository and run `npm install`
- [ ] Run `./scripts/ci-local.sh` to verify setup
- [ ] Walk through [CICD_SETUP_GUIDE.md](CICD_SETUP_GUIDE.md)
- [ ] Make first PR to test workflow

---

## 📊 Success Indicators

Your CI/CD is successful when:

1. **Speed**: CI completes in < 15 minutes ⚡
2. **Reliability**: > 95% success rate 📈
3. **Automation**: Zero manual deployments 🤖
4. **Quality**: All checks pass before merge ✅
5. **Security**: Daily audits with no critical issues 🔒
6. **Visibility**: Team checks Actions tab regularly 👀
7. **Confidence**: Deploy to production without fear 🚀

---

## 🎯 Continuous Improvement

Monthly review:
- [ ] Check GitHub Actions usage (free tier: 2000 min/month)
- [ ] Review and optimize workflow runtime
- [ ] Update dependencies
- [ ] Review security audit reports
- [ ] Add new tests to increase coverage
- [ ] Update documentation
- [ ] Gather team feedback

---

## ✨ You're All Set!

Once all items are checked, your CI/CD pipeline is fully operational! 🎉

**Next**: Start building features with confidence, knowing your CI/CD pipeline has your back.

---

**Quick Commands Reference**:
```bash
# Test before pushing
./scripts/ci-local.sh

# Fix lint errors
npm run lint:fix

# Format code
npm run format

# Run tests with coverage
npm run test:coverage

# Build production
npm run build

# Manual deploy
./scripts/deploy.sh production
```

---

**Need Help?** Check [CICD_SETUP_GUIDE.md](CICD_SETUP_GUIDE.md) for detailed instructions.
