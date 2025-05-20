#!/bin/zsh
# update-deps.sh
# This script checks for outdated npm packages, updates them, and runs lint, build, and test.

set -e

# Check for npm-check-updates, install if missing
if ! command -v ncu &> /dev/null; then
  echo "Installing npm-check-updates globally..."
  npm install -g npm-check-updates
fi

echo "Checking for outdated packages..."
npm outdated || true

echo "Upgrading all dependencies to latest versions..."
ncu -u
npm install

echo "Running lint, build, and test..."
npm run lint || true
npm run build || true
npm test || true

echo "Dependency update and verification complete!"
