# 🚀 CI/CD Quick Reference Card

Keep this handy for daily development!

---

## ⚡ Essential Commands

```bash
# Before every commit
./scripts/ci-local.sh           # Test CI pipeline locally (2-3 min)

# Code quality
npm run lint                    # Check for errors
npm run lint:fix               # Auto-fix lint errors
npm run format                 # Format code with Prettier
npm run format:check           # Check formatting without changing files

# Testing
npm test                       # Run tests in watch mode
npm run test:ci               # Run all tests once (CI mode)
npm run test:coverage         # Run tests with coverage report

# Building
npm run build                  # Create production build
npm run analyze               # Analyze bundle size

# Deployment
./scripts/deploy.sh production  # Deploy to production
./scripts/deploy.sh staging    # Deploy to staging
```

---

## 🔗 Quick Links

| Resource | Location |
|----------|----------|
| **Workflows** | `.github/workflows/` |
| **Setup Guide** | [CICD_SETUP_GUIDE.md](CICD_SETUP_GUIDE.md) |
| **Checklist** | [CHECKLIST.md](CHECKLIST.md) |
| **Architecture** | [CICD_ARCHITECTURE.md](CICD_ARCHITECTURE.md) |
| **GitHub Actions** | `https://github.com/YOUR_REPO/actions` |

---

## 📋 Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** | Push/PR to main/develop | Quality checks, tests, build |
| **Deploy** | Push to main (auto) / Manual | Production deployment |
| **PR Checks** | PR opened/updated | Validate PR, size analysis |
| **Cron Jobs** | Daily 2AM / Weekly Mon 9AM | Security, dependencies |

---

## ✅ Pre-Commit Checklist

Before `git push`, ensure:
- [ ] `./scripts/ci-local.sh` passes
- [ ] All tests pass locally
- [ ] No ESLint errors
- [ ] Code is formatted (Prettier)
- [ ] Commit message follows convention (feat:, fix:, docs:, etc.)

---

## 🎯 Commit Convention

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code restructuring
test: adding or updating tests
ci: CI/CD changes
chore: maintenance tasks
```

---

## 🚨 When CI Fails

1. **Check the logs** on GitHub Actions tab
2. **Run locally**: `./scripts/ci-local.sh`
3. **Common fixes**:
   - Lint errors: `npm run lint:fix`
   - Format issues: `npm run format`
   - Test failures: `npm test` and fix
   - Build errors: Check console output

---

## 📊 Status Indicators

| Symbol | Meaning |
|--------|---------|
| ✅ | All checks passed |
| ❌ | Some checks failed |
| ⚪ | Checks in progress |
| ⚠️ | Warning (non-blocking) |

---

## 🔐 Required Secrets

For deployment to work, add these in GitHub:

**Supabase** (Required):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Vercel** (Optional):
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Netlify** (Optional):
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

Add at: **Settings → Secrets and variables → Actions**

---

## 📈 Success Metrics

- ✅ CI completion < 15 minutes
- ✅ All tests passing
- ✅ Test coverage > 80%
- ✅ No critical vulnerabilities
- ✅ Build size reasonable
- ✅ Deployments successful

---

## 🆘 Emergency Commands

```bash
# Rollback deployment (GitHub UI)
# Actions → Deploy → Run workflow → Select "rollback"

# Or revert commit
git revert HEAD
git push origin main

# Force re-run CI
git commit --allow-empty -m "ci: trigger rebuild"
git push

# Skip CI (use sparingly!)
git commit -m "docs: update README [skip ci]"
```

---

## 🎓 Learning Path

1. ✅ Read [CICD_SETUP_GUIDE.md](CICD_SETUP_GUIDE.md) (15 min)
2. ✅ Configure GitHub secrets (5 min)
3. ✅ Test CI locally: `./scripts/ci-local.sh` (3 min)
4. ✅ Make first commit and watch CI run (15 min)
5. ✅ Create test PR and see checks (10 min)
6. ✅ Review [CICD_ARCHITECTURE.md](CICD_ARCHITECTURE.md) (10 min)

---

## 💡 Pro Tips

- **Always test locally first** - Faster feedback, saves CI minutes
- **Use feature branches** - Keep main stable
- **Review PR checks** - Don't ignore warnings
- **Monitor bundle size** - Keep builds lean
- **Fix security issues** - Check daily audit reports
- **Update dependencies** - Review weekly reports

---

## 📞 Getting Help

1. Check [CICD_SETUP_GUIDE.md](CICD_SETUP_GUIDE.md) troubleshooting section
2. Review GitHub Actions logs
3. Run `./scripts/ci-local.sh` to reproduce locally
4. Check workflow README: `.github/workflows/README.md`

---

## 🎉 You're Ready!

With this CI/CD pipeline, you can:
- ✅ Deploy with confidence
- ✅ Catch bugs early
- ✅ Maintain code quality
- ✅ Ship faster
- ✅ Sleep better 😴

---

**Keep calm and let CI/CD do the heavy lifting!** 🚀

---

*Print this card or bookmark it for quick reference!*
