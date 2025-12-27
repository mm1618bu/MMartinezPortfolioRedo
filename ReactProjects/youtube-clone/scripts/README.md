# Backup & Recovery Scripts

This directory contains automated backup and recovery scripts for the YouTube Clone project.

## 📁 Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `backup-database.sh` | Backs up PostgreSQL database | `./scripts/backup-database.sh` |
| `backup-storage.sh` | Backs up Supabase storage buckets | `./scripts/backup-storage.sh` |
| `backup-all.sh` | Complete system backup | `./scripts/backup-all.sh` |
| `restore-database.sh` | Interactive database restore | `./scripts/restore-database.sh` |
| `verify-backup.sh` | Verify backup integrity | `./scripts/verify-backup.sh` |
| `check-backup-freshness.sh` | Alert if no recent backup | `./scripts/check-backup-freshness.sh` |

## 🚀 Quick Start

### 1. First-Time Setup

```bash
# Make scripts executable (already done)
chmod +x scripts/*.sh

# Create backup directories
mkdir -p backups/{database,storage,config,repository}

# Configure environment variables
cp .env.template .env
# Edit .env with your credentials
```

### 2. Test Backup System

```bash
# Run a test backup
./scripts/backup-database.sh

# Verify it worked
./scripts/verify-backup.sh
```

### 3. Set Up Automation

See `crontab.example` or `.github/workflows/backup.yml` for automated scheduling.

## 📖 Script Details

### backup-database.sh

**Purpose**: Creates compressed backup of PostgreSQL database

**Features**:
- Uses `pg_dump` for reliable backups
- Compresses with gzip (saves 80-90% space)
- Creates metadata file
- Auto-cleanup of old backups (30 days retention)
- Colored output for status

**Output**:
- `backups/database/youtube_clone_db_TIMESTAMP.sql.gz`
- `backups/database/youtube_clone_db_TIMESTAMP.meta`
- `backups/database/backup_TIMESTAMP.log`

**Requirements**:
- PostgreSQL client tools (`postgresql-client`)
- `SUPABASE_DB_PASSWORD` in `.env`

**Example**:
```bash
./scripts/backup-database.sh
# Output: ✓ Database backup completed successfully
# Backup size: 25M → Compressed: 2.5M
```

### backup-storage.sh

**Purpose**: Backs up Supabase storage buckets (videos, thumbnails, avatars)

**Features**:
- Backs up all storage buckets
- Creates tar.gz archives
- Generates manifest files
- Auto-cleanup old backups

**Output**:
- `backups/storage/videos/videos_TIMESTAMP.tar.gz`
- `backups/storage/thumbnails/thumbnails_TIMESTAMP.tar.gz`
- `backups/storage/backup_summary_TIMESTAMP.txt`

**Requirements**:
- Supabase CLI (optional but recommended)
- `REACT_APP_SUPABASE_URL` in `.env`

**Example**:
```bash
./scripts/backup-storage.sh
# Backs up: videos, thumbnails, avatars, channel-avatars
```

### backup-all.sh

**Purpose**: Complete system backup (database + storage + config + code)

**Features**:
- Runs all backup scripts
- Creates backup manifest (JSON)
- Comprehensive logging
- Status tracking

**Output**:
- All component backups
- `backups/manifest_TIMESTAMP.json`
- `backups/backup_TIMESTAMP.log`

**Example**:
```bash
./scripts/backup-all.sh
# [1/4] Backing up database...
# [2/4] Backing up storage files...
# [3/4] Backing up configuration...
# [4/4] Creating code repository snapshot...
# ✓ BACKUP COMPLETED SUCCESSFULLY
```

### restore-database.sh

**Purpose**: Interactive database restore utility

**Features**:
- Lists available backups
- Creates safety backup before restore
- Confirmation prompts
- Detailed logging

**Safety**:
- Always creates pre-restore backup
- Requires explicit confirmation
- Can restore from safety backup if needed

**Example**:
```bash
./scripts/restore-database.sh

# Available backups:
# 1. youtube_clone_db_20251227_140000.sql.gz (2.5M)
# 2. youtube_clone_db_20251226_140000.sql.gz (2.4M)

# Enter filename or 'latest': latest
# Are you sure? (yes/no): yes
# ✓ Database restored successfully!
```

### verify-backup.sh

**Purpose**: Verifies integrity of all backups

**Features**:
- Checks file existence and readability
- Verifies compression integrity
- Tests archive contents
- Checks backup freshness
- Monitors disk space

