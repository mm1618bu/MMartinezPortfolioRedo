#!/bin/bash

###############################################################################
# Database Backup Script for YouTube Clone
# Backs up Supabase PostgreSQL database using pg_dump
###############################################################################

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="youtube_clone_db_${TIMESTAMP}.sql"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Extract database connection details from Supabase URL
# Format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
DB_HOST=$(echo $REACT_APP_SUPABASE_URL | sed 's/https:\/\///' | sed 's/http:\/\///')
DB_NAME="postgres"
DB_USER="postgres"

echo -e "${GREEN}Starting database backup...${NC}"
echo "Timestamp: $TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
echo -e "${YELLOW}Creating backup file: $BACKUP_FILE${NC}"

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${RED}Error: SUPABASE_DB_PASSWORD not set in .env${NC}"
    exit 1
fi

# Export password for pg_dump
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

# Run pg_dump
pg_dump \
    -h "$DB_HOST" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F c \
    -b \
    -v \
    -f "${BACKUP_DIR}/${BACKUP_FILE}" \
    2>&1 | tee "${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Check if backup was successful
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✓ Database backup completed successfully${NC}"
    
    # Get file size
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
    
    # Compress backup
    echo -e "${YELLOW}Compressing backup...${NC}"
    gzip "${BACKUP_DIR}/${BACKUP_FILE}"
    COMPRESSED_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)
    echo -e "${GREEN}✓ Compressed to: $COMPRESSED_SIZE${NC}"
    
    # Create metadata file
    cat > "${BACKUP_DIR}/${BACKUP_FILE}.meta" << EOF
Backup Information
==================
Date: $(date)
Timestamp: $TIMESTAMP
Original Size: $BACKUP_SIZE
Compressed Size: $COMPRESSED_SIZE
Database: $DB_NAME
Host: $DB_HOST
User: $DB_USER
Status: SUCCESS
EOF
    
else
    echo -e "${RED}✗ Database backup failed${NC}"
    exit 1
fi

# Clean up old backups (keep last N days)
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "youtube_clone_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "youtube_clone_db_*.meta" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "backup_*.log" -mtime +$RETENTION_DAYS -delete

# List recent backups
echo -e "${GREEN}Recent backups:${NC}"
ls -lh "$BACKUP_DIR" | grep "youtube_clone_db_" | tail -5

# Unset password
unset PGPASSWORD

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo "Backup location: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
