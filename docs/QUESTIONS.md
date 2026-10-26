# Open questions

Anything still unresolved. The autonomous agent appends here instead of stopping, unless the item is a true blocker (missing credentials with no default).

## Open

- The 10k filter-mask budget is 2 ms (ADR-006). On a GitHub-hosted runner the median of five passes measured 3.5 ms on 2026-10-24. That is under the 2× line, so v1 ships. A result at or above 4 ms should be treated as a real regression.
- Sister repo [`neural-wind-tunnel`](https://github.com/jaworskig00/neural-wind-tunnel) uses a CST + panel-solver table (Reynolds fixed at 1e6). This repo stays on ADR-002. The tables are not interchangeable. ADR-012 allows a shape-only link (`naca` + alpha). Do not send coefficients, and do not switch generators.

## Resolved during planning

- Deploy target: GitHub Pages at <https://jaworskig00.github.io/design-space-explorer/>. Chosen 2026-10-24. The app stays static.
- Shape link: 2026-10-26, ADR-012. The details panel opens the deployed tunnel with camber, camber position, thickness, and angle. Coefficients stay here.
- Dataset: synthetic airfoils, about 10k rows, no XFOIL. This repo ships alone. A shared contract with the wind tunnel is not agreed; see the open item above.
- v1 scope: parallel coordinates, SPLOM, focused scatter, Pareto, distributions, details and shape. No ML and no LLM.
- GitHub account: `jaworskig00`. Repository name: `design-space-explorer`. License: MIT.
- `gh auth status` succeeded for `jaworskig00` on 2026-10-24 before the planning commit.