**Output**:
- Verification report with ✓/✗ for each check
- Summary statistics
- Recommendations

**Example**:
```bash
./scripts/verify-backup.sh

# Verifying database backups...
# ✓ Latest database backup: 2.5M
# ✓ Compression integrity verified
# ✓ Backup is fresh (12 hours old)

# Total checks: 15
# Passed: 15
# Failed: 0
# ✓ All verification checks passed
```

### check-backup-freshness.sh

**Purpose**: Alerts if backup is older than 48 hours

**Use Case**: Scheduled monitoring (cron)

**Features**:
- Checks latest backup age
- Sends email alert if stale
- Exit codes for monitoring systems

**Example**:
```bash
./scripts/check-backup-freshness.sh
# Latest backup: backups/manifest_20251227.json
# Backup age: 12 hours
# ✓ Backup is fresh
```

## 🗓️ Automated Scheduling

### Option 1: Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/youtube-clone && ./scripts/backup-all.sh >> logs/backup.log 2>&1
```

See `crontab.example` for complete configuration.

### Option 2: GitHub Actions

Automated backups via CI/CD:
- Daily scheduled backups
- Manual trigger available
- Artifact storage
- Optional S3 upload

See `.github/workflows/backup.yml`

### Option 3: Systemd Timer (Linux)

```bash
# Create service unit
sudo nano /etc/systemd/system/youtube-backup.service

# Create timer unit
sudo nano /etc/systemd/system/youtube-backup.timer

# Enable and start
sudo systemctl enable youtube-backup.timer
sudo systemctl start youtube-backup.timer
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Database backup
SUPABASE_DB_PASSWORD=your_password
REACT_APP_SUPABASE_URL=https://your-project.supabase.co

# Storage backup (optional)
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_ACCESS_TOKEN=your_access_token
```

### Retention Policies

Default retention: **30 days**

To change:
```bash
# Edit retention in each script
RETENTION_DAYS=60  # Keep 60 days
```

### Backup Locations

```
backups/
├── database/           # PostgreSQL dumps
├── storage/           # Storage bucket archives
│   ├── videos/
│   ├── thumbnails/
│   ├── avatars/
│   └── channel-avatars/
├── config/            # Configuration files
├── repository/        # Code snapshots
└── *.log             # Execution logs
```

## 🚨 Troubleshooting

### "pg_dump: command not found"

```bash
# Install PostgreSQL client
sudo apt-get update
sudo apt-get install postgresql-client
```

### "Permission denied"

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### "Connection refused"

```bash
# Check Supabase credentials
cat .env | grep SUPABASE

# Test connection
psql -h your-host -U postgres -d postgres
```

### Backup too large

```bash
# Check backup size
du -sh backups/

# Solutions:
# 1. Clean up old data
# 2. Archive old records
# 3. Use incremental backups
# 4. Increase retention to spread storage
```

## 📊 Monitoring

### Check Backup Status

```bash
# List all backups
find backups/ -type f -name "*.gz" -o -name "*.tar.gz" | xargs ls -lh

# Show recent activity
tail -f backups/backup_*.log

# Verify latest backup
./scripts/verify-backup.sh
```

### Set Up Alerts

```bash
# Email on failure (requires mail command)
./scripts/backup-database.sh || echo "Backup failed!" | mail -s "Alert" admin@example.com

# Slack webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Backup failed!"}' \
  YOUR_SLACK_WEBHOOK_URL
```

## 🔐 Security Best Practices

### 1. Protect Credentials

```bash
# Never commit .env file
echo ".env" >> .gitignore

# Set proper permissions
chmod 600 .env
```

### 2. Encrypt Backups

```bash
# Encrypt before off-site storage
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Decrypt when needed
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

### 3. Secure Storage

- Store backups in multiple locations
- Use encrypted cloud storage
- Implement access controls
- Regular security audits

## 📚 Additional Resources

- **[BACKUP_RECOVERY_PLAN.md](../BACKUP_RECOVERY_PLAN.md)** - Complete disaster recovery guide
- **[BACKUP_QUICK_START.md](../BACKUP_QUICK_START.md)** - 5-minute setup guide
- **[crontab.example](../crontab.example)** - Scheduling configuration

## 🆘 Emergency Contacts

For backup/recovery emergencies:
1. Check logs: `backups/*.log`
2. Verify backups: `./scripts/verify-backup.sh`
3. Test restore: `./scripts/restore-database.sh`
4. Review documentation: `BACKUP_RECOVERY_PLAN.md`

---

**Last Updated**: December 27, 2025  
**Maintained By**: Development Team
