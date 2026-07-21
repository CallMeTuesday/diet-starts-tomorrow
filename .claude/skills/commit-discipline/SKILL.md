---
name: commit-discipline
description: Use whenever committing, staging, branching, pushing, or opening a PR - any git write. Governs how work enters history.
---

# Commit Discipline

History is a design artifact. Someone will `git blame` this line at 2am during an incident and
need the commit to explain itself. Write for that reader.

## Never
- `--no-verify` / `-n`. The gate exists to catch exactly what you are about to skip. Fix the code.
- `git add -A` / `git add .` / blanket staging. You stage what you reviewed, nothing else.
- `push --force` on a shared branch. Use `--force-with-lease`, and only on your own branch.
- Committing straight to the protected branch (`main` / `master` / `production`). Open a PR.

A guard hook (`hooks/guard-git.sh`) blocks these. If it fires, it caught a real mistake - do
not route around it.

## The gate
Before **every** commit, in order:
1. `git status` - know exactly what is staged and what is not.
2. `git diff --staged` - read what you are about to commit. Every line. No stray debug logs,
   no commented-out code, no unrelated churn.
3. Run the project's gate and let it pass. The gate command lives in the project `CLAUDE.md`
   (typically a typecheck + lint, plus tests once a runner exists). Chain it so a red gate
   cannot produce a commit:

   ```bash
   if <gate>; then git commit -m "..."; else echo "gate red, not committing"; fi
   ```

   Do not run the gate and the commit as two separate statements you eyeball. A newline is not
   a guard; `&&` / an `if` is. (This exact slip - listing the gate and the commit on separate
   lines - once produced a commit on a red typecheck.)

## One commit per reversible idea
A commit is the unit of revert. If reverting it would undo two unrelated things, it is two
commits. Use `git add -p` to split a working tree into coherent commits; stage explicit paths,
never everything at once.

## Message format
```
<type>(<scope>): <summary in the imperative, under ~70 chars>

<why this change exists - the problem, the constraint, the tradeoff. NOT a
restatement of the diff. The diff already says what changed.>
```
`type` is one of `feat|fix|refactor|chore|docs|test|perf|build`. The body is mandatory for
anything non-trivial and it answers **why**, not what. "Fix login bug" is not a message; "Refresh
the token on 401 instead of on a timer, so an in-flight request never uses a stale token" is.

No em dashes in commit messages or any project copy. Use a comma, a colon, or a full stop.

## Branching
Branch off the protected branch, one branch per task or sprint: `feat/<short-slug>`,
`fix/<short-slug>`. Do the work there, gate each commit, then push the branch and open a PR
against the protected branch. Do not push the branch until the human asks, unless the project
says otherwise.

## Before you say "done"
Report, concretely:
- the branch and the commit SHAs you produced,
- that the gate passed (say which checks ran),
- what you deliberately did NOT do (deferred work, skipped edge cases, follow-ups),
- anything you are unsure about.

A silent "done" hides exactly the things the human needs to review.
