"""Band, determinism, and trailing-edge checks for the synthetic model."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from model import CD_BAND, CL_BAND, COLUMNS, evaluate, sample_inputs
from naca import coordinates, trailing_edge_gap

ROOT = Path(__file__).resolve().parents[2]
BINARY = ROOT / "public" / "data" / "designs.f32"
SCHEMA = ROOT / "public" / "data" / "schema.json"
GOLDEN = Path(__file__).resolve().parents[1] / "fixtures" / "naca-golden.json"


class ModelTests(unittest.TestCase):
    def test_band_on_committed_binary(self) -> None:
        schema = json.loads(SCHEMA.read_text())
        raw = np.frombuffer(BINARY.read_bytes(), dtype="<f4")
        self.assertEqual(raw.size, schema["n"] * len(COLUMNS))
        table = raw.reshape(len(COLUMNS), schema["n"])
        cl = table[COLUMNS.index("cl")]
        cd = table[COLUMNS.index("cd")]
        self.assertGreaterEqual(float(cl.min()), CL_BAND[0])
        self.assertLessEqual(float(cl.max()), CL_BAND[1])
        self.assertGreaterEqual(float(cd.min()), CD_BAND[0])
        self.assertLessEqual(float(cd.max()), CD_BAND[1])

    def test_sample_is_deterministic(self) -> None:
        a = evaluate(sample_inputs(128, 42))
        b = evaluate(sample_inputs(128, 42))
        for name in COLUMNS:
            np.testing.assert_array_equal(a[name], b[name])

    def test_trailing_edge_is_closed(self) -> None:
        self.assertLess(trailing_edge_gap(0.0, 0.4, 0.12), 1e-6)
        self.assertLess(trailing_edge_gap(0.02, 0.4, 0.12), 1e-6)

    def test_golden_thickness_is_stable(self) -> None:
        golden = json.loads(GOLDEN.read_text())
        fresh = coordinates(0.0, 0.4, 0.12)
        x = np.asarray(fresh["x"])
        index = int(np.argmin(np.abs(x - 0.3)))
        self.assertAlmostEqual(fresh["yt"][index], golden["naca0012"]["yt"][index], places=6)


if __name__ == "__main__":
    unittest.main()
