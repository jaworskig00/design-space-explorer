# Decisions

ADR-style records. The autonomous agent implements these as written. A change needs a new ADR, not a silent edit of the formula or the rendering strategy.

## ADR-001 — Vite, React, TypeScript, pnpm

**Status:** accepted

The app is a static SPA. Next.js does not help a canvas/D3 dashboard and fights the static-first deploy. Vite + React + TypeScript strict is the stack. pnpm is the package manager. CI pins Node 22 via `.nvmrc`. UI copy and planning docs are English.

No Tailwind. Visual tokens are plain CSS so chart code is not fighting a utility layer. Dark engineering dashboard: background `#0e1116`, panel `#161b22`, border `#2a3340`, text `#e7ecf3`, muted `#93a0b5`, in-filter accent `#3ddc97`, selection `#e8a838`, Pareto front `#f4f7fb`. Color encoding uses `cividis` from `d3-scale-chromatic`. Type is IBM Plex Sans and IBM Plex Mono from `fontsource` (self-hosted, no Google CDN).

State is Zustand. The row table is not in the store (ADR-004).

## ADR-002 — Synthetic airfoil dataset

**Status:** accepted

10,000 designs. Geometry is the real NACA 4-digit closed-trailing-edge equation. Aerodynamic coefficients are a documented surrogate, not XFOIL, a panel code, or CFD. `data/MODEL.md` must say that in the first paragraph. The README must repeat it.

### Sampling

Latin hypercube, `numpy.random.Generator(np.random.PCG64(42))`, n = 10,000, five dimensions. Per dimension, one uniform draw inside each stratum, then a permutation. No SciPy.

| Column | Range |
| --- | --- |
| `camber` m | [0, 0.09] fraction of chord |
| `camber_pos` p | [0.20, 0.70] |
| `thickness` t | [0.06, 0.24] |
| `alpha_deg` | [-4, 16] |
| `log10_reynolds` | [log10(2e5), log10(5e6)] |

`m < 1e-4` is treated as zero camber in the geometry and in the surrogate. The stored `camber` value stays the sampled number.

### Surrogate

Implement exactly this. If the band test fails, change a coefficient, record the new value in this ADR and in `data/MODEL.md`, and regenerate. Do not clamp coefficients to force the test green unless the band still fails after a coefficient change; a clamp must be disclosed in `MODEL.md`.

```
cl_alpha = 2 * pi * 0.95 * (1 - 0.6 * t)
alpha_l0 = -2 * m_eff                         # radians
stall_deg = clamp(13 + 35 * (t - 0.12) + 0.8 * (log10_re - 6) - 70 * m_eff, 8, 16)
cl_linear = cl_alpha * (radians(alpha_deg) - alpha_l0)
cl_stall = cl_alpha * (radians(stall_deg) - alpha_l0)
if alpha_deg <= stall_deg:
    cl = cl_linear
else:
    fade = exp(-(alpha_deg - stall_deg) / 5)
    cl = cl_stall * (0.55 + 0.45 * fade)

Cf = 0.455 / (log10(Re) ** 2.58)
FF = 1 + 2 * t + 60 * t**4
cd0 = 2 * Cf * FF
k = 0.006 * (1 + 6 * t)
cd = cd0 + k * cl**2
if alpha_deg > stall_deg:
    cd += 0.0015 * (alpha_deg - stall_deg) ** 1.2

cm = -0.25 * pi * m_eff
ld = cl / cd
stall_margin_deg = stall_deg - alpha_deg
feasible = stall_margin_deg >= 0 and 0.08 <= t <= 0.20
```

`cd` is 2D profile drag, not induced drag. Say that next to the formula.

### Acceptance band

Every generated row must satisfy `cl ∈ [-0.7, 2.3]` and `cd ∈ [0.004, 0.12]`. The unit test loads the written binary and fails outside the band.

### File format

`public/data/designs.f32`: little-endian float32, column-major, no header. Length is `n * column_count * 4` bytes (400,000 bytes for 10 columns).

`public/data/schema.json` version 1:

- `n`, `endian`, `dtype`, `order`, `seed`, `model: "synthetic-airfoil-v1"`
- `columns[]` in this order: `camber`, `camber_pos`, `thickness`, `alpha_deg`, `log10_reynolds`, `cl`, `cd`, `ld`, `cm`, `stall_margin_deg`
- each column has `name`, `label`, `unit`, `role` (`input` or `output`), and `domain` `[min, max]`
- input domains are the sampling ranges
- output domains are the data min/max with 2% padding, written by the generator so scales stay stable
- `feasible` is the predicate string above. Feasible is not a stored column. The client recomputes it.

