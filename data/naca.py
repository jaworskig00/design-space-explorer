"""NACA 4-digit geometry with a closed trailing edge.

The thickness and camber equations are the standard NACA definitions.
The last thickness coefficient is -0.1036 so the trailing edge has zero thickness.
"""

from __future__ import annotations

import math

import numpy as np

N_POINTS = 81
CLOSED_TE = -0.1036


def cosine_x(n: int = N_POINTS) -> np.ndarray:
    i = np.arange(n, dtype=np.float64)
    return 0.5 * (1.0 - np.cos(np.pi * i / (n - 1)))


def thickness(x: np.ndarray, t: float) -> np.ndarray:
    return 5.0 * t * (
        0.2969 * np.sqrt(np.clip(x, 0.0, None))
        - 0.1260 * x
        - 0.3516 * x**2
        + 0.2843 * x**3
        + CLOSED_TE * x**4
    )


def camber_line(x: np.ndarray, m: float, p: float) -> tuple[np.ndarray, np.ndarray]:
    yc = np.zeros_like(x)
    dyc = np.zeros_like(x)
    if m < 1e-4 or p <= 0.0 or p >= 1.0:
        return yc, dyc
    left = x < p
    yc[left] = (m / p**2) * (2.0 * p * x[left] - x[left] ** 2)
    dyc[left] = (2.0 * m / p**2) * (p - x[left])
    right = ~left
    yc[right] = (m / (1.0 - p) ** 2) * ((1.0 - 2.0 * p) + 2.0 * p * x[right] - x[right] ** 2)
    dyc[right] = (2.0 * m / (1.0 - p) ** 2) * (p - x[right])
    return yc, dyc


def coordinates(m: float, p: float, t: float, n: int = N_POINTS) -> dict[str, list[float]]:
    """Closed polyline: upper surface from trailing edge to leading edge, then lower back to the trailing edge."""
    x = cosine_x(n)
    yt = thickness(x, t)
    yc, dyc = camber_line(x, m, p)
    theta = np.arctan(dyc)
    xu = x - yt * np.sin(theta)
    yu = yc + yt * np.cos(theta)
    xl = x + yt * np.sin(theta)
    yl = yc - yt * np.cos(theta)
    # Drop the duplicated leading-edge point on the lower surface.
    poly_x = np.concatenate([xu[::-1], xl[1:]])
    poly_y = np.concatenate([yu[::-1], yl[1:]])
    return {
        "x": x.tolist(),
        "yt": yt.tolist(),
        "xu": xu.tolist(),
        "yu": yu.tolist(),
        "xl": xl.tolist(),
        "yl": yl.tolist(),
        "poly_x": poly_x.tolist(),
        "poly_y": poly_y.tolist(),
    }


def trailing_edge_gap(m: float, p: float, t: float) -> float:
    shape = coordinates(m, p, t)
    return math.hypot(shape["poly_x"][0] - shape["poly_x"][-1], shape["poly_y"][0] - shape["poly_y"][-1])
