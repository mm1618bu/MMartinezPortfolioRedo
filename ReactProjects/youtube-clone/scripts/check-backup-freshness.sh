#!/bin/bash

###############################################################################
# Backup Freshness Check Script
# Alerts if no backup exists within the last 48 hours
###############################################################################

BACKUP_ROOT="./backups"
MAX_AGE_HOURS=48
ALERT_EMAIL="admin@example.com"

# Find latest backup
LATEST_BACKUP=$(find "$BACKUP_ROOT" -name "manifest_*.json" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -f2- -d" ")

if [ -z "$LATEST_BACKUP" ]; then
    echo "ERROR: No backup manifest found"
    echo "CRITICAL: No backup found in $BACKUP_ROOT" | mail -s "Backup Alert - No Backups Found" "$ALERT_EMAIL"
    exit 1
fi

# Get backup timestamp
BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP")
CURRENT_TIME=$(date +%s)
AGE_HOURS=$(( (CURRENT_TIME - BACKUP_TIME) / 3600 ))

echo "Latest backup: $LATEST_BACKUP"
echo "Backup age: $AGE_HOURS hours"

if [ $AGE_HOURS -gt $MAX_AGE_HOURS ]; then
    echo "WARNING: Backup is stale ($AGE_HOURS hours old)"
    echo "WARNING: Last backup is $AGE_HOURS hours old (threshold: $MAX_AGE_HOURS)" | \
        mail -s "Backup Alert - Stale Backup" "$ALERT_EMAIL"
    exit 1
else
    echo "✓ Backup is fresh"
    exit 0
fi
