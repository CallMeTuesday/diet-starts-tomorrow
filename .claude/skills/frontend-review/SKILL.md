---
name: frontend-review
description: Use before opening a PR that touches UI, or when the user asks to review, audit, critique, or check frontend, component, or design work.
---

# Frontend Review

Review your own diff as a hostile senior engineer. Report findings; do not silently fix without
saying what you changed. (This skill pairs with `design-system`; skip the token pass if the
project has no token system.)

## Pass 1 - Tokens
Use `rg`, never `grep` (on some machines `grep` is shimmed to `ugrep` and silently returns
nothing, which would make this check pass while catching nothing):
```bash
git diff | rg -nE '#[0-9a-fA-F]{3,8}|rgb\(|\[[0-9]+px\]|!important'
```
Must come back empty, except for the paths in `hooks/EXEMPTIONS.md`.

## Pass 2 - Reuse
Did you create a component that duplicates an existing primitive? Search the primitive directory
with `rg`. Duplication is the main way design systems die.

## Pass 3 - States
Every new component: loading, empty, error, success, disabled. A missing state is not "later,"
it is "not done."

## Pass 4 - Accessibility
- Semantic element, not a `div` with an `onClick`.
- Keyboard operable, visible focus.
- Labels / `aria-*` on anything non-obvious.
- Contrast checked, not assumed.

## Pass 5 - Speed
- An unnecessary client component? (a `'use client'` on a leaf that could be server-rendered)
- A re-render caused by an inline object / array / function prop?
- An image without dimensions, causing layout shift?

## Pass 6 - The honest question
> If I saw this diff in someone else's PR, what would I flag?

Write that down. Then fix it, or flag it explicitly. The one thing you are hoping the reviewer
will not notice is the thing to raise first.
