# Changelog

All notable changes to this project are recorded here.
The format is based on Keep a Changelog, and versions follow the milestone tags in `docs/PLAN.md`.

## Unreleased

## [1.0.0] - 2026-10-24

- Linked views for 10,000 synthetic NACA 4-digit designs: parallel coordinates, focused scatter, scatterplot matrix, Pareto front, histogram, details, and the airfoil outline.
- Brushes, the pinned design, axis order, and color share one URL hash. Keyboard and reduced-motion behavior match ADR-005.
- Lift, drag, and moment stay on the documented surrogate. Geometry is the NACA closed-trailing-edge equation. No flow solver.
- Playwright covers the brush, keyboard, accessible names, redraw budgets, screenshots, and a short brush recording.
- README describes how to run the app, regenerate the table, and re-measure the budgets. Deploy target is still open.
