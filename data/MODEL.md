# Synthetic airfoil model

Lift, drag, and moment in this dataset are a documented surrogate. They are not the output of XFOIL, a panel method, or CFD. The geometry, by contrast, uses the real NACA 4-digit equations with a closed trailing edge (`-0.1036 x^4`).

The formulas below are ADR-002. `Cd` is two-dimensional profile drag. There is no induced-drag term.

Sampling is a Latin hypercube of 10,000 rows, seed 42, drawn with NumPy's PCG64.

| Input             | Range                    |
| ----------------- | ------------------------ |
| camber m          | [0, 0.09]                |
| camber position p | [0.20, 0.70]             |
| thickness t       | [0.06, 0.24]             |
| angle of attack   | [-4, 16] deg             |
| log10 Reynolds    | [log10(2e5), log10(5e6)] |

`m < 1e-4` is treated as zero camber in the geometry and in the surrogate. The stored camber value is still the sampled number.

```
cl_alpha = 2 * pi * 0.95 * (1 - 0.6 * t)
alpha_l0 = -2 * m_eff                         # radians
stall_deg = clamp(13 + 35 * (t - 0.12) + 0.8 * (log10_re - 6) - 70 * m_eff, 8, 16)
cl_linear = cl_alpha * (radians(alpha_deg) - alpha_l0)
cl_stall = cl_alpha * (radians(stall_deg) - alpha_l0)
if alpha_deg <= stall_deg:
    cl = cl_linear
else:
    fade = exp(-(alpha_deg - stall_deg) / 5)
    cl = cl_stall * (0.55 + 0.45 * fade)

Cf = 0.455 / (log10(Re) ** 2.58)              # Schlichting, turbulent flat plate
FF = 1 + 2 * t + 60 * t**4                    # Hoerner-style form factor
cd0 = 2 * Cf * FF
k = 0.006 * (1 + 6 * t)
cd = cd0 + k * cl**2
if alpha_deg > stall_deg:
    cd += 0.0015 * (alpha_deg - stall_deg) ** 1.2

cm = -0.25 * pi * m_eff                       # about the quarter chord
ld = cl / cd
stall_margin_deg = stall_deg - alpha_deg
feasible = stall_margin_deg >= 0 and 0.08 <= t <= 0.20
```

Every generated row must stay inside `Cl ∈ [-0.7, 2.3]` and `Cd ∈ [0.004, 0.12]`. If a coefficient change is required to meet that band, record it here and in ADR-002. Do not clamp the outputs just to pass the test.