`id` is the row index. The human label shows exact `m`, `p`, `t`, angle, and Reynolds number, plus a nearest NACA 4-digit code marked as nearest, not exact. Most Latin-hypercube rows are not on the integer NACA grid.

The shape preview evaluates the NACA equations in the browser from `m`, `p`, `t`. It does not read a stored polygon. Closed trailing edge uses the `-0.1036 * x^4` term. Cosine spacing, 81 points from 0 to 1. Python writes `data/fixtures/naca-golden.json` for NACA 0012 and 2412. The TypeScript port must match within `1e-5`.

Commit the binary. It is small. No Git LFS.

## ADR-003 — What draws where

**Status:** accepted

| View | Marks | Chrome |
| --- | --- | --- |
| Parallel coordinates | Canvas polylines | SVG axes and 1D brushes |
| SPLOM | One canvas for every cell | SVG brushes; axes on the left column and bottom row |
| Focused scatter | Canvas points | SVG axes, zoom, 2D brush |
| Pareto | Canvas points, SVG front polyline | SVG axes and 2D brush |
| Histograms | SVG bars (40 bins) | SVG brush |
| Shape | SVG closed path | none |

Context lines (all rows) use a low alpha. In-filter marks use a higher alpha. Hover and the pinned design redraw on a second canvas so a hover does not repaint the base layer.

SPLOM defaults to five columns: `thickness`, `alpha_deg`, `cl`, `cd`, `ld`. Upper triangle plus histogram diagonal. A control toggles which columns appear. A full 10×10 matrix is out of scope.

Device pixel ratio is capped at 2.

Shared scatter helpers are extracted when Pareto (M6) is the second scatter. M3 stays concrete. Do not build a chart framework first.

## ADR-004 — Linked selection and the URL

**Status:** accepted

One inclusive range per column. Filters combine with AND. A 2D brush on the scatter, SPLOM, Pareto, or a histogram writes the 1D ranges of the columns it touches. Empty range means the column is not filtering.

The mask is a `Uint8Array` of length `n`, recomputed in the brush action on the main thread. Do not put the mask work in a worker unless a measured budget fails (ADR-006 budgets, task M8.4).

`hoverId` is transient. `selectedId` is pinned by a click and cleared with Escape. Hover does not go into the URL.

URL hash, key `s`, is `lz-string` `compressToEncodedURIComponent` of:

```
{
  v: 1,
  brushes: { [column]: [min, max] },
  axes: string[],
  inverted: string[],
  scatter: { x, y },
  pareto: { x, y, xDir, yDir },
  color: string,
  splom: string[],
  selected: number | null,
  hist: string
}
```

Debounce writes with `history.replaceState`. Restoring the hash on load must reproduce the brushes and the pinned id. The URL stores predicates, never the list of matching ids.

Defaults: parallel-coordinate order `camber`, `thickness`, `alpha_deg`, `log10_reynolds`, `cl`, `cd`, `ld`, `cm`. Scatter x = `alpha_deg`, y = `cl`. Pareto x = `cd` minimize, y = `cl` maximize. Color = `ld`. Histogram = `thickness`. Nothing inverted. `cd` is not auto-inverted on the parallel coordinates; direction lives on the Pareto controls.

Each brush also has a pair of number inputs (`data-testid="brush-<column>-min"` and `max`). They are the accessible control and the hook Playwright uses. Canvas drag writes the same store fields.

## ADR-005 — Interaction details

**Status:** accepted

Focused scatter and Pareto: wheel zooms around the cursor, drag draws an axis-aligned brush in data coordinates, Shift+drag pans, double-click resets zoom. The brush survives zoom because it is stored in data space.

Parallel coordinates: drag on an axis brushes that axis. Drag the axis title to reorder. A control on the axis title toggles inversion (do not rely on a hidden modifier alone). Reorder animates axis positions over 300ms with `d3-ease` cubic, unless `prefers-reduced-motion` matches.

Keyboard, ignored while an input is focused:

- Escape clears the pin
- `r` clears brushes and the pin
- ArrowLeft / ArrowRight move the pin along the filtered ids
- `[` / `]` change the color column

