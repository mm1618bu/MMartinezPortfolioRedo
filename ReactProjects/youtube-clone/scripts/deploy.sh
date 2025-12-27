#!/bin/bash

# Deployment Script
# Use this to deploy manually or as part of your CD pipeline

set -e

# Configuration
ENVIRONMENT=${1:-production}
BUILD_DIR="build"

echo "🚀 Starting deployment process..."
echo "Environment: $ENVIRONMENT"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Navigate to project directory
cd "$(dirname "$0")/.."

# Step 1: Environment Check
echo -e "${YELLOW}🔍 Step 1/5: Checking environment...${NC}"
if [ ! -f ".env.${ENVIRONMENT}" ] && [ ! -f ".env" ]; then
    echo -e "${RED}❌ Environment file not found${NC}"
    echo "Create .env.${ENVIRONMENT} or .env file"
    exit 1
fi

if [ -f ".env.${ENVIRONMENT}" ]; then
    echo "Using .env.${ENVIRONMENT}"
    cp .env.${ENVIRONMENT} .env
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Step 2: Install Dependencies
echo -e "${YELLOW}📦 Step 2/5: Installing dependencies...${NC}"
npm ci --production=false
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Run Tests
echo -e "${YELLOW}🧪 Step 3/5: Running tests...${NC}"
if CI=true npm test -- --coverage --watchAll=false; then
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi
echo ""

# Step 4: Build
echo -e "${YELLOW}🏗️  Step 4/5: Building for ${ENVIRONMENT}...${NC}"
NODE_ENV=production npm run build

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Build directory not found${NC}"
    exit 1
fi

# Add build metadata
echo "{
  \"version\": \"$(git rev-parse HEAD 2>/dev/null || echo 'unknown')\",
  \"branch\": \"$(git branch --show-current 2>/dev/null || echo 'unknown')\",
  \"buildTime\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"environment\": \"${ENVIRONMENT}\"
}" > ${BUILD_DIR}/metadata.json

BUILD_SIZE=$(du -sh ${BUILD_DIR} | cut -f1)
echo -e "${GREEN}✅ Build complete (${BUILD_SIZE})${NC}"
echo ""

# Step 5: Deploy
echo -e "${YELLOW}🚀 Step 5/5: Deploying to ${ENVIRONMENT}...${NC}"

case $ENVIRONMENT in
  production)
    echo "Deploying to production..."
    # Add your production deployment command here
    # Example: vercel --prod
    # Example: netlify deploy --prod
    # Example: aws s3 sync build/ s3://your-bucket/ --delete
    echo -e "${BLUE}ℹ️  Configure your deployment command in this script${NC}"
    ;;
    
  staging)
    echo "Deploying to staging..."
    # Add your staging deployment command here
    echo -e "${BLUE}ℹ️  Configure your staging deployment command${NC}"
    ;;
    
  preview)
    echo "Deploying preview build..."
    # Add your preview deployment command here
    echo -e "${BLUE}ℹ️  Configure your preview deployment command${NC}"
    ;;
    
  *)
    echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "Deployment details:"
echo "  Environment: $ENVIRONMENT"
echo "  Build size: $BUILD_SIZE"
echo "  Timestamp: $(date)"
echo ""
