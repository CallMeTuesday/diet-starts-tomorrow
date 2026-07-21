---
name: root-cause-only
description: Use whenever fixing a bug, chasing an error, a failing check, a flaky test, or a race - anytime the temptation is to silence a symptom instead of removing its cause.
---

# Root Cause Only

A fix that hides the symptom is not a fix. It is a second bug wearing the first one's clothes.

## The banned list
None of these ship. Each one converts a loud failure into a silent one.

| Cheap fix | What it actually does |
| --- | --- |
| `@ts-ignore` / `@ts-expect-error` | Blinds the type checker to a real mismatch |
| `as any` / `as unknown as` | Throws away the type instead of modelling it |
| `eslint-disable` | Silences the rule instead of satisfying it |
| empty `catch {}` | Swallows the error so it fails later, elsewhere, unexplained |
| `!important` | Wins the cascade fight by breaking the cascade |
| optional-chaining a value that must exist (`a?.b?.c`) | Hides a null that should never be null |
| an arbitrary `setTimeout` to "fix" a race | Reorders the symptom without removing the race |
| a retry loop around a call that shouldn't fail | Masks the reason it failed |
| deleting or skipping the failing test | Deletes the evidence |

If one of these is genuinely the right call, it is an EXEMPTION: it goes in
`hooks/EXEMPTIONS.md` with a path, a reason, and a review date, and you say so out loud.
New code does not get exemptions.

## The procedure
1. **Reproduce it.** A bug you cannot trigger on demand is not understood yet. Get a
   deterministic repro before you touch anything.
2. **Explain the mechanism in one paragraph.** Name the actual cause: which value, which
   line, which order of events. If you cannot write that paragraph, you are still guessing -
   keep investigating, do not start editing.
3. **Fix the cause.** Change the thing the paragraph named, not the symptom downstream of it.
4. **Re-drive the repro.** Confirm the original trigger no longer reproduces.
5. **Note the blast radius.** Search for other call sites of what you changed (`rg`, never
   `grep`) and confirm you did not move the bug next door.

## When the real fix is out of scope
Sometimes the proper fix is large and the moment is wrong. Do not sneak in a cheap patch.
Present both, and stop:

> **Root cause:** the session token is refreshed on a timer that can fire mid-request, so an
> in-flight call uses the old token. **Proper fix:** refresh on 401 with a request queue
> (~half a day, touches the fetch layer). **Cheap patch:** widen the timer window (hides it
> until traffic grows). I recommend the proper fix. Which do you want?

Then wait for the human. Naming the tradeoff honestly is the job; choosing silently is not.
