import type { Direction } from '../data/columns.ts'

export function paretoFront(
  x: ArrayLike<number>,
  y: ArrayLike<number>,
  feasible: ArrayLike<number>,
  xDir: Direction,
  yDir: Direction,
) {
  const n = x.length
  const front = new Uint8Array(n)
  const order: number[] = []
  for (let i = 0; i < n; i += 1) if (feasible[i]) order.push(i)
  const scoreX = (index: number) =>
    xDir === 'min' ? (x[index] ?? 0) : -(x[index] ?? 0)
  const scoreY = (index: number) =>
    yDir === 'min' ? (y[index] ?? 0) : -(y[index] ?? 0)
  order.sort((a, b) => scoreX(a) - scoreX(b) || scoreY(a) - scoreY(b))
  let bestY = Infinity
  let bestX = Infinity
  for (const index of order) {
    const xv = scoreX(index)
    const yv = scoreY(index)
    if (yv < bestY || (yv === bestY && xv === bestX)) {
      front[index] = 1
      bestY = yv
      bestX = xv
    }
  }
  return front
}
