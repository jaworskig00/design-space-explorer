# Open questions

Anything still unresolved. The autonomous agent appends here instead of stopping, unless the item is a true blocker (missing credentials with no default).

## Open

- The 10k filter-mask budget is 2 ms (ADR-006). On a GitHub-hosted runner the median of five passes measured 3.5 ms on 2026-10-24. That is under the 2× line, so v1 ships. A result at or above 4 ms should be treated as a real regression.
- Sister repo [`neural-wind-tunnel`](https://github.com/jaworskig00/neural-wind-tunnel) exists as of 2026-10-24. Its `docs/DATASET-SCHEMA.md` is a CST + panel-solver contract (12 Bernstein weights, Reynolds fixed at 1e6, Cp at 128 stations) and its `docs/URL-STATE.md` deep-links with `#v=1&au=…&al=…&a=…`. This repo's v1 dataset stays ADR-002 (own NACA surrogate, row id, brush hash). The two contracts are not interchangeable. Do not block M0–M9 on the wind tunnel, and do not switch generators unless a new ADR says so. The details-panel link stays absent until both a base URL and a mapping onto `URL-STATE.md` exist. `?id=` is not that contract.

## Resolved during planning

- Deploy target: GitHub Pages at <https://jaworskig00.github.io/design-space-explorer/>. Chosen 2026-10-24. The app stays static; the wind-tunnel link stays off.
- Dataset: synthetic airfoils, about 10k rows, no XFOIL. This repo ships alone. A shared contract with the wind tunnel is not agreed; see the open item above.
- v1 scope: parallel coordinates, SPLOM, focused scatter, Pareto, distributions, details and shape. No ML and no LLM.
- GitHub account: `jaworskig00`. Repository name: `design-space-explorer`. License: MIT.
- `gh auth status` succeeded for `jaworskig00` on 2026-10-24 before the planning commit.
