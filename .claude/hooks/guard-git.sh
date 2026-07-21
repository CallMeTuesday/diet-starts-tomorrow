#!/usr/bin/env bash
# PreToolUse on Bash. Blocks the git commands that let discipline slip.
# BLOCK MODE from day one: this guard gates commands, not existing code, so it
# has no violation backlog to migrate.
set -uo pipefail

# Fail closed if tooling is missing. We call the real BSD grep by absolute path:
# the interactive shell aliases `grep` to `ugrep` and provides `rg`, but hooks run
# as non-interactive bash with neither. /usr/bin/grep is always present on macOS
# and GNU-compatible. See .claude/hooks/guard-quality.sh for the full note.
GREP=/usr/bin/grep
command -v jq >/dev/null 2>&1 || { echo "HOOK MISCONFIGURED: jq is not installed. Install jq; this guard fails closed." >&2; exit 2; }
[ -x "$GREP" ] || { echo "HOOK MISCONFIGURED: $GREP not found; this guard fails closed." >&2; exit 2; }

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$CMD" ] && exit 0

fail() { echo "BLOCKED: $1" >&2; exit 2; }
m()    { printf '%s' "$CMD" | $GREP -qE -e "$1"; }

m 'commit.*(--no-verify|-n\b)' && \
  fail "--no-verify. The gate exists for a reason. Fix the code. (commit-discipline)"
m 'git\s+add\s+(-A|--all|\.)(\s|$)' && \
  fail "Blanket 'git add'. Stage explicit paths only. (commit-discipline)"
m 'push\s+.*--force(\s|$)' && \
  fail "--force. Use --force-with-lease, and never on a shared branch. (commit-discipline)"
m 'push\s+.*\b(origin\s+)?(main|master|production)\b' && \
  fail "Direct push to a protected branch. Open a PR. (commit-discipline)"
m 'git\s+(checkout|restore)\s+\.|git\s+reset\s+--hard' && \
  fail "Destructive git command. Confirm with the human first."

exit 0
