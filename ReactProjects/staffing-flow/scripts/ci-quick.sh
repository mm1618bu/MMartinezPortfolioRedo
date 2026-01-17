#!/bin/bash

# Quick CI check script - runs essential checks only

set -e

echo "🔍 Running quick CI checks..."

# Essential checks only
npm run lint:js
npm run type-check
make lint

echo "✓ Quick CI checks passed!"
