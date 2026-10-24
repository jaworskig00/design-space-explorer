const CLOSED_TE = -0.1036
export const SHAPE_SAMPLES = 81

export type AirfoilPoint = { x: number; y: number }

function cosineX(n: number) {
  const x = new Array<number>(n)
  for (let i = 0; i < n; i += 1)
    x[i] = 0.5 * (1 - Math.cos((Math.PI * i) / (n - 1)))
  return x
}

function thicknessAt(x: number, t: number) {
  return (
    5 *
    t *
    (0.2969 * Math.sqrt(Math.max(x, 0)) -
      0.126 * x -
      0.3516 * x ** 2 +
      0.2843 * x ** 3 +
      CLOSED_TE * x ** 4)
  )
}

function camberAt(x: number, m: number, p: number) {
  if (m < 1e-4 || p <= 0 || p >= 1) return { yc: 0, dyc: 0 }
  if (x < p) {
    return {
      yc: (m / p ** 2) * (2 * p * x - x ** 2),
      dyc: ((2 * m) / p ** 2) * (p - x),
    }
  }
  return {
    yc: (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x ** 2),
    dyc: ((2 * m) / (1 - p) ** 2) * (p - x),
  }
}

export function airfoilPolyline(
  camber: number,
  camberPos: number,
  thickness: number,
  n = SHAPE_SAMPLES,
) {
  const xs = cosineX(n)
  const upper: AirfoilPoint[] = []
  const lower: AirfoilPoint[] = []
  const yt: number[] = []
  for (const x of xs) {
    const thick = thicknessAt(x, thickness)
    yt.push(thick)
    const { yc, dyc } = camberAt(x, camber, camberPos)
    const theta = Math.atan(dyc)
    const sin = Math.sin(theta)
    const cos = Math.cos(theta)
    upper.push({ x: x - thick * sin, y: yc + thick * cos })
    lower.push({ x: x + thick * sin, y: yc - thick * cos })
  }
  const poly = [...upper].reverse().concat(lower.slice(1))
  return { x: xs, yt, upper, lower, poly }
}

export function airfoilPath(
  camber: number,
  camberPos: number,
  thickness: number,
) {
  const { poly } = airfoilPolyline(camber, camberPos, thickness)
  return `${poly
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${point.x.toFixed(5)} ${point.y.toFixed(5)}`,
    )
    .join('')}Z`
}
