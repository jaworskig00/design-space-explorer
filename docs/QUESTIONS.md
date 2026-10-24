# Open questions

Anything still unresolved. The autonomous agent appends here instead of stopping, unless the item is a true blocker (missing credentials with no default).

## Open

- Deploy target is undecided (Cloudflare, GitHub Pages, or Hetzner). M10 is a README placeholder only. Do not deploy in v1.
- Sister app "Neural Wind Tunnel" does not exist yet. The details-panel link stays hidden until `VITE_WIND_TUNNEL_URL` is set. No URL to record.

## Resolved during planning

- Dataset: synthetic airfoils, about 10k rows, no XFOIL. Shared schema for a later wind-tunnel app; this repo ships alone.
- v1 scope: parallel coordinates, SPLOM, focused scatter, Pareto, distributions, details and shape. No ML and no LLM.
- GitHub account: `jaworskig00`. Repository name: `design-space-explorer`. License: MIT.
- `gh auth status` succeeded for `jaworskig00` on 2026-10-24 before the planning commit.
