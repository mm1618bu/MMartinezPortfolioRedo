# Backup & Recovery Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Prerequisites

```bash
# Install PostgreSQL client tools
sudo apt-get install postgresql-client

# Optional: Install Supabase CLI for storage backups
npm install -g supabase
```

### 2. Configure Environment

```bash
# Add to .env file (never commit this!)
SUPABASE_DB_PASSWORD=your_database_password
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Test Backup System

```bash
# Test database backup
./scripts/backup-database.sh

# Verify backup was created
./scripts/verify-backup.sh
```

## 📅 Daily Operations

### Running Backups

```bash
# Full backup (everything)
./scripts/backup-all.sh

# Database only
./scripts/backup-database.sh

# Storage only
./scripts/backup-storage.sh
```

### Checking Backup Status

```bash
# Verify all backups
./scripts/verify-backup.sh

# Check backup freshness
./scripts/check-backup-freshness.sh
```

## 🔄 Recovery Operations

### Restore Database

```bash
# Interactive restore
./scripts/restore-database.sh

# Options:
# 1. Type "latest" for most recent backup
# 2. Type specific filename
# 3. Confirm the restore operation
```

### View Available Backups

```bash
# List database backups
ls -lh backups/database/

# List storage backups
ls -lh backups/storage/

# View backup manifest
cat backups/manifest_*.json | jq '.'
```

## ⚙️ Automated Scheduling

### Option 1: Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * cd /path/to/youtube-clone && ./scripts/backup-all.sh
```

### Option 2: GitHub Actions

Already configured! See `.github/workflows/backup.yml`
- Runs daily automatically
- Can trigger manually from Actions tab
- Stores backups as artifacts

### Option 3: Manual Schedule

```bash
# Run manually whenever needed
./scripts/backup-all.sh
```

## 🚨 Emergency Recovery

### Quick Recovery Steps

1. **Assess the situation**
   ```bash
   # What's broken?
   # Database? Storage? Both?
   ```

2. **Restore database**
   ```bash
   ./scripts/restore-database.sh
   # Select: latest
   ```

3. **Verify application**
   ```bash
   # Test login, video playback, etc.
   ```

## 📊 Backup Locations

| Component | Location | Size (approx) |
|-----------|----------|---------------|
| Database | `backups/database/` | 10-50 MB |
| Storage | `backups/storage/` | 1-100 GB |
| Config | `backups/config/` | < 1 MB |
| Logs | `backups/*.log` | Variable |

## 💡 Best Practices

### DO ✅
- Run backups before major updates
- Test restore procedure monthly
- Keep backups in multiple locations
- Monitor backup success/failures
- Document any manual interventions

### DON'T ❌
- Commit `.env` files with credentials
- Store backups only locally
- Ignore backup failures
- Skip testing restore procedures
- Wait for disaster to learn the process

## 🔍 Troubleshooting

### "Permission denied" error

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### "pg_dump: command not found"

```bash
# Install PostgreSQL client
sudo apt-get install postgresql-client
```

### "Connection refused" to database

```bash
# Check .env file has correct credentials
cat .env | grep SUPABASE

# Verify network connectivity
ping your-supabase-host
```

### Backup file is huge

```bash
# Backups are compressed automatically
# Original: 500 MB → Compressed: 50 MB

# If still too large:
# - Implement incremental backups
# - Archive old data
# - Clean up test data
```

## 📞 Get Help

- **Documentation**: See `BACKUP_RECOVERY_PLAN.md`
- **Scripts**: Check `scripts/` directory
- **Logs**: Review `backups/*.log` files
- **Issues**: Create GitHub issue

## 🎯 Success Checklist

After setup, verify:
- [ ] Can create database backup
- [ ] Can create storage backup
- [ ] Can verify backup integrity
- [ ] Can restore from backup
- [ ] Automated schedule is working
- [ ] External storage configured (optional)
- [ ] Team knows recovery procedure

## ⏱️ Typical Times

| Operation | Duration |
|-----------|----------|
| Database backup | 1-5 min |
| Storage backup | 5-30 min |
| Complete backup | 10-45 min |
| Database restore | 2-10 min |
| Storage restore | 10-60 min |
| Verification | 1-2 min |

---

**Remember:** The best backup is the one you test regularly!

For comprehensive documentation, see [BACKUP_RECOVERY_PLAN.md](BACKUP_RECOVERY_PLAN.md)