A polite live region announces "`{matchCount}` of `{n}` designs". Canvas regions have `role="img"` and an `aria-label` that names the view and the current filter count. The details panel is a definition list a screen reader can read.

## ADR-006 — Performance budgets

**Status:** accepted

Measured in Playwright on the production preview with the full 10k file, via `performance.now()` around a brush applied through the number inputs:

- First painted dashboard < 1.5 s after the data response finishes
- Parallel-coordinate base redraw and focused-scatter base redraw < 16 ms
- SPLOM base redraw < 50 ms
- Hover hit-test < 2 ms

A Vitest bench on the pure mask function must finish 10k rows in < 2 ms.

Gzipped JS in `dist/assets` stays under 500 KB. The dataset is not part of that budget.

Hit-testing uses `d3-quadtree`. The focused scatter also builds a `d3-delaunay` diagram when the filtered count is ≤ 4000, and uses it for nearest-point hover in that view. Above 4000, that view uses the quadtree too.

Workers and `OffscreenCanvas` are not part of the first implementation. M8.4 adds them only if a budget above fails, and records the reason in `docs/PROGRESS.md`.

## ADR-007 — Pareto front

**Status:** accepted

Two objectives. Default: maximize `cl`, minimize `cd`. The user can switch the two columns and the direction of each. A third objective is only the color scale.

Algorithm: among feasible rows, sort by the minimize-objective (flip the sign when that axis is maximize), then sweep, keeping a point when its other objective improves. O(n log n). Infeasible rows are drawn as ghosts at low opacity and are never on the front, even if they would otherwise be non-dominated.

Dominated feasible points are dim. The front is a polyline through the non-dominated points in objective order.

Fixture `data/fixtures/pareto-6.json` (hand-written, not generated) for maximize `cl`, minimize `cd`:

| cl | cd | feasible | on front |
| --- | --- | --- | --- |
| 0.5 | 0.02 | yes | yes |
| 0.8 | 0.03 | yes | no |
| 1.0 | 0.025 | yes | yes |
| 1.2 | 0.04 | yes | yes |
| 0.4 | 0.05 | yes | no |
| 0.9 | 0.015 | no | no |

The last point is non-dominated on the numbers and still excluded because it is infeasible.

## ADR-008 — Git, CI, and commits on main

**Status:** accepted

Public repo `jaworskig00/design-space-explorer`, MIT license. Work happens on `main` with small Conventional Commits, pushed after each task. No force-push. Milestone tags as in `AGENTS.md`.

CI (`.github/workflows/ci.yml`) on every push:

- pnpm install with a frozen lockfile, lint, typecheck, unit tests, production build, gzip budget, Playwright chromium against `vite preview`
- from M1 onward, a second job: `uv` on Python 3.12, generate nothing in CI (the binary is committed), run `unittest`, and assert the fixture binary loads with the expected length

M0 does not add the Python job. Adding a job before the tests exist would keep CI red. M1 adds the job in the same commit as the tests.

Playwright browsers are cached. The CI status badge is added to the README in M0, pointing at `ci.yml`.

Pre-commit is husky + lint-staged: Prettier and ESLint on staged files only. The hook does not run the unit suite or Playwright.

## ADR-009 — Wind tunnel boundary

**Status:** accepted

This repo does not depend on the Neural Wind Tunnel. `data/SCHEMA.md` is the contract for this app's own synthetic sample. The details panel does not render a wind-tunnel link in v1.

`neural-wind-tunnel` (public, 2026-10-24) publishes a different contract: CST weights and a hash of the form `#v=1&au=…&al=…&a=…` (`docs/DATASET-SCHEMA.md`, `docs/URL-STATE.md` in that repo). A `?id=` link would not open a design there. Turning the link on requires a base URL and a mapping from our rows onto that hash, which NACA samples do not have. Until an ADR replaces ADR-002, do not consume the wind-tunnel dataset and do not add the button.

## ADR-010 — No ML in v1

**Status:** accepted

No surrogate model in the browser, no embedding, no LLM filter, no API key. Natural-language filters and "unexplored region" highlights are v2. The filter is a pure predicate so a later layer can set the same brushes.

## ADR-011 — Scatter drag vs brush

**Status:** accepted

Recorded separately because it is easy to "fix" later and break tests. Drag on the focused scatter and on the Pareto plot brushes. It does not pan. Panning is Shift+drag. Zoom is the wheel. See ADR-005.
