#!/bin/bash

###############################################################################
# Complete Backup Script for YouTube Clone
# Backs up everything: database, storage, code, configuration
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_ROOT="./backups"
LOG_FILE="${BACKUP_ROOT}/backup_${TIMESTAMP}.log"

# Create backup root directory
mkdir -p "$BACKUP_ROOT"

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log "${BLUE}================================${NC}"
log "${BLUE}YouTube Clone - Complete Backup${NC}"
log "${BLUE}================================${NC}"
log "Started at: $(date)"
log "Timestamp: $TIMESTAMP"
log ""

# Track overall status
OVERALL_STATUS=0

# 1. Backup Database
log "${YELLOW}[1/4] Backing up database...${NC}"
if bash ./scripts/backup-database.sh >> "$LOG_FILE" 2>&1; then
    log "${GREEN}✓ Database backup successful${NC}"
else
    log "${RED}✗ Database backup failed${NC}"
    OVERALL_STATUS=1
fi
log ""

# 2. Backup Storage
log "${YELLOW}[2/4] Backing up storage files...${NC}"
if bash ./scripts/backup-storage.sh >> "$LOG_FILE" 2>&1; then
    log "${GREEN}✓ Storage backup successful${NC}"
else
    log "${RED}✗ Storage backup failed (check log for details)${NC}"
    OVERALL_STATUS=1
fi
log ""

# 3. Backup Configuration Files
log "${YELLOW}[3/4] Backing up configuration...${NC}"
CONFIG_BACKUP="${BACKUP_ROOT}/config/config_${TIMESTAMP}"
mkdir -p "$CONFIG_BACKUP"

# Backup important config files (excluding sensitive data)
CONFIG_FILES=(
    "package.json"
    "package-lock.json"
    ".env.template"
    "public/manifest.json"
    "README.md"
    ".gitignore"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$CONFIG_BACKUP/"
        log "  ✓ Backed up: $file"
    fi
done

# Create archive
tar -czf "${CONFIG_BACKUP}.tar.gz" -C "${BACKUP_ROOT}/config" "$(basename $CONFIG_BACKUP)"
rm -rf "$CONFIG_BACKUP"
log "${GREEN}✓ Configuration backup successful${NC}"
log ""

# 4. Create Git Repository Snapshot
log "${YELLOW}[4/4] Creating code repository snapshot...${NC}"
REPO_BACKUP="${BACKUP_ROOT}/repository/repo_${TIMESTAMP}"
mkdir -p "$REPO_BACKUP"

# Export current git state
if git rev-parse --git-dir > /dev/null 2>&1; then
    # Save git info
    git log -1 > "${REPO_BACKUP}/last_commit.txt"
    git status > "${REPO_BACKUP}/git_status.txt"
    git diff > "${REPO_BACKUP}/git_diff.txt"
    git branch -v > "${REPO_BACKUP}/git_branches.txt"
    
    # Create repository archive (excluding node_modules, backups, etc.)
    git archive -o "${REPO_BACKUP}/source_code.tar.gz" HEAD
    
    log "${GREEN}✓ Repository snapshot successful${NC}"
else
    log "${YELLOW}⚠ Not a git repository, skipping code snapshot${NC}"
fi
log ""

# 5. Create Backup Manifest
log "${YELLOW}Creating backup manifest...${NC}"
MANIFEST="${BACKUP_ROOT}/manifest_${TIMESTAMP}.json"

cat > "$MANIFEST" << EOF
{
  "backup_timestamp": "$TIMESTAMP",
  "backup_date": "$(date -Iseconds)",
  "backup_type": "complete",
  "components": {
    "database": {
      "status": "$([ -f ${BACKUP_ROOT}/database/youtube_clone_db_${TIMESTAMP}.sql.gz ] && echo 'success' || echo 'failed')",
      "location": "backups/database/youtube_clone_db_${TIMESTAMP}.sql.gz"
    },
    "storage": {
      "status": "$([ -f ${BACKUP_ROOT}/storage/backup_summary_${TIMESTAMP}.txt ] && echo 'success' || echo 'failed')",
      "location": "backups/storage/"
    },
    "configuration": {
      "status": "success",
      "location": "backups/config/config_${TIMESTAMP}.tar.gz"
    },
    "repository": {
      "status": "$([ -f ${REPO_BACKUP}/last_commit.txt ] && echo 'success' || echo 'skipped')",
      "location": "backups/repository/repo_${TIMESTAMP}/"
    }
  },
  "backup_size": "$(du -sh ${BACKUP_ROOT} | cut -f1)",
  "retention_policy": "30 days",
  "recovery_instructions": "See BACKUP_RECOVERY_PLAN.md"
}
EOF

log "${GREEN}✓ Manifest created: $MANIFEST${NC}"
log ""

# 6. Calculate Total Backup Size
TOTAL_SIZE=$(du -sh "$BACKUP_ROOT" | cut -f1)

# 7. Final Summary
log "${BLUE}================================${NC}"
if [ $OVERALL_STATUS -eq 0 ]; then
    log "${GREEN}✓ BACKUP COMPLETED SUCCESSFULLY${NC}"
else
    log "${YELLOW}⚠ BACKUP COMPLETED WITH WARNINGS${NC}"
fi
log "${BLUE}================================${NC}"
log "Total backup size: $TOTAL_SIZE"
log "Backup location: $BACKUP_ROOT"
log "Log file: $LOG_FILE"
log "Manifest: $MANIFEST"
log "Completed at: $(date)"
log ""
log "${YELLOW}Important:${NC}"
log "  1. Verify backup integrity before relying on it"
log "  2. Store backups in multiple locations"
log "  3. Test restore procedure regularly"
log "  4. Keep .env file separately (contains sensitive data)"
log ""

# Display manifest
log "${BLUE}Backup Manifest:${NC}"
cat "$MANIFEST" | tee -a "$LOG_FILE"

exit $OVERALL_STATUS
