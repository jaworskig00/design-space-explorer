# Design Space Explorer — agent guide

Portfolio app: a static, linked-view D3 dashboard over about 10,000 synthetic airfoil designs. Read `docs/PLAN.md` and `docs/DECISIONS.md` before writing code. Do not rediscover the product from the README.

## Autonomous workflow

Work milestone by milestone, task by task, in the order of `docs/PLAN.md`.

After each task:

1. Run that task's verify step.
2. Once the package exists (M0.2 onward), run `pnpm lint && pnpm typecheck && pnpm test`. Run `pnpm build` when the task touches the app shell, charts, or the public dataset.
3. Commit with a Conventional Commit message (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `perf:`, `refactor:`). One task, one commit.
4. Push to `origin` on `main`.
5. Tick the checkbox in `docs/PLAN.md`.
6. Append a short entry to `docs/PROGRESS.md`: what changed, how it was verified, follow-ups.

If a push breaks CI, the next task is the fix. Do not start a later milestone while CI is red.

Do not stop to ask questions. If something is ambiguous, pick the option already written in `docs/DECISIONS.md`. If it is not written there, choose the most sensible option, record it in `docs/DECISIONS.md` and `docs/QUESTIONS.md`, and continue.

Stop only for a true blocker no default can solve (missing credentials, no permission to push). Log it in `docs/QUESTIONS.md`, skip to the next independent task, and keep going.

Verify visual work yourself. Run the app, take Playwright screenshots, check them against the acceptance criteria, and keep the key frames in `docs/screenshots/`.

After M0, every commit must leave `pnpm install && pnpm dev` working.

Do not add paid services or API keys. Do not add an LLM or an ML model in v1.

At the end of M9: polish the README, tag `v1.0.0`, and list anything still open in `docs/QUESTIONS.md`.

## Commands

These exist only after the matching milestone. Do not invent parallel scripts.

| When | Command |
| --- | --- |
| M0.2+ | `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` |
| M0.4+ | `pnpm e2e` (Playwright against `pnpm preview`) |
| M1+ | `cd data && uv sync && uv run python generate.py` |
| M1+ | `cd data && uv run python -m unittest discover -s tests -v` |

Node on CI is 22 (`.nvmrc`). Package manager is pnpm. Python is 3.12 via uv, with NumPy as the only data dependency.

## Git

- Branch: `main` only. No long-lived branches and no pull requests for this repo's own work.
- Tag a finished milestone: `v0.1.0-m0`, `v0.2.0-m1`, … and `v1.0.0` after M9. Update `CHANGELOG.md` at each tag.
- Never force-push, never rewrite pushed history, never skip hooks.
- Never commit secrets, `.env` files, `node_modules`, `.venv`, or large binaries. The generated `public/data/designs.f32` is about 400 KB and is committed on purpose in M1. Do not use Git LFS.
- Do not change `git config`.

## Repo layout

```
src/                 React app (after M0)
src/data/            loader, table, NACA shape
src/state/           Zustand store and pure filter
src/lib/             pareto, url state, motion
src/charts/          D3 + canvas views
src/components/      toolbar, details, dashboard shell
data/                Python generator, model, tests, MODEL.md, SCHEMA.md
public/data/         designs.f32 + schema.json (M1)
e2e/                 Playwright
docs/PLAN.md         task list
docs/DECISIONS.md    ADRs
docs/PROGRESS.md     log
docs/QUESTIONS.md    open items
docs/screenshots/    frames for the README
```

## Engineering rules

- TypeScript strict. No `any` unless a D3 callback has no usable type, and then narrow it on the next line.
- Import D3 modules (`d3-scale`, `d3-axis`, `d3-brush`, `d3-zoom`, `d3-selection`, `d3-transition`, `d3-shape`, `d3-quadtree`, `d3-delaunay`, `d3-scale-chromatic`, `d3-array`, `d3-ease`). Never `import * as d3 from "d3"`.
- The 10k-row table is not React state. Load it once. Zustand holds brushes, view settings, hover id, and selected id. Recompute the filter mask inside brush actions.
- Hover updates must not re-render the React tree. Chart layers subscribe to the store outside render.
- D3 owns the DOM under a chart ref. React does not reconcile those children.
- Canvas backing store uses `devicePixelRatio`, capped at 2.
- One inclusive range per column. A 2D brush writes two 1D ranges.
- Respect `prefers-reduced-motion`: skip positional transitions when it matches.
- UI copy is English.
- No Tailwind. Tokens live in CSS modules / `src/styles/tokens.css`.
- Tests first for pure functions (filter, pareto, URL roundtrip, NACA vs Python golden file). Playwright covers the linked-view smoke and the performance budgets.

## Definition of done for a task

The checkbox is the contract. A task is done only when its acceptance line is true and the verify command passed. Do not tick a task because the code "looks right".

## Preflight

Before M0.1, run the checklist at the top of `docs/PLAN.md` and record the result in `docs/PROGRESS.md`.

<!-- BEGIN: personal-status -->
# ~/Personal STATUS.md

- This repository lives under `/Users/greg/Personal`.
- Session start: open `/Users/greg/Personal/STATUS.md`, find this folder, continue from **Next**. Do not rediscover the project from README if Next is clear.
- Session end (even if not asked): rewrite `/Users/greg/Personal/STATUS.md` — update only this project's block and the top indexes; never delete other projects; never commit STATUS.md here.
- Protocol: `/Users/greg/Personal/AGENTS.md`
<!-- END: personal-status -->
