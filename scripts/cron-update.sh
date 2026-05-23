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

if [[ -n "${GITHUB_PAT:-}" ]]; then
  echo "Configuring GitHub token auth for origin..."
  git remote set-url origin "https://oauth2:${GITHUB_PAT}@github.com/YampiSLabs/catalunya-shields.git"
else
  echo "WARNING: GITHUB_PAT not set. Push may fail unless the runtime already has Git credentials."
fi

git config user.name "${GIT_AUTHOR_NAME:-BeatrizAgent}"
git config user.email "${GIT_AUTHOR_EMAIL:-beatrizagent@users.noreply.github.com}"

# 1. Start from the latest main and discard stale artifacts from failed runs
echo "Resetting workspace to origin/main..."
git fetch origin main
git reset --hard origin/main
git clean -fd raw/svg assets/svg src docs
git clean -fdX data/commons-candidates

# 2. Install dependencies (if lockfile changed, etc.)
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# 3. Run normalize to align data
echo "Normalizing municipality data..."
pnpm normalize

# 4. Dry-run first so the job logs candidates without mutating tracked data
echo "Dry-running Commons candidate review (limit 10)..."
pnpm download:commons -- --dry-run --limit=10

# 5. Download up to 10 missing shields
echo "Downloading up to 10 new shields..."
pnpm download:commons -- --limit=10

# 6. Optimize shields
echo "Optimizing newly downloaded shields..."
pnpm optimize:shields

# 7. Generate exports and update shields-status.md
echo "Updating exports and status documentation..."
pnpm generate:outputs

# 8. Run test suite to verify changes
echo "Running test suite..."
pnpm test run

# 9. Check for generated shield changes and commit/push
if [[ -n "$(git status --porcelain -- raw/svg assets/svg src/index.ts docs/shields-status.md)" ]]; then
  echo "Changes detected. Preparing commit..."
  git add raw/svg assets/svg src/index.ts docs/shields-status.md
  
  # Standardized commit message with date
  COMMIT_MSG="feat(auto): download and optimize new municipal shields - $(date +'%Y-%m-%d')"
  git commit -m "$COMMIT_MSG"
  
  echo "Pushing changes to origin main..."
  git push origin main
  echo "Successfully pushed auto-updates to GitHub!"
else
  echo "No new shields downloaded or modified. Everything is up to date."
fi

echo "=== Cron Update Completed Successfully - $(date) ==="
