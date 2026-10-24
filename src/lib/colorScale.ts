import { interpolateCividis } from 'd3-scale-chromatic'

export const COLOR_BINS = 64

function parseColor(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    const value = color.slice(1)
    return [
      Number.parseInt(value.slice(0, 2), 16),
      Number.parseInt(value.slice(2, 4), 16),
      Number.parseInt(value.slice(4, 6), 16),
    ]
  }
  const match = /rgba?\(([^)]+)\)/.exec(color)
  const parts = match?.[1]?.split(',').map((part) => Number(part.trim())) ?? [
    180, 180, 180,
  ]
  return [parts[0] ?? 180, parts[1] ?? 180, parts[2] ?? 180]
}

export function binColors() {
  const colors: Array<[number, number, number]> = []
  for (let i = 0; i < COLOR_BINS; i += 1) {
    colors.push(parseColor(interpolateCividis(i / (COLOR_BINS - 1))))
  }
  return colors
}

export function colorBin(value: number, domain: [number, number]) {
  const span = domain[1] - domain[0] || 1
  const t = Math.min(1, Math.max(0, (value - domain[0]) / span))
  return Math.min(COLOR_BINS - 1, Math.floor(t * COLOR_BINS))
}
