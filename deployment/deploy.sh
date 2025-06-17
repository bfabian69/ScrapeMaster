#!/bin/bash

# Deployment script for Hostinger VPS
# Usage: ./deploy.sh [production|staging]

set -e

# Configuration
PROJECT_NAME="scrapemaster"
REMOTE_USER="your-username"
REMOTE_HOST="your-vps-ip"
REMOTE_PATH="/var/www/$PROJECT_NAME"
LOCAL_BUILD_PATH="./dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment is provided
ENVIRONMENT=${1:-production}

log_info "Starting deployment to $ENVIRONMENT environment..."

# Step 1: Build the application
log_info "Building the application..."
if ! npm run build; then
    log_error "Build failed!"
    exit 1
fi

# Step 2: Create backup on remote server
log_info "Creating backup on remote server..."
ssh $REMOTE_USER@$REMOTE_HOST "
    if [ -d $REMOTE_PATH ]; then
        sudo cp -r $REMOTE_PATH ${REMOTE_PATH}_backup_$(date +%Y%m%d_%H%M%S)
        log_info 'Backup created successfully'
    fi
"

# Step 3: Upload files
log_info "Uploading files to remote server..."
if ! rsync -avz --delete $LOCAL_BUILD_PATH/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/; then
    log_error "File upload failed!"
    exit 1
fi

# Step 4: Set proper permissions
log_info "Setting proper permissions..."
ssh $REMOTE_USER@$REMOTE_HOST "
    sudo chown -R www-data:www-data $REMOTE_PATH
    sudo chmod -R 755 $REMOTE_PATH
"

# Step 5: Restart web server (if needed)
log_info "Restarting web server..."
ssh $REMOTE_USER@$REMOTE_HOST "
    if systemctl is-active --quiet apache2; then
        sudo systemctl reload apache2
        log_info 'Apache reloaded'
    elif systemctl is-active --quiet nginx; then
        sudo systemctl reload nginx
        log_info 'Nginx reloaded'
    fi
"

# Step 6: Health check
log_info "Performing health check..."
sleep 5
if curl -f -s http://$REMOTE_HOST > /dev/null; then
    log_info "Deployment successful! Site is accessible."
else
    log_warn "Site might not be accessible. Please check manually."
fi

log_info "Deployment completed!"