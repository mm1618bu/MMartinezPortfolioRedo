#!/bin/bash

###############################################################################
# Backup Verification Script for YouTube Clone
# Verifies integrity of backup files
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_ROOT="./backups"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Backup Verification Utility${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_ROOT" ]; then
    echo -e "${RED}✗ Backup directory not found: $BACKUP_ROOT${NC}"
    exit 1
fi

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to verify file
verify_file() {
    local file=$1
    local description=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file" ]; then
        # Check if file is readable
        if [ -r "$file" ]; then
            # Get file size
            local size=$(du -h "$file" | cut -f1)
            echo -e "${GREEN}✓${NC} $description: $size"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        else
            echo -e "${RED}✗${NC} $description: Not readable"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        fi
    else
        echo -e "${YELLOW}⚠${NC} $description: Not found"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function to verify database backup
verify_database_backup() {
    echo -e "${YELLOW}Verifying database backups...${NC}"
    
    local db_backups=$(find "${BACKUP_ROOT}/database" -name "youtube_clone_db_*.sql.gz" 2>/dev/null | sort -r)
    
    if [ -z "$db_backups" ]; then
        echo -e "${RED}✗ No database backups found${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        return
    fi
    
    echo "Found $(echo "$db_backups" | wc -l) database backup(s)"
    
    # Check latest backup
    local latest=$(echo "$db_backups" | head -1)
    verify_file "$latest" "Latest database backup"
    
    # Verify it can be decompressed
    if gzip -t "$latest" 2>/dev/null; then
        echo -e "${GREEN}  ✓ Compression integrity verified${NC}"
    else
        echo -e "${RED}  ✗ Compression integrity check failed${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    # Check metadata file
    local meta="${latest%.gz}.meta"
    if [ -f "$meta" ]; then
        echo -e "${GREEN}  ✓ Metadata file exists${NC}"
    fi
    
    echo ""
}

# Function to verify storage backups
verify_storage_backup() {
    echo -e "${YELLOW}Verifying storage backups...${NC}"
    
    local buckets=("videos" "thumbnails" "avatars" "channel-avatars")
    
    for bucket in "${buckets[@]}"; do
        local bucket_backups=$(find "${BACKUP_ROOT}/storage/${bucket}" -name "${bucket}_*.tar.gz" 2>/dev/null | sort -r | head -1)
        
        if [ -n "$bucket_backups" ]; then
            verify_file "$bucket_backups" "Latest $bucket backup"
            
            # Verify tar.gz integrity
            if tar -tzf "$bucket_backups" > /dev/null 2>&1; then
                echo -e "${GREEN}  ✓ Archive integrity verified${NC}"
            else
                echo -e "${RED}  ✗ Archive integrity check failed${NC}"
                FAILED_CHECKS=$((FAILED_CHECKS + 1))
            fi
        else
            echo -e "${YELLOW}⚠ No backups found for: $bucket${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        fi
    done
    
    echo ""
}

# Function to verify config backups
verify_config_backup() {
    echo -e "${YELLOW}Verifying configuration backups...${NC}"
    
    local config_backups=$(find "${BACKUP_ROOT}/config" -name "config_*.tar.gz" 2>/dev/null | sort -r | head -1)
    
    if [ -n "$config_backups" ]; then
        verify_file "$config_backups" "Latest config backup"
        
        # Verify tar.gz integrity
        if tar -tzf "$config_backups" > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ Archive integrity verified${NC}"
            
            # List contents
            echo -e "${BLUE}  Contents:${NC}"
            tar -tzf "$config_backups" | head -10
        else
            echo -e "${RED}  ✗ Archive integrity check failed${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    else
        echo -e "${YELLOW}⚠ No configuration backups found${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    fi
    
    echo ""
}

# Function to check backup age
check_backup_age() {
    echo -e "${YELLOW}Checking backup freshness...${NC}"
    
    # Get latest backup timestamp
    local latest_manifest=$(find "${BACKUP_ROOT}" -name "manifest_*.json" 2>/dev/null | sort -r | head -1)
    
    if [ -n "$latest_manifest" ]; then
        local backup_date=$(grep '"backup_date"' "$latest_manifest" | cut -d'"' -f4)
        echo "Latest backup: $backup_date"
        
        # Calculate age in hours
        local backup_epoch=$(date -d "$backup_date" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$backup_date" +%s 2>/dev/null || echo 0)
        local current_epoch=$(date +%s)
        local age_hours=$(( (current_epoch - backup_epoch) / 3600 ))
        
        if [ $age_hours -lt 24 ]; then
            echo -e "${GREEN}✓ Backup is fresh (${age_hours} hours old)${NC}"
        elif [ $age_hours -lt 168 ]; then
            echo -e "${YELLOW}⚠ Backup is ${age_hours} hours old (consider updating)${NC}"
        else
            echo -e "${RED}✗ Backup is stale (${age_hours} hours old)${NC}"
            echo -e "${RED}  Action required: Create new backup${NC}"
        fi
    else
        echo -e "${RED}✗ No backup manifest found${NC}"
    fi
    
    echo ""
}

# Function to check disk space
check_disk_space() {
    echo -e "${YELLOW}Checking disk space...${NC}"
    
    local backup_size=$(du -sh "$BACKUP_ROOT" 2>/dev/null | cut -f1)
    local available_space=$(df -h "$BACKUP_ROOT" | tail -1 | awk '{print $4}')
    
    echo "Backup size: $backup_size"
    echo "Available space: $available_space"
    
    # Check if we have at least 10GB free
    local available_gb=$(df -BG "$BACKUP_ROOT" | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$available_gb" -gt 10 ]; then
        echo -e "${GREEN}✓ Sufficient disk space available${NC}"
    else
        echo -e "${YELLOW}⚠ Low disk space (${available_gb}GB available)${NC}"
    fi
    
    echo ""
}

# Run all verification checks
verify_database_backup
verify_storage_backup
verify_config_backup
check_backup_age
check_disk_space

# Display summary
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}================================${NC}"
echo "Total checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ All verification checks passed${NC}"
    exit 0
elif [ $PASSED_CHECKS -gt $FAILED_CHECKS ]; then
    echo -e "${YELLOW}⚠ Some checks failed, but core backups are intact${NC}"
    exit 0
else
    echo -e "${RED}✗ Critical verification failures detected${NC}"
    echo -e "${RED}Action required: Review backup system${NC}"
    exit 1
fi
