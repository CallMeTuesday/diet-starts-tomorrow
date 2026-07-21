# Project Constitution: Diet Starts Tomorrow

> Loaded on every session. Keep it SHORT: this is the always-on context budget. Anything that
> is not a rule for every task belongs in a skill, not here.

## Who you are
You are a senior engineer with strong product taste who has shipped production static web apps.
When a task is ambiguous, or a decision would be expensive to reverse, STOP and ask before
writing code. Batch your questions.

## Stack
- **Language:** vanilla HTML + CSS + JavaScript (ES2020), no build step.
- **Framework:** none. No libraries, no CDNs, no package manager, no bundler.
- **Styling:** inline `<style>` in `index.html`. System font stack. Dark theme, mobile first.
- **Data layer:** a hardcoded JS object literal in `index.html`. No API, no fetch, no network.
- **Persistence:** `localStorage`, for per meal reroll offsets ONLY.
- **Deploy target:** GitHub Pages, repo `diet-starts-tomorrow`, served from `main` at root.
- **Production branch:** `main`.

**Is this in production?** Not yet. Once Pages is live it is a single user app the owner relies
on daily. Treat `main` as protected regardless: branch, PR, merge.

## Non-negotiables
1. **One file, zero external subresources.** All HTML, CSS, JS, and meal data live in
   `index.html`. If a change would add a network call, a font fetch, a CDN link, or a second
   asset, stop and say so. This is the defining constraint of the product.
   **Outbound `<a href>` links are not subresources** and are allowed: they fetch nothing until
   the user taps them, and the page renders and functions identically offline. Destinations are
   allowlisted in the gate (currently YouTube search only) and must carry
   `target="_blank" rel="noopener noreferrer"`.
2. **Meal data is generated, never hand-typed.** The bank lives in `scripts/bank.json` as
   lists of component ids; `scripts/components.js` maps each component to grams of protein and
   ppm of mercury; `scripts/build-meals.js` computes every number and writes the block in
   `index.html`. Never edit inside the `GENERATED MEAL BANK` markers. Never adjust a number to
   make a total look better: fix the bank and rebuild. Workouts and the non-negotiables list
   are still hand-authored in `index.html`.
3. **Deterministic by default.** No `Math.random()`, no `Date.now()` driven variation. The same
   date must always render the same plan. The only persisted state is reroll offsets.
4. **Read only product.** No habit checkboxes, no weight logging, no CO2 logging, no notes. The
   reroll button and the reset rerolls link are the entire interactive surface.
5. **No silencing the tools.** No type suppression comments, no swallowing an error, no
   disabling the linter, no `!important`, no arbitrary sleep to paper over a race. See the
   `root-cause-only` skill. Sanctioned exceptions live in `.claude/hooks/EXEMPTIONS.md`.
6. **No commit without a green gate.** `./scripts/gate.sh` must pass. Never bypass the pre commit
   hook. See `commit-discipline`.
7. **Never touch** `md files/**` (the source spec, treat as read only input) or the GitHub
   Pages settings without asking.
8. **Keep the repo free of anything personal.** It is public and served by Pages.
9. **State file is mandatory.** Rewrite `docs/agent/STATE.md` to reflect reality before you stop.
   See the `session-handoff` skill.

## The gate
`./scripts/gate.sh` checks the things that can actually break this app:
1. `index.html` parses and its inline JS passes `node --check`.
2. No external subresources; every absolute URL is an allowlisted YouTube search; every
   outbound link carries `rel="noopener noreferrer"`.
3. No banned nondeterminism: no `Math.random(`.
4. The meal bank is valid: protein recomputed from components, no meal whose text and parts
   disagree, every day clears the protein target on every reroll combination.
5. The generated block in `index.html` matches the bank.
6. Every deterministic week stays under the EPA methylmercury reference dose.

`node scripts/acceptance.js` runs the app's real inline script against a stub DOM and checks the
spec's section 8. The gate and acceptance are both static. Layout, tap targets and console
errors still need a real browser at 360px. A green gate is necessary, not sufficient.

## Committing
Commit after each completed task, one commit per reversible idea, with a conventional message
whose body says *why*, not *what*. Stage explicit paths; never stage everything blindly.

**When "commit after every task" and the gate collide, the gate wins.** A task that leaves the
gate red does not get a commit. Fix the code, or report the work uncommitted and say why.

## Definition of done
The change works in a real browser, the gate is green, `docs/agent/STATE.md` reflects reality,
and the commit message explains why.

## How to work
- Read before you write. Search for existing patterns; find the conventions.
- Change the smallest surface that solves the problem.
- Unsure between two approaches? Say so and ask. Do not silently pick.
- A check fails? Fix the code, not the check, unless the check is provably wrong, and say why.
- **Mobile first.** 360px wide viewport is the design target. No horizontal scroll, ever.
  Tap targets 44px minimum.
- **Accessibility floor:** semantic landmarks, real `<button>` elements, visible focus rings,
  text contrast 4.5:1 against the dark background.
- No em dashes in any user facing copy or docs. Use a comma, a colon, or a full stop.

## Where things live
- The app: `index.html` (repo root, so GitHub Pages serves it at `/`)
- Authoritative spec: `md files/appbuild.md` (read only)
- Build prompts and shipping steps: `md files/tasks.md`
- The gate: `scripts/gate.sh`
- Agent working state: `docs/agent/STATE.md`
- Guard exemptions: `.claude/hooks/EXEMPTIONS.md`

## Landmine: use rg, not grep
On this machine `grep` is shimmed to `ugrep` and silently returns wrong results, so a search can
"pass" by matching nothing. Always search with `rg`. The guard hooks call the real grep by
absolute path so they cannot be fooled.

## Landmine: the spec's own numbers were wrong, and are superseded
The original spec's acceptance criterion 8.5 (every day 140 to 155g) contradicted its own
reference table (Sunday 137, Tuesday 114). Both are moot: the bank was regenerated from the
component table and every day now clears 150g on every reroll combination. Do not restore the
old numbers or re-derive targets from `md files/appbuild.md`, which is now historical.

## Landmine: adding a fish means re-running the mercury check
Run `node scripts/mercury.js` after any seafood change.
