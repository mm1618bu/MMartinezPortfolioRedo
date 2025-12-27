#!/bin/bash

###############################################################################
# Storage Backup Script for YouTube Clone
# Backs up Supabase Storage (videos, thumbnails, avatars)
###############################################################################

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups/storage"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

echo -e "${GREEN}Starting storage backup...${NC}"
echo "Timestamp: $TIMESTAMP"

# Create backup directories
mkdir -p "$BACKUP_DIR/videos"
mkdir -p "$BACKUP_DIR/thumbnails"
mkdir -p "$BACKUP_DIR/avatars"
mkdir -p "$BACKUP_DIR/channel-avatars"

# Supabase storage buckets to backup
BUCKETS=("videos" "thumbnails" "avatars" "channel-avatars")

# Function to backup a storage bucket
backup_bucket() {
    local bucket=$1
    local backup_path="${BACKUP_DIR}/${bucket}/${bucket}_${TIMESTAMP}"
    
    echo -e "${YELLOW}Backing up bucket: $bucket${NC}"
    
    # Create temporary directory for this bucket
    mkdir -p "$backup_path"
    
    # Use Supabase CLI to download bucket contents
    # Note: Requires Supabase CLI to be installed and authenticated
    if command -v supabase &> /dev/null; then
        supabase storage ls "$bucket" > "${backup_path}/file_list.txt" 2>&1
        
        # Download all files from bucket
        while IFS= read -r file; do
            supabase storage download "$bucket" "$file" --output "${backup_path}/${file}"
        done < "${backup_path}/file_list.txt"
        
        # Create archive
        tar -czf "${backup_path}.tar.gz" -C "$BACKUP_DIR/$bucket" "$(basename $backup_path)"
        
        # Remove temporary directory
        rm -rf "$backup_path"
        
        # Get archive size
        local size=$(du -h "${backup_path}.tar.gz" | cut -f1)
        echo -e "${GREEN}✓ $bucket backup complete: $size${NC}"
        
        # Create metadata
        cat > "${backup_path}.meta" << EOF
Bucket: $bucket
Date: $(date)
Timestamp: $TIMESTAMP
Size: $size
Status: SUCCESS
EOF
        
    else
        echo -e "${YELLOW}⚠ Supabase CLI not found. Using API method...${NC}"
        
        # Alternative: Use curl to download from Supabase Storage API
        # This requires the storage to be publicly accessible or use auth token
        
        # Create manifest of files to backup
        curl -X GET \
            "${REACT_APP_SUPABASE_URL}/storage/v1/object/list/${bucket}" \
            -H "apikey: ${REACT_APP_SUPABASE_ANON_KEY}" \
            -H "Authorization: Bearer ${REACT_APP_SUPABASE_ANON_KEY}" \
            > "${backup_path}/manifest.json"
        
        # Parse manifest and download files
        # Note: This is a simplified version. Production would need proper JSON parsing
        echo -e "${YELLOW}Manifest created. Manual download may be required.${NC}"
        
        # Create archive of what we have
        tar -czf "${backup_path}.tar.gz" -C "$BACKUP_DIR/$bucket" "$(basename $backup_path)" 2>/dev/null || true
        rm -rf "$backup_path"
        
        echo -e "${YELLOW}⚠ $bucket backup completed (API method - verify manually)${NC}"
    fi
}

# Backup each bucket
for bucket in "${BUCKETS[@]}"; do
    backup_bucket "$bucket"
    echo ""
done

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
for bucket in "${BUCKETS[@]}"; do
    find "$BACKUP_DIR/$bucket" -name "${bucket}_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR/$bucket" -name "${bucket}_*.meta" -mtime +$RETENTION_DAYS -delete
done

# Create overall summary
cat > "$BACKUP_DIR/backup_summary_${TIMESTAMP}.txt" << EOF
Storage Backup Summary
======================
Date: $(date)
Timestamp: $TIMESTAMP

Buckets Backed Up:
EOF

for bucket in "${BUCKETS[@]}"; do
    local latest_backup=$(ls -t "$BACKUP_DIR/$bucket"/${bucket}_*.tar.gz 2>/dev/null | head -1)
    if [ -n "$latest_backup" ]; then
        local size=$(du -h "$latest_backup" | cut -f1)
        echo "  - $bucket: $size" >> "$BACKUP_DIR/backup_summary_${TIMESTAMP}.txt"
    fi
done

echo "" >> "$BACKUP_DIR/backup_summary_${TIMESTAMP}.txt"
echo "Total backup size: $(du -sh $BACKUP_DIR | cut -f1)" >> "$BACKUP_DIR/backup_summary_${TIMESTAMP}.txt"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Storage backup completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo "Summary: $BACKUP_DIR/backup_summary_${TIMESTAMP}.txt"

# Display summary
cat "$BACKUP_DIR/backup_summary_${TIMESTAMP}.txt"
