#!/usr/bin/env bash
# Stop hook. Exit 2 forces Claude to keep working.
# If the working tree changed but STATE.md did not, refuse to let the session end.
set -uo pipefail

# Fail closed if tooling is missing. Real BSD grep by absolute path (the shell's
# `grep` is aliased to ugrep and `rg` is absent in the hook runtime).
GREP=/usr/bin/grep
command -v jq >/dev/null 2>&1 || { echo "HOOK MISCONFIGURED: jq is not installed. Install jq; this guard fails closed." >&2; exit 2; }
[ -x "$GREP" ] || { echo "HOOK MISCONFIGURED: $GREP not found; this guard fails closed." >&2; exit 2; }

INPUT=$(cat)

# guard against infinite loop
[ "$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0

cd "${CLAUDE_PROJECT_DIR:-.}"

STATUS=$(git status --porcelain 2>/dev/null || true)
CHANGED=$(printf '%s\n' "$STATUS" | $GREP -v 'docs/agent/STATE.md' | $GREP -c . || true)
CHANGED=${CHANGED:-0}

if [ "$CHANGED" -gt 0 ]; then
  if ! printf '%s\n' "$STATUS" | $GREP -q 'docs/agent/STATE.md'; then
    echo "You changed $CHANGED file(s) but did not update docs/agent/STATE.md. Update it now: task, done, in-progress, next, decisions, landmines. A fresh session must be able to resume from it alone. (session-handoff skill)" >&2
    exit 2
  fi
fi
exit 0
