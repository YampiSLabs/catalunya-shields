#!/bin/bash

# Exit immediately if any command exits with a non-zero status
set -e

# Keep stdout/stderr pagers non-interactive
export PAGER=cat
export GIT_PAGER=cat

# Get the directory of the script and go to the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
cd "$PROJECT_ROOT"

echo "=== Catalan Shields Cron Update - $(date) ==="

# 1. Pull latest changes
echo "Pulling latest changes from Git..."
git pull

# 2. Install dependencies (if lockfile changed, etc.)
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# 3. Run normalize to align data
echo "Normalizing municipality data..."
pnpm normalize

# 4. Download up to 10 missing shields
echo "Downloading up to 10 new shields..."
pnpm download:commons -- --limit=10

# 5. Optimize shields
echo "Optimizing newly downloaded shields..."
pnpm optimize:shields

# 6. Generate exports and update shields-status.md
echo "Updating exports and status documentation..."
pnpm generate:outputs

# 7. Run test suite to verify changes
echo "Running test suite..."
pnpm test run

# 8. Check for git changes and commit/push
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Changes detected. Preparing commit..."
  git add .
  
  # Standardized commit message with date
  COMMIT_MSG="feat(auto): download and optimize new municipal shields - $(date +'%Y-%m-%d')"
  git commit -m "$COMMIT_MSG"
  
  echo "Pushing changes to origin..."
  git push
  echo "Successfully pushed auto-updates to GitHub!"
else
  echo "No new shields downloaded or modified. Everything is up to date."
fi

echo "=== Cron Update Completed Successfully - $(date) ==="
