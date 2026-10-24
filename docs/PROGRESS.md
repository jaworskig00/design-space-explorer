# Progress

Append one entry after each task in `docs/PLAN.md`. Do not rewrite history.

## 2026-10-24 — M9 release, deploy left open

- What: Screenshots, brush gif/webm, keyboard and accessible-name specs, ADR-006 timings, scatter drag brush, Pareto direction and click, parallel-coordinate hit testing. README and changelog cover M0–M9. Brush overlays were ignoring pointer events because `.chart .overlay` also matched the D3 brush rect; the rule is now `canvas.overlay` only. M8.4 worker: not needed. No host, no deploy workflow.
- Verified: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` (JS gzip about 114 KB), `pnpm e2e` on the production preview. Perf spec passed under 16 ms / 50 ms / 2 ms / 1.5 s.
- Follow-ups: choose a static host. Do not tag until CI on this commit is green.

## 2026-10-24 — M1 dataset and linked views

- What: Generated 10,000 synthetic NACA rows and wired parallel coordinates, scatter, SPLOM, Pareto, histograms, details, and the shape outline. Brushing angle of attack filters every view and survives reload.
- Verified: Python unittest, `pnpm lint`, `pnpm typecheck`, `pnpm test` (11), `pnpm build` (JS gzip 113 KB), `pnpm e2e` (2 passed).
- Follow-ups: screenshots, keyboard/perf specs, README media, and the v1 tag. Pareto canvas brush and SPLOM 50 ms budget are not measured yet.

## 2026-10-24 — stall rule

- What: A step with no progress for 5 minutes is retried once, then logged and skipped in favor of the next independent task.
- Verified: Written into `AGENTS.md`, `docs/PLAN.md`, and `.cursor/rules`.
- Follow-ups: none. M0 CI run 40058764388 is green. Dataset is generated locally and not pushed yet.

## 2026-10-24 — M0.6 CI

- What: GitHub Actions runs lint, typecheck, unit tests, build, the gzip budget, and Playwright Chromium. README badge points at `ci.yml`. No Python job yet.
- Verified: workflow file added; run status checked after the push.
- Follow-ups: confirm the run is green before M1.

## 2026-10-24 — M0.1 tooling skeleton

- What: Vite, React 19, TypeScript strict, ESLint, Prettier, Vitest. Page title is Design Space Explorer.
- Verified: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- Follow-ups: M0.2 replaces the placeholder with the dashboard shell.

## 2026-10-24 — M0.2 app shell

- What: Dashboard regions for the five views plus details, dark tokens, IBM Plex, visible focus rings.
- Verified: `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- Follow-ups: Charts replace the empty states from M3 onward.

## 2026-10-24 — M0.3 bundle budget

- What: Vitest covers the 500 KB gzip predicate. `pnpm build` fails when a `dist/assets` script is over that budget. Latin-only IBM Plex so the static font payload stays small.
- Verified: `pnpm test && pnpm build` (JS gzip about 68 KB).
- Follow-ups: none.

## 2026-10-24 — M0.5 pre-commit

- What: husky runs lint-staged (Prettier, then ESLint on code). The hook does not run Vitest or Playwright.
- Verified: `pnpm exec lint-staged` on the staged package files.
- Follow-ups: none.

## 2026-10-24 — M0.4 Playwright smoke

- What: Chromium smoke test loads the production preview and checks the title plus five region headings. Preview binds to 127.0.0.1.
- Verified: `pnpm build && pnpm e2e` — 1 passed.
- Follow-ups: none.

## 2026-10-24 — planning docs

- What: Added the v1 plan, decisions, agent rules, and repo skeleton. No application code.
- Verified: Documents reviewed against the approved plan. GitHub auth for `jaworskig00` was valid; the remote did not exist yet.
- Follow-ups: Autonomous implementation starts at M0 in `docs/PLAN.md`.

## 2026-10-24 — sister-repo note

- What: Recorded that `neural-wind-tunnel` already exists and uses a CST / panel-solver schema and a different URL hash. v1 of this repo stays on ADR-002.
- Verified: Read `neural-wind-tunnel/docs/DATASET-SCHEMA.md` and `docs/URL-STATE.md`.
- Follow-ups: None for M0. Do not switch datasets without a new ADR.
