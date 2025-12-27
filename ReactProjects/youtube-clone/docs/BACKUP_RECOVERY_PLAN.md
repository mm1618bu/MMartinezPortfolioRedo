# Backup & Recovery Plan - YouTube Clone

## Overview

Comprehensive backup and disaster recovery strategy to protect data and ensure business continuity.

## 🎯 Backup Strategy

### What Gets Backed Up

1. **Database (Supabase PostgreSQL)**
   - User accounts and profiles
   - Video metadata
   - Comments and replies
   - Channels and subscriptions
   - Playlists
   - Watch history
   - Analytics data

2. **Storage (Supabase Storage)**
   - Video files
   - Thumbnail images
   - User avatars
   - Channel avatars
   - Other media assets

3. **Configuration**
   - Application code
   - Configuration files
   - Environment settings (templates)
   - Package dependencies

4. **Code Repository**
   - Git repository state
   - Commit history
   - Branch information

### Backup Schedule

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Database | Daily at 2 AM | 30 days | `./backups/database/` |
| Storage | Weekly on Sunday | 30 days | `./backups/storage/` |
| Configuration | With each deploy | 30 days | `./backups/config/` |
| Full Backup | Weekly | 90 days | External storage |

## 🛠️ Backup Scripts

### 1. Database Backup

```bash
# Manual backup
./scripts/backup-database.sh

# Scheduled backup (cron)
0 2 * * * cd /path/to/youtube-clone && ./scripts/backup-database.sh
```

**Features:**
- Compressed backups (gzip)
- Metadata generation
- Automatic cleanup of old backups
- Error logging

### 2. Storage Backup

```bash
# Backup all storage buckets
./scripts/backup-storage.sh

# Scheduled backup
0 3 * * 0 cd /path/to/youtube-clone && ./scripts/backup-storage.sh
```

**Features:**
- Backs up all Supabase storage buckets
- Creates compressed archives
- Generates backup manifests

### 3. Complete Backup

```bash
# Full system backup
./scripts/backup-all.sh
```

**Includes:**
- Database dump
- Storage files
- Configuration
- Code repository snapshot
- Backup manifest (JSON)

### 4. Backup Verification

```bash
# Verify backup integrity
./scripts/verify-backup.sh
```

**Checks:**
- File existence and readability
- Archive integrity (compression)
- Backup freshness
- Disk space availability

## 🔄 Recovery Procedures

### Database Recovery

#### Full Database Restore

```bash
# Interactive restore
./scripts/restore-database.sh

# Choose from available backups
# Enter 'latest' for most recent backup
```

**Process:**
1. Creates safety backup of current database
2. Lists available backup files
3. Confirms restore action
4. Decompresses backup
5. Restores using pg_restore
6. Verifies completion

#### Partial Recovery (Specific Tables)

```bash
# Extract specific table from backup
gunzip -c backups/database/youtube_clone_db_TIMESTAMP.sql.gz | \
  pg_restore --table=TABLE_NAME \
  -h HOST -U USER -d DATABASE
```

### Storage Recovery

#### Restore All Storage

```bash
# Extract storage backup
cd backups/storage/videos
tar -xzf videos_TIMESTAMP.tar.gz

# Upload to Supabase using CLI
supabase storage upload videos ./extracted_files/*
```

#### Restore Specific Bucket

```bash
# Restore specific bucket
cd backups/storage/BUCKET_NAME
tar -xzf BUCKET_NAME_TIMESTAMP.tar.gz

# Upload using Supabase CLI or dashboard
```

### Configuration Recovery

```bash
# Extract configuration backup
cd backups/config
tar -xzf config_TIMESTAMP.tar.gz

# Restore configuration files
cp config_TIMESTAMP/* /path/to/youtube-clone/
```

## 🚨 Disaster Recovery Scenarios

### Scenario 1: Database Corruption

**Symptoms:**
- SQL errors
- Data inconsistencies
- Application crashes

**Recovery Steps:**

1. **Assess Damage**
   ```bash
   # Check database connection
   psql -h HOST -U USER -d DATABASE -c "SELECT COUNT(*) FROM videos;"
   ```

2. **Restore from Latest Backup**
   ```bash
   ./scripts/restore-database.sh
   # Select: latest
   ```

3. **Verify Data Integrity**
   ```bash
   # Run verification queries
   psql -h HOST -U USER -d DATABASE -f scripts/verify-data.sql
   ```

4. **Test Application**
   - Login and authentication
   - Video playback
   - Comments functionality
   - Channel operations

**Recovery Time Objective (RTO):** 30 minutes  
**Recovery Point Objective (RPO):** 24 hours

### Scenario 2: Storage Loss

**Symptoms:**
- Missing video files
- Broken thumbnails
- 404 errors for media

**Recovery Steps:**

1. **Identify Missing Files**
   ```bash
   # Check Supabase storage buckets
   supabase storage ls videos
   ```

2. **Restore from Backup**
   ```bash
   ./scripts/backup-storage.sh
   # Restore specific bucket or all
   ```

3. **Verify File Accessibility**
   - Test video playback
   - Check thumbnail loading
   - Verify avatar images

4. **Update Database References**
   ```sql
   -- Update broken file URLs if needed
   UPDATE videos SET thumbnail_url = 'new_url' WHERE id = 'video_id';
   ```

**RTO:** 2 hours  
**RPO:** 7 days

### Scenario 3: Complete System Failure

**Symptoms:**
- Total application outage
- Database unreachable
- Storage inaccessible

**Recovery Steps:**

1. **Set Up New Infrastructure**
   - Create new Supabase project
   - Configure DNS/hosting

2. **Restore Database**
   ```bash
   # Update .env with new Supabase credentials
   ./scripts/restore-database.sh
   ```

