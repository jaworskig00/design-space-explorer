# Design Space Explorer

[![ci](https://github.com/jaworskig00/design-space-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/jaworskig00/design-space-explorer/actions/workflows/ci.yml)

Linked-view explorer for a design space of about 10,000 airfoil variants. Built with React, TypeScript, and D3 as a portfolio piece for simulation and visualization work.

Geometry uses the real NACA 4-digit equations. Lift, drag, and moment come from a documented synthetic surrogate, not from XFOIL or CFD. See `docs/DECISIONS.md` (ADR-002). The generator and the honesty note land with the dataset in milestone M1. The full README (screenshots, architecture diagram, performance notes, local run) is milestone M9.

The dashboard shell is runnable. Charts land from M3 onward. Task list: [`docs/PLAN.md`](docs/PLAN.md).

```bash
pnpm install
pnpm dev
```

Repository: <https://github.com/jaworskig00/design-space-explorer>

License: MIT.
