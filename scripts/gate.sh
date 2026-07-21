#!/usr/bin/env bash
# The gate. Must be green before any commit. See CLAUDE.md.
#
# Checks the things that can actually break this app:
#   1. index.html exists and its inline JS parses (node --check).
#   2. No external references. The one file, zero network rule is the product.
#   3. No nondeterminism. The same date must always render the same plan.
#
# Calls the real grep by absolute path: on this machine `grep` is shimmed to
# `ugrep`, which silently returns wrong results, so a check could "pass" by
# matching nothing.
set -uo pipefail

GREP=/usr/bin/grep
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$ROOT/index.html"
FAILED=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILED=1; }

command -v node >/dev/null 2>&1 || { echo "GATE MISCONFIGURED: node not installed."; exit 1; }
[ -x "$GREP" ] || { echo "GATE MISCONFIGURED: $GREP not found."; exit 1; }

echo "Gate: diet-starts-tomorrow"

if [ ! -f "$APP" ]; then
  echo "  SKIP  index.html does not exist yet. Gate has nothing to check."
  echo
  echo "GATE GREEN (nothing built yet)"
  exit 0
fi

# --- 1. inline JS parses -----------------------------------------------------
# node --check dispatches on the file extension, so the temp file must end .js.
JSDIR="$(mktemp -d -t dst-gate)"
JS="$JSDIR/inline.js"
trap 'rm -rf "$JSDIR"' EXIT
python3 - "$APP" > "$JS" <<'PY'
import re, sys
html = open(sys.argv[1], encoding='utf-8').read()
blocks = re.findall(r'<script\b[^>]*>(.*?)</script>', html, re.S | re.I)
print('\n;\n'.join(blocks))
PY

if [ ! -s "$JS" ]; then
  fail "no inline <script> block found in index.html"
else
  if node --check "$JS" 2>/tmp/dst-gate-node.err; then
    pass "inline JS parses"
  else
    fail "inline JS has a syntax error:"
    sed 's/^/        /' /tmp/dst-gate-node.err
  fi
fi

# --- 2a. no external SUBRESOURCES -------------------------------------------
# The rule that matters is that the page loads nothing over the network. These
# patterns are all things the browser fetches on its own. An <a href> is NOT one
# of them: it fetches nothing until the user taps it, and the page renders and
# functions identically offline either way. That distinction is the whole reason
# 2b exists separately.
SUB='(^|[^:])//(cdn|unpkg|cdnjs)|<link[^>]+href=|<script[^>]+src=|<img[^>]+src=|<iframe|srcset=|@import|\bfetch\(|XMLHttpRequest|navigator\.sendBeacon|@font-face|url\(["'"'"']?https?:'
if $GREP -qEn "$SUB" "$APP"; then
  fail "external subresource found (breaks the one file, zero network rule):"
  $GREP -Ein "$SUB" "$APP" | sed 's/^/        /'
else
  pass "no external subresources"
fi

# --- 2b. outbound links: allowlisted destinations only -----------------------
# Every absolute URL in the file must be a YouTube search link. Anything else,
# including a tracking pixel dressed up as a link or a hardcoded video id that
# will rot, fails here.
STRAY=$($GREP -oE 'https?://[^"'"'"' )]+' "$APP" \
        | $GREP -vE '^https://www\.youtube\.com/results\?search_query=' || true)
if [ -n "$STRAY" ]; then
  fail "absolute URL that is not an allowlisted YouTube search:"
  printf '%s\n' "$STRAY" | sort -u | sed 's/^/        /'
else
  N=$($GREP -oE 'https://www\.youtube\.com/results' "$APP" | wc -l | tr -d ' ')
  pass "outbound links ok ($N YouTube search links, no other absolute URLs)"
fi

# --- 2c. every outbound link must be safe to open ---------------------------
# target="_blank" without rel="noopener" hands the opened page a handle back to
# this one via window.opener.
TOTAL=$($GREP -oE '<a class="ex"' "$APP" | wc -l | tr -d ' ')
SAFE=$($GREP -oE '<a class="ex" target="_blank" rel="noopener noreferrer"' "$APP" | wc -l | tr -d ' ')
if [ "$TOTAL" = "$SAFE" ] && [ "$TOTAL" != "0" ]; then
  pass "outbound links carry rel=noopener noreferrer"
else
  fail "an outbound link is missing rel=\"noopener noreferrer\" ($SAFE/$TOTAL safe)"
fi

# --- 3. deterministic --------------------------------------------------------
if $GREP -qEn 'Math\.random\(' "$APP"; then
  fail "Math.random() found. The same date must always render the same plan:"
  $GREP -En 'Math\.random\(' "$APP" | sed 's/^/        /'
else
  pass "no nondeterminism"
fi

# --- 4. meal bank integrity --------------------------------------------------
# The protein numbers in index.html are generated. If someone hand-edits them,
# or edits the bank without rebuilding, these two catch it.
if node "$ROOT/scripts/validate-bank.js" >/tmp/dst-bank.out 2>&1; then
  pass "meal bank valid (protein recomputed, no text/parts drift)"
else
  fail "meal bank invalid:"
  sed 's/^/        /' /tmp/dst-bank.out | tail -20
fi

if node "$ROOT/scripts/build-meals.js" --check >/dev/null 2>&1; then
  pass "generated meal block matches the bank"
else
  fail "index.html meal block is stale. Run: node scripts/build-meals.js"
fi

# --- 5. methylmercury --------------------------------------------------------
# Every deterministic week must stay under the EPA reference dose, and no single
# slot may stack more than two high-mercury options (which a reroll could walk
# into). Adding a fish to the bank without checking this is the easy mistake.
if node "$ROOT/scripts/mercury.js" --check >/tmp/dst-hg.out 2>&1; then
  pass "$(tail -1 /tmp/dst-hg.out | sed 's/^ *PASS *//')"
else
  fail "methylmercury check:"
  grep -E '^(FAIL|  x)' /tmp/dst-hg.out | sed 's/^/        /'
fi


echo
if [ "$FAILED" -eq 0 ]; then
  echo "GATE GREEN"
  exit 0
fi
echo "GATE RED"
exit 1
