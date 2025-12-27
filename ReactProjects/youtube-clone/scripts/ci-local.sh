#!/bin/bash

# CI/CD Local Testing Script
# Run this before pushing to test CI pipeline locally

set -e

echo "🚀 Running local CI/CD checks..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to project directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm ci
    echo ""
fi

# Step 1: Lint Check
echo -e "${YELLOW}🔍 Step 1/6: Running ESLint...${NC}"
if npm run lint 2>&1 | tee /tmp/lint-output.txt; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${RED}❌ Linting failed${NC}"
    echo "Review the errors above and run: npm run lint:fix"
    exit 1
fi
echo ""

# Step 2: Format Check
echo -e "${YELLOW}💅 Step 2/6: Checking code formatting...${NC}"
if command -v prettier &> /dev/null; then
    if npm run format:check 2>&1; then
        echo -e "${GREEN}✅ Formatting check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Formatting issues found. Run: npm run format${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Prettier not installed. Skipping format check.${NC}"
fi
echo ""

# Step 3: Run Tests
echo -e "${YELLOW}🧪 Step 3/6: Running tests...${NC}"
if CI=true npm test -- --coverage --watchAll=false 2>&1 | tee /tmp/test-output.txt; then
    echo -e "${GREEN}✅ Tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi
echo ""

# Step 4: Security Audit
echo -e "${YELLOW}🔒 Step 4/6: Running security audit...${NC}"
if npm audit --audit-level=high 2>&1 | tee /tmp/audit-output.txt; then
    echo -e "${GREEN}✅ No high-severity vulnerabilities found${NC}"
else
    echo -e "${YELLOW}⚠️  Security vulnerabilities detected${NC}"
    echo "Review the audit report above"
fi
echo ""

# Step 5: Build
echo -e "${YELLOW}🏗️  Step 5/6: Building application...${NC}"
# Create temporary .env for build
if [ ! -f ".env" ]; then
    echo "REACT_APP_SUPABASE_URL=test" > .env.test
    echo "REACT_APP_SUPABASE_ANON_KEY=test" >> .env.test
    mv .env.test .env
    BUILD_CLEANUP=true
fi

if CI=false npm run build 2>&1 | tee /tmp/build-output.txt; then
    echo -e "${GREEN}✅ Build successful${NC}"
    
    # Show build size
    if [ -d "build" ]; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        echo -e "${GREEN}📦 Build size: $BUILD_SIZE${NC}"
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
    [ "$BUILD_CLEANUP" = true ] && rm -f .env
    exit 1
fi

# Cleanup temporary .env
[ "$BUILD_CLEANUP" = true ] && rm -f .env
echo ""

# Step 6: Check for outdated packages
echo -e "${YELLOW}📋 Step 6/6: Checking for outdated packages...${NC}"
npm outdated 2>&1 | head -20 || true
echo ""

# Summary
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All CI checks passed!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "Your code is ready to push! 🚀"
echo ""
echo "Next steps:"
echo "  1. Review any warnings above"
echo "  2. Commit your changes"
echo "  3. Push to trigger GitHub Actions"
echo ""
