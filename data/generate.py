"""Write the committed 10k design table and the NACA golden fixture."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from model import COLUMNS, INPUT_DOMAINS, evaluate, sample_inputs
from naca import coordinates

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data"
FIXTURES = Path(__file__).resolve().parent / "fixtures"
N = 10_000
SEED = 42

LABELS = {
    "camber": ("Camber", "fraction of chord", "input"),
    "camber_pos": ("Camber position", "fraction of chord", "input"),
    "thickness": ("Thickness", "fraction of chord", "input"),
    "alpha_deg": ("Angle of attack", "deg", "input"),
    "log10_reynolds": ("log10 Reynolds", "log10(Re)", "input"),
    "cl": ("Lift coefficient", "Cl", "output"),
    "cd": ("Drag coefficient", "Cd", "output"),
    "ld": ("Lift to drag", "Cl/Cd", "output"),
    "cm": ("Moment coefficient", "Cm,c/4", "output"),
    "stall_margin_deg": ("Stall margin", "deg", "output"),
}


def pad_domain(values: np.ndarray, fallback: tuple[float, float] | None = None) -> list[float]:
    lo = float(np.min(values))
    hi = float(np.max(values))
    if fallback is not None:
        return [fallback[0], fallback[1]]
    span = hi - lo
    pad = span * 0.02 if span > 0 else 1.0
    return [lo - pad, hi + pad]


def main() -> None:
    inputs = sample_inputs(N, SEED)
    table = evaluate(inputs)
    columns = [np.asarray(table[name], dtype=np.float32) for name in COLUMNS]
    OUT.mkdir(parents=True, exist_ok=True)
    blob = np.concatenate(columns).astype("<f4", copy=False)
    (OUT / "designs.f32").write_bytes(blob.tobytes())

    schema_columns = []
    for name, values in zip(COLUMNS, columns, strict=True):
        label, unit, role = LABELS[name]
        domain = list(INPUT_DOMAINS[name]) if name in INPUT_DOMAINS else pad_domain(values)
        schema_columns.append(
            {
                "name": name,
                "label": label,
                "unit": unit,
                "role": role,
                "domain": domain,
            }
        )
    schema = {
        "version": 1,
        "n": N,
        "endian": "little",
        "dtype": "float32",
        "order": "column-major",
        "seed": SEED,
        "model": "synthetic-airfoil-v1",
        "columns": schema_columns,
        "feasible": "stall_margin_deg >= 0 and thickness in [0.08, 0.20]",
    }
    (OUT / "schema.json").write_text(json.dumps(schema, indent=2) + "\n")

    FIXTURES.mkdir(parents=True, exist_ok=True)
    golden = {
        "naca0012": coordinates(0.0, 0.4, 0.12),
        "naca2412": coordinates(0.02, 0.4, 0.12),
    }
    (FIXTURES / "naca-golden.json").write_text(json.dumps(golden) + "\n")
    print(f"wrote {blob.nbytes} bytes, n={N}")


if __name__ == "__main__":
    main()
