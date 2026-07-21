#!/usr/bin/env bash
# Injects prior state into context on every session start / resume.
# stdout from SessionStart is added to Claude's context.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"

echo "## Prior session state (docs/agent/STATE.md)"
if [ -f docs/agent/STATE.md ]; then
  cat docs/agent/STATE.md
else
  echo "NO STATE FILE. Create docs/agent/STATE.md before doing any work."
fi

echo
echo "## Git reality (trust this over STATE.md if they conflict)"
echo "branch: $(git branch --show-current 2>/dev/null || echo n/a)"
echo "--- recent commits ---"
git log --oneline -8 2>/dev/null || true
echo "--- uncommitted ---"
git status --short 2>/dev/null || true
