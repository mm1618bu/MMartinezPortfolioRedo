#!/bin/bash

###############################################################################
# Database Restore Script for YouTube Clone
# Restores Supabase PostgreSQL database from backup
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups/database"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Extract database connection details
DB_HOST=$(echo $REACT_APP_SUPABASE_URL | sed 's/https:\/\///' | sed 's/http:\/\///')
DB_NAME="postgres"
DB_USER="postgres"

# Function to list available backups
list_backups() {
    echo -e "${BLUE}Available backups:${NC}"
    ls -lh "$BACKUP_DIR" | grep "youtube_clone_db_.*\.sql\.gz" | nl
}

# Function to confirm action
confirm() {
    read -p "$(echo -e ${YELLOW}$1${NC}) (yes/no): " response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            return 0
            ;;
        *)
            echo -e "${RED}Operation cancelled${NC}"
            exit 1
            ;;
    esac
}

echo -e "${RED}================================${NC}"
echo -e "${RED}DATABASE RESTORE UTILITY${NC}"
echo -e "${RED}================================${NC}"
echo -e "${YELLOW}WARNING: This will overwrite the current database!${NC}"
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

# List available backups
list_backups

echo ""
echo "Enter the backup filename to restore (or 'latest' for most recent):"
read -r BACKUP_CHOICE

# Handle 'latest' option
if [ "$BACKUP_CHOICE" = "latest" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/youtube_clone_db_*.sql.gz | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: No backup files found${NC}"
        exit 1
    fi
    echo -e "${GREEN}Selected latest backup: $(basename $BACKUP_FILE)${NC}"
else
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_CHOICE}"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
fi

# Check metadata if available
META_FILE="${BACKUP_FILE%.gz}.meta"
if [ -f "$META_FILE" ]; then
    echo -e "${BLUE}Backup Information:${NC}"
    cat "$META_FILE"
    echo ""
fi

# Final confirmation
confirm "Are you sure you want to restore from this backup? This will OVERWRITE ALL DATA!"

# Create a pre-restore backup
echo -e "${YELLOW}Creating safety backup before restore...${NC}"
SAFETY_BACKUP="./backups/database/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

pg_dump \
    -h "$DB_HOST" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F c \
    -f "$SAFETY_BACKUP"

if [ $? -eq 0 ]; then
    gzip "$SAFETY_BACKUP"
    echo -e "${GREEN}✓ Safety backup created: ${SAFETY_BACKUP}.gz${NC}"
else
    echo -e "${RED}✗ Safety backup failed. Aborting restore.${NC}"
    exit 1
fi

# Decompress backup if needed
RESTORE_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup...${NC}"
    gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
    RESTORE_FILE="${BACKUP_FILE%.gz}"
fi

# Perform restore
echo -e "${YELLOW}Starting database restore...${NC}"
echo "This may take several minutes..."

pg_restore \
    -h "$DB_HOST" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c \
    -v \
    "$RESTORE_FILE" \
    2>&1 | tee "./backups/database/restore_$(date +%Y%m%d_%H%M%S).log"

RESTORE_STATUS=${PIPESTATUS[0]}

# Clean up decompressed file
if [[ "$BACKUP_FILE" == *.gz ]]; then
    rm -f "$RESTORE_FILE"
fi

# Unset password
unset PGPASSWORD

# Check restore status
if [ $RESTORE_STATUS -eq 0 ]; then
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✓ Database restored successfully!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo "Restored from: $(basename $BACKUP_FILE)"
    echo "Safety backup: ${SAFETY_BACKUP}.gz"
    echo ""
    echo -e "${YELLOW}Important: Please verify data integrity before proceeding${NC}"
else
    echo -e "${RED}================================${NC}"
    echo -e "${RED}✗ Database restore failed${NC}"
    echo -e "${RED}================================${NC}"
    echo "You can restore from safety backup if needed:"
    echo "  ./scripts/restore-database.sh"
    echo "  Select: $(basename ${SAFETY_BACKUP}.gz)"
    exit 1
fi
