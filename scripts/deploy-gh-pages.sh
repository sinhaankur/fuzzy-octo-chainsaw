#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REMOTE_URL="$(git remote get-url origin)"
REPO_NAME="$(printf '%s' "$REMOTE_URL" | sed -E 's#^.*/([^/]+)\.git$#\1#; s#^.*/([^/]+)$#\1#')"
OWNER_NAME="$(printf '%s' "$REMOTE_URL" | sed -E 's#^.*[:/]([^/]+)/[^/]+(\.git)?$#\1#')"
BASE_PATH="/${REPO_NAME}/"
WEB_API_URL="${VITE_WS_API_URL:-https://api.worldmonitor.app}"

TMP_WORKTREE="$(mktemp -d /tmp/wm-gh-pages.XXXXXX)"
cleanup() {
  git worktree remove "$TMP_WORKTREE" --force >/dev/null 2>&1 || true
  rm -rf "$TMP_WORKTREE"
}
trap cleanup EXIT

echo "[deploy] Repo: ${OWNER_NAME}/${REPO_NAME}"
echo "[deploy] Base path: ${BASE_PATH}"
echo "[deploy] API base: ${WEB_API_URL}"

git fetch origin --prune

git worktree add "$TMP_WORKTREE" gh-pages

npm run build:blog
npx tsc
VITE_WS_API_URL="$WEB_API_URL" npx vite build --base="$BASE_PATH"

find "$TMP_WORKTREE" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a dist/. "$TMP_WORKTREE/"
cp dist/index.html "$TMP_WORKTREE/404.html"
touch "$TMP_WORKTREE/.nojekyll"

cd "$TMP_WORKTREE"
git add -A

if git diff --cached --quiet; then
  echo "[deploy] No changes to publish on gh-pages"
  exit 0
fi

git commit -m "Deploy app build to GitHub Pages"
git push origin gh-pages --force-with-lease

echo "[deploy] Done: https://${OWNER_NAME}.github.io/${REPO_NAME}/"