3. **Restore Storage**
   ```bash
   ./scripts/backup-storage.sh
   # Upload to new Supabase storage
   ```

4. **Deploy Application Code**
   ```bash
   git clone <repository>
   npm install
   npm run build
   # Deploy to hosting
   ```

5. **Verify All Systems**
   - Authentication
   - Video upload/playback
   - Comments and interactions
   - Analytics

**RTO:** 4 hours  
**RPO:** 24 hours

### Scenario 4: Accidental Data Deletion

**Symptoms:**
- User reports missing videos/data
- Specific records gone

**Recovery Steps:**

1. **Identify Deletion Timeframe**
   ```bash
   # Check logs
   grep "DELETE" backups/database/backup_*.log
   ```

2. **Point-in-Time Recovery**
   ```bash
   # Restore to backup before deletion
   ./scripts/restore-database.sh
   # Select backup from before deletion
   ```

3. **Extract Specific Data**
   ```sql
   -- Export specific records
   pg_dump -t TABLE_NAME -h HOST -U USER -d DATABASE > specific_data.sql
   ```

4. **Merge Data**
   - Carefully merge deleted data with current database
   - Resolve conflicts
   - Verify relationships

**RTO:** 1 hour  
**RPO:** 24 hours

## 📋 Pre-Disaster Checklist

### Daily
- [ ] Verify automated backups ran successfully
- [ ] Check backup logs for errors
- [ ] Monitor disk space

### Weekly
- [ ] Run full backup verification
- [ ] Test restore procedure (non-production)
- [ ] Review backup retention policy
- [ ] Check external backup storage

### Monthly
- [ ] Complete disaster recovery drill
- [ ] Update recovery documentation
- [ ] Review and update backup scripts
- [ ] Test all recovery scenarios
- [ ] Audit backup access permissions

### Quarterly
- [ ] Full system restore test
- [ ] Review and update RTO/RPO targets
- [ ] Update contact information
- [ ] Review insurance/SLA coverage

## 🔐 Security Considerations

### Backup Encryption

```bash
# Encrypt backups before off-site storage
gpg --symmetric --cipher-algo AES256 backup_file.sql.gz

# Decrypt when needed
gpg --decrypt backup_file.sql.gz.gpg > backup_file.sql.gz
```

### Access Control

- Store backups in secure locations
- Limit access to authorized personnel
- Use strong authentication
- Encrypt sensitive data
- Never commit `.env` files with credentials

### Backup Storage Locations

1. **Primary:** Local server (`./backups/`)
2. **Secondary:** Cloud storage (S3, Google Cloud Storage)
3. **Tertiary:** Off-site physical storage

## 📞 Emergency Contacts

### Internal Team

| Role | Name | Contact | Responsibility |
|------|------|---------|----------------|
| Lead Developer | [Name] | [Email/Phone] | Overall recovery coordination |
| DevOps | [Name] | [Email/Phone] | Infrastructure restoration |
| DBA | [Name] | [Email/Phone] | Database recovery |

### External Services

| Service | Contact | Purpose |
|---------|---------|---------|
| Supabase Support | support@supabase.io | Database/storage issues |
| Hosting Provider | [Contact] | Server issues |
| DNS Provider | [Contact] | DNS problems |

## 📊 Monitoring & Alerts

### Backup Monitoring

```bash
# Check if backup completed
if [ ! -f "backups/database/youtube_clone_db_$(date +%Y%m%d)*.sql.gz" ]; then
  echo "ALERT: Daily backup missing!" | mail -s "Backup Alert" admin@example.com
fi
```

### Automated Alerts

Set up monitoring for:
- Backup failures
- Disk space < 10GB
- Backup age > 48 hours
- Restore test failures

## 🧪 Testing Procedures

### Monthly Restore Test

1. **Create Test Environment**
   ```bash
   # Spin up test Supabase project
   # Use separate test credentials
   ```

2. **Restore Latest Backup**
   ```bash
   ./scripts/restore-database.sh
   ```

3. **Verify Data Integrity**
   - Count records in each table
   - Check for data corruption
   - Verify relationships

4. **Document Results**
   - Restore duration
   - Issues encountered
   - Data verification results

### Quarterly Full DR Test

1. **Simulate Complete Failure**
2. **Follow complete recovery procedure**
3. **Measure actual RTO/RPO**
4. **Document lessons learned**
5. **Update procedures**

## 📈 Backup Metrics

### Key Performance Indicators

| Metric | Target | Current |
|--------|--------|---------|
| Backup Success Rate | 99.9% | - |
| Average Backup Duration | < 30 min | - |
| Restore Success Rate | 100% | - |
| Average Restore Duration | < 60 min | - |
| Backup Storage Used | < 100 GB | - |

### Monthly Report Template

```
Backup Report - [Month Year]
============================

Backups Completed: X/Y (Z%)
Average Backup Size: X GB
Failed Backups: X
Successful Restores: X/Y tests
Incidents: X
Actions Taken: [List]
Recommendations: [List]
```

## 🔄 Continuous Improvement

### Regular Reviews

- Analyze backup failures
- Optimize backup schedules
- Update retention policies
- Improve recovery procedures
- Train team members

### Automation Improvements

- Implement automated testing
- Add real-time monitoring
- Create dashboard for backup status
- Automate off-site replication

## 📚 Additional Resources

### Documentation
- Supabase Backup Documentation
- PostgreSQL Backup Best Practices
- Disaster Recovery Planning Guide

### Tools
- Supabase CLI
- PostgreSQL pg_dump/pg_restore
- Backup verification scripts

### Training
- Disaster recovery drills
- Team training sessions
- Documentation updates

---

**Document Version:** 1.0  
**Last Updated:** December 27, 2025  
**Next Review:** March 27, 2026  
**Owner:** Development Team
