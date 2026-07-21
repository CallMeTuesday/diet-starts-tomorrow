# Guard Exemptions

The quality guard (`hooks/guard-quality.sh`) runs in **scoped block mode**: it blocks on
violation, with a narrow, named allowlist. This file IS that allowlist. Every exemption the
guard grants must have a row here, and every row here must match a `case` arm in the guard.
Keep the two in sync.

## Rules for this file
- An exemption is scoped to a **path glob**, names the **specific check** it exempts, gives a
  one-line **why**, and carries a **review date**. No blanket "turn the guard off here" rows.
- **New code gets no exemptions.** Exemptions exist to migrate vendored or legacy code that
  predates the guard, or a value the guard cannot express (a third-party file you re-pull, a
  renderer whose geometry is genuinely off the design scale). If you are writing the code
  fresh, fix it instead.
- On the review date, re-check the row. If the reason no longer holds, delete the row AND the
  guard's `case` arm, and fix the code.

## Active exemptions

| # | Path glob | Check exempted | Why | Review by |
|---|-----------|----------------|-----|-----------|
| _(none yet)_ | | | | |

<!--
Example rows (delete once you have real ones). Each needs a matching case arm in guard-quality.sh:

| 1 | src/components/ui/** | raw-hex, arbitrary-tailwind | Vendored from a component registry; re-pulled, not hand-edited | 2026-12-31 |
| 2 | src/db/index.ts       | as-any                      | ORM singleton needs one cast the types cannot express          | 2026-12-31 |
-->
