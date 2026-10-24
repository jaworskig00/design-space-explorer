"""Synthetic airfoil surrogate. Not XFOIL, a panel method, or CFD.

Formulas are ADR-002. Profile drag is two-dimensional: there is no induced-drag term.
"""

from __future__ import annotations

import math

import numpy as np

COLUMNS = (
    "camber",
    "camber_pos",
    "thickness",
    "alpha_deg",
    "log10_reynolds",
    "cl",
    "cd",
    "ld",
    "cm",
    "stall_margin_deg",
)

INPUT_DOMAINS = {
    "camber": (0.0, 0.09),
    "camber_pos": (0.20, 0.70),
    "thickness": (0.06, 0.24),
    "alpha_deg": (-4.0, 16.0),
    "log10_reynolds": (math.log10(2e5), math.log10(5e6)),
}

CL_BAND = (-0.7, 2.3)
CD_BAND = (0.004, 0.12)


def latin_hypercube(n: int, d: int, rng: np.random.Generator) -> np.ndarray:
    result = np.empty((n, d), dtype=np.float64)
    for j in range(d):
        strata = (np.arange(n) + rng.random(n)) / n
        result[:, j] = rng.permutation(strata)
    return result


def sample_inputs(n: int, seed: int = 42) -> dict[str, np.ndarray]:
    rng = np.random.default_rng(np.random.PCG64(seed))
    u = latin_hypercube(n, 5, rng)
    names = ("camber", "camber_pos", "thickness", "alpha_deg", "log10_reynolds")
    out: dict[str, np.ndarray] = {}
    for j, name in enumerate(names):
        lo, hi = INPUT_DOMAINS[name]
        out[name] = lo + u[:, j] * (hi - lo)
    return out


def _clamp(value: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return np.clip(value, lo, hi)


def evaluate(inputs: dict[str, np.ndarray]) -> dict[str, np.ndarray]:
    m = inputs["camber"]
    t = inputs["thickness"]
    alpha = inputs["alpha_deg"]
    log_re = inputs["log10_reynolds"]
    m_eff = np.where(m < 1e-4, 0.0, m)

    cl_alpha = 2.0 * math.pi * 0.95 * (1.0 - 0.6 * t)
    alpha_l0 = -2.0 * m_eff
    stall = _clamp(13.0 + 35.0 * (t - 0.12) + 0.8 * (log_re - 6.0) - 70.0 * m_eff, 8.0, 16.0)
    alpha_rad = np.deg2rad(alpha)
    stall_rad = np.deg2rad(stall)
    cl_linear = cl_alpha * (alpha_rad - alpha_l0)
    cl_stall = cl_alpha * (stall_rad - alpha_l0)
    excess = alpha - stall
    fade = np.exp(-np.maximum(excess, 0.0) / 5.0)
    cl_post = cl_stall * (0.55 + 0.45 * fade)
    cl = np.where(alpha <= stall, cl_linear, cl_post)

    re = np.power(10.0, log_re)
    cf = 0.455 / np.power(np.log10(re), 2.58)
    ff = 1.0 + 2.0 * t + 60.0 * np.power(t, 4)
    cd0 = 2.0 * cf * ff
    k = 0.006 * (1.0 + 6.0 * t)
    cd = cd0 + k * cl**2
    sep = 0.0015 * np.power(np.maximum(excess, 0.0), 1.2)
    cd = np.where(alpha > stall, cd + sep, cd)

    cm = -0.25 * math.pi * m_eff
    ld = cl / cd
    stall_margin = stall - alpha

    return {
        "camber": m,
        "camber_pos": inputs["camber_pos"],
        "thickness": t,
        "alpha_deg": alpha,
        "log10_reynolds": log_re,
        "cl": cl,
        "cd": cd,
        "ld": ld,
        "cm": cm,
        "stall_margin_deg": stall_margin,
    }


def is_feasible(row_t: np.ndarray, row_margin: np.ndarray) -> np.ndarray:
    return (row_margin >= 0.0) & (row_t >= 0.08) & (row_t <= 0.20)
