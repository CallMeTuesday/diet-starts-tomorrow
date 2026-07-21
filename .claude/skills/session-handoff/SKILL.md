---
name: session-handoff
description: Use at the start of every session to load prior state, and before ending, pausing, or compacting to persist state. Use when the user says resume, pick up, where were we, continue, wrap up, save state, or when context is about to run out.
---

# Session Handoff

Context does not survive. `docs/agent/STATE.md` does. It is the only memory you have.

## At session start — ALWAYS, before anything else
```bash
cat docs/agent/STATE.md
git log --oneline -10
git status
git branch --show-current
```
Then state in one line: *"Resuming: <task>. Last step: <X>. Next: <Y>."*
If `STATE.md` contradicts `git status`, **trust git** and correct `STATE.md` before working.

## During work
Update `STATE.md` after every meaningful step, not at the end. If the session dies mid-task, that file is all that survives.

## STATE.md contract
```markdown
# Current State
_Updated: <ISO timestamp> - Branch: <branch>_

## Task
<one paragraph: what we are building and why. A stranger should understand.>

## Done
- [x] <step> - commit <sha>

## In progress
- [ ] <the exact thing being worked on right now>
  - Files touched but uncommitted: <paths>
  - Approach: <the mechanism, so a fresh session does not rederive it>

## Next
1. <the literal next action>
2. <then this>

## Decisions made
- <decision> - because <reason>. Rejected <alternative> because <reason>.

## Blocked / open questions
- <thing needing a human>

## Landmines
- <"the /api/sync endpoint has a 30s timeout, do not add work to it">
```

## Before ending, compacting, or when context feels tight
1. Commit, or explicitly note uncommitted work
2. Rewrite `STATE.md` in full; do not append fragments
3. Verify: *could a fresh session with zero context resume from this file alone?* If no, rewrite it.
4. Commit `STATE.md` itself

## Anti-patterns
- Writing "continue where I left off" is useless. Write the literal next command.
- Recording *what* you did without *why*; the next session will undo it.
- Letting `STATE.md` go stale. A lying state file is worse than an empty one.
