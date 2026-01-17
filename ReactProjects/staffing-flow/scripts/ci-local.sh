#!/bin/bash

# CI Local Test Script
# Simulates CI pipeline checks locally before pushing

set -e  # Exit on first error

echo "🚀 Running local CI checks..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED_CHECKS=()

run_check() {
    local name=$1
    local command=$2
    
    echo -e "${YELLOW}➤ Running: $name${NC}"
    
    if eval "$command"; then
        echo -e "${GREEN}✓ $name passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ $name failed${NC}"
        echo ""
        FAILED_CHECKS+=("$name")
        return 1
    fi
}

# 1. Format Check
run_check "Prettier Format Check" "npm run format:check" || true

# 2. ESLint
run_check "ESLint (JavaScript/TypeScript)" "npm run lint:js" || true

# 3. Python Linting
run_check "Ruff (Python Linting)" "make lint" || true

# 4. Black Format Check
run_check "Black (Python Format Check)" "black --check python tests" || true

# 5. TypeScript Type Check - Web
run_check "TypeScript Type Check (Frontend)" "npm run type-check:web" || true

# 6. TypeScript Type Check - API
run_check "TypeScript Type Check (Node API)" "npm run type-check:api" || true

# 7. Python Tests
run_check "Python Tests" "make test" || true

# 8. Build Frontend
run_check "Build Frontend" "npm run build:web" || true

# 9. Build Node API
run_check "Build Node API" "npm run build:api" || true

# 10. Python Syntax Check
run_check "Python Syntax Check" "python3 -m py_compile python/*.py" || true

echo ""
echo "═══════════════════════════════════════════════════════"

# Summary
if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All CI checks passed! 🎉${NC}"
    echo "You're good to push your changes."
    exit 0
else
    echo -e "${RED}✗ ${#FAILED_CHECKS[@]} check(s) failed:${NC}"
    for check in "${FAILED_CHECKS[@]}"; do
        echo -e "  ${RED}• $check${NC}"
    done
    echo ""
    echo "Please fix the issues before pushing."
    exit 1
fi
