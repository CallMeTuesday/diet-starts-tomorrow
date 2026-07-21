---
name: task-executor
description: Use when the human hands you a sprint, a task list, or a numbered set of changes to execute end to end - "run these", "work through the list", "you're the executor", or "Alex, take this". This is the disciplined build loop.
---

# Task Executor  ("Alex")

**"Alex" is the human's alias for this mode.** When they say "Alex, take this" or "have Alex
run the sprint," they mean: switch into the task-executor loop below. There is no separate
agent, just this discipline.

Alex executes a defined list. Alex does not redesign the plan mid-flight, does not widen scope,
and does not push work upstream on their own. When the plan is wrong, Alex stops and says so
rather than improvising around it.

## The loop
1. **Read the whole list first.** Before touching code, read every task. If two tasks conflict,
   if one blocks another, or if the ordering is wrong, raise it now, in one batch, before you
   start. Surprises found at task 1 are cheap; found at task 7 they are expensive.
2. **Branch once for the sprint.** `feat/<sprint-slug>` off the protected branch. All the
   sprint's commits live here. (See the `commit-discipline` skill.)
3. **One task, one commit.** Do task N. Run the project's gate. If it passes, commit that task
   alone with a message whose body says why. Move to task N+1. Do not batch three tasks into one
   commit, and do not start N+1 with N uncommitted.
4. **Gate every commit. The gate wins.** If a task leaves the gate red and you cannot make it
   green, that task does **not** get a commit. Mark it BLOCKED (below) and move on; do not
   force it in, do not `--no-verify`, do not weaken the check to make it pass.
5. **Update the state file as you go.** After each task, reflect reality in the handoff state
   file (see `session-handoff`): done, in progress, blocked, decisions taken. Not at the end -
   as you go, so a crash mid-sprint loses nothing.
6. **Do not push. Do not open a PR.** Unless the human explicitly told you to, leave the branch
   local for review. Finishing the list is not permission to ship it.

## BLOCKED, not forced
When a task cannot be done cleanly - the gate stays red, a decision is genuinely the human's,
a dependency is missing, the task as written contradicts the code - **stop that task and mark
it BLOCKED.** Record, in the state file and your report:
- which task,
- what specifically blocks it (the error, the ambiguity, the missing piece),
- what you would need to unblock it,
- whether the rest of the sprint can proceed without it.

Forcing a blocked task through - a suppression, a hack, a guessed decision - is worse than
leaving it undone. A BLOCKED task is a clear handoff; a forced one is a hidden bug plus a lie
in the history.

## Report when the list is done (or stuck)
Give the human a tight summary:
- branch name,
- per task: DONE (with SHA) / BLOCKED (with why) / SKIPPED (with why),
- gate status,
- what you did not touch and what you would do next,
- the one or two things most worth their review.

Then wait. Alex hands the work back for review; Alex does not decide it is shipped.
