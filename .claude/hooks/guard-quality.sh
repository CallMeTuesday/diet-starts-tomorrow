#!/usr/bin/env bash
# PreToolUse on Write/Edit/MultiEdit.
# Exit 2 = BLOCK the edit; stderr is fed back to Claude as the reason.
#
# SCOPED BLOCK MODE. Full exit-2 enforcement with a narrow, named allowlist.
# Every exemption below must have a matching entry in hooks/EXEMPTIONS.md
# (path glob, which check, why, review date). Keep the two files in sync.
#
# The SUPPRESSION checks apply to any TS/JS project. The DESIGN-TOKEN checks
# (raw hex, rgb(), arbitrary Tailwind px/rem, !important) assume a Tailwind +
# CSS-custom-property design system. If your project has no design-token system,
# delete the "Design tokens" block. If it uses a different token file name, edit
# the *globals.css|*tokens.css|*theme.css allowlist.
#
# NOTE: this guard scans the CONTENT of files being written. That means it will
# false-positive on a file that legitimately quotes the banned patterns (this
# guard itself, an anti-pattern table in a skill). Author those files via a Bash
# heredoc instead of the Write tool, or add a path exemption.
set -uo pipefail

# Fail closed if tooling is missing. Matcher note: on some machines the shell
# aliases `grep` to `ugrep` (which silently returns wrong results) and `rg` is
# not on the hook's PATH. So we call the real grep by absolute path: present on
# every macOS/Linux, GNU-compatible (supports \b \s {n,m}), immune to any alias.
GREP=/usr/bin/grep
command -v jq >/dev/null 2>&1 || { echo "HOOK MISCONFIGURED: jq is not installed. Install jq; this guard fails closed." >&2; exit 2; }
[ -x "$GREP" ] || { echo "HOOK MISCONFIGURED: $GREP not found; this guard fails closed." >&2; exit 2; }

INPUT=$(cat)

PATH_=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(printf '%s' "$INPUT" | jq -r '
  [ .tool_input.content?,
    .tool_input.new_string?,
    (.tool_input.edits? // [] | map(.new_string) | join("\n"))
  ] | map(select(. != null)) | join("\n")')

[ -z "$CONTENT" ] && exit 0

fail() { echo "BLOCKED: $1" >&2; exit 2; }
has()  { printf '%s' "$CONTENT" | $GREP -qE -e "$1"; }

# ---------------------------------------------------------------------------
# Suppressions (scanned on every file type). No exemptions by default. If your
# project genuinely needs one, add a `case "$PATH_" in ...` arm here AND a row
# to EXEMPTIONS.md explaining why. See the root-cause-only skill.
# ---------------------------------------------------------------------------
has '@ts-ignore|@ts-expect-error' && \
  fail "TS suppression. Fix the type, do not silence it. (root-cause-only)"

has 'catch\s*\([^)]*\)\s*\{\s*\}' && \
  fail "Empty catch block. Handle the error or let it throw. (root-cause-only)"

has '\bas any\b|as unknown as' && \
  fail "'as any' cast. Model the real shape. (root-cause-only)"

has 'eslint-disable' && \
  fail "eslint-disable. Obey the rule or argue to remove it repo-wide. (root-cause-only)"



# Design-token checks removed: this project is a single-file static HTML app
# with no token system. See CLAUDE.md.

exit 0
