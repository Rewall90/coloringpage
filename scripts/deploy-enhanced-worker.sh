#!/bin/bash

# ============================================================================
# Enhanced Collection Image Proxy Worker Deployment Script
# ============================================================================
# This script safely deploys the enhanced Cloudflare Worker with real-time
# image transformations while maintaining backward compatibility.
#
# Usage:
#   ./scripts/deploy-enhanced-worker.sh [environment]
#   ./scripts/deploy-enhanced-worker.sh development
#   ./scripts/deploy-enhanced-worker.sh production
# ============================================================================

set -e  # Exit on any error

# Configuration
WORKER_DIR="cloudflare-workers/collection-image-proxy"
ENHANCED_WORKER="src/enhanced-worker.js"
ORIGINAL_WORKER="src/index.js"
BACKUP_WORKER="src/index.backup.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validate environment
ENVIRONMENT=${1:-development}
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_info "Usage: $0 [development|production]"
    exit 1
fi

log_info "Starting enhanced worker deployment for: $ENVIRONMENT"

# Change to worker directory
cd "$WORKER_DIR" || {
    log_error "Could not find worker directory: $WORKER_DIR"
    exit 1
}

# Validate files exist
if [[ ! -f "$ENHANCED_WORKER" ]]; then
    log_error "Enhanced worker file not found: $ENHANCED_WORKER"
    exit 1
fi

if [[ ! -f "wrangler.toml" ]]; then
    log_error "Wrangler configuration not found: wrangler.toml"
    exit 1
fi

# Create backup of original worker
if [[ -f "$ORIGINAL_WORKER" && ! -f "$BACKUP_WORKER" ]]; then
    log_info "Creating backup of original worker..."
    cp "$ORIGINAL_WORKER" "$BACKUP_WORKER"
    log_success "Backup created: $BACKUP_WORKER"
fi

# Deploy enhanced worker
log_info "Deploying enhanced worker with real-time transformations..."

if [[ "$ENVIRONMENT" == "production" ]]; then
    # Production deployment
    log_warning "Deploying to PRODUCTION environment"
    read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    # Replace original with enhanced worker
    cp "$ENHANCED_WORKER" "$ORIGINAL_WORKER"
    
    # Deploy to production
    npx wrangler deploy --env production
    
    log_success "Enhanced worker deployed to PRODUCTION"
    log_info "URLs now support real-time transformations:"
    log_info "  /collections/animals/cat.webp?w=400&h=300&q=85&fit=cover&format=auto"
    
else
    # Development deployment
    log_info "Deploying to DEVELOPMENT environment"
    
    # Replace original with enhanced worker
    cp "$ENHANCED_WORKER" "$ORIGINAL_WORKER"
    
    # Deploy to development
    npx wrangler deploy --env development
    
    log_success "Enhanced worker deployed to DEVELOPMENT"
    log_info "Test with URLs like:"
    log_info "  https://your-dev-domain.com/collections/animals/cat.webp?w=400&h=300"
fi

# Show deployment status
log_info "Checking deployment status..."
npx wrangler tail --env "$ENVIRONMENT" --format pretty --once || log_warning "Could not check worker logs"

# Display next steps
echo
log_success "🚀 Enhanced Worker Deployment Complete!"
echo
log_info "NEXT STEPS:"
log_info "1. Test the worker with manual URLs"
log_info "2. Enable USE_REAL_TIME_TRANSFORMS=true in build script"
log_info "3. Enable useRealTimeTransforms=true in Hugo config"
log_info "4. Run build and test responsive behavior"
echo
log_info "ROLLBACK (if needed):"
log_info "  cp $BACKUP_WORKER $ORIGINAL_WORKER"
log_info "  npx wrangler deploy --env $ENVIRONMENT"
echo
log_info "TESTING URLS:"
log_info "  Original: /collections/animals/farm-animals-collection/thumbnail-300.webp"
log_info "  Enhanced: /collections/animals/farm-animals-collection.webp?w=300&h=400&q=75&fit=cover"
echo

log_success "Deployment successful! 🎉"