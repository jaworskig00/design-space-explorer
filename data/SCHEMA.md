# Design table schema

Contract for this repository's synthetic sample. It is not the Neural Wind Tunnel CST schema. See `docs/QUESTIONS.md`.

## Identity

`id` is the row index into `public/data/designs.f32`, from 0 to n-1. It is not stored as a column.

The human label shows exact camber, camber position, thickness, angle of attack, and Reynolds number. A nearest NACA 4-digit code may be shown beside it and must be marked as nearest, not exact. Most Latin-hypercube rows are not on the integer NACA grid.

## File

`public/data/designs.f32` is little-endian float32, column-major, with no header. Column order is fixed by `public/data/schema.json` version 1:

1. `camber` — fraction of chord, input
2. `camber_pos` — fraction of chord, input
3. `thickness` — fraction of chord, input
4. `alpha_deg` — degrees, input
5. `log10_reynolds` — log10 of Reynolds number, input
6. `cl` — lift coefficient, output
7. `cd` — profile drag coefficient, output
8. `ld` — Cl/Cd, output
9. `cm` — quarter-chord moment, output
10. `stall_margin_deg` — degrees, output

`feasible` is not a column. Recompute it: `stall_margin_deg >= 0` and thickness in `[0.08, 0.20]`.

Input domains in the schema are the sampling ranges. Output domains are the data min/max with 2% padding, written by the generator so chart scales stay stable.

Regenerate with:

```
cd data && uv sync && uv run python generate.py
```
