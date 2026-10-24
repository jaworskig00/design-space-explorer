import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string'
import { type ColumnName, type Direction, isColumn } from '../data/columns.ts'
import type { BrushMap } from '../state/filter.ts'

export type UrlSnapshot = {
  v: 1
  brushes: BrushMap
  axes: ColumnName[]
  inverted: ColumnName[]
  scatter: { x: ColumnName; y: ColumnName }
  pareto: { x: ColumnName; y: ColumnName; xDir: Direction; yDir: Direction }
  color: ColumnName
  splom: ColumnName[]
  selected: number | null
  hist: ColumnName
}

function columns(value: unknown) {
  if (!Array.isArray(value)) return null
  const names = value.filter(
    (item): item is ColumnName => typeof item === 'string' && isColumn(item),
  )
  return names
}

function direction(value: unknown): Direction | null {
  return value === 'min' || value === 'max' ? value : null
}

export function encodeState(snapshot: UrlSnapshot) {
  return compressToEncodedURIComponent(JSON.stringify(snapshot))
}

export function decodeState(hash: string): UrlSnapshot | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(raw)
  const packed = params.get('s')
  if (!packed) return null
  const json = decompressFromEncodedURIComponent(packed)
  if (!json) return null
  try {
    const parsed = JSON.parse(json) as Partial<UrlSnapshot>
    if (parsed.v !== 1 || !parsed.scatter || !parsed.pareto) return null
    const axes = columns(parsed.axes)
    const splom = columns(parsed.splom)
    const inverted = columns(parsed.inverted)
    if (!axes || !splom || !inverted) return null
    if (!isColumn(parsed.scatter.x) || !isColumn(parsed.scatter.y)) return null
    if (!isColumn(parsed.pareto.x) || !isColumn(parsed.pareto.y)) return null
    const color = parsed.color
    const hist = parsed.hist
    if (!color || !hist || !isColumn(color) || !isColumn(hist)) return null
    const xDir = direction(parsed.pareto.xDir)
    const yDir = direction(parsed.pareto.yDir)
    if (!xDir || !yDir) return null
    const brushes: BrushMap = {}
    if (parsed.brushes && typeof parsed.brushes === 'object') {
      for (const [name, range] of Object.entries(parsed.brushes)) {
        if (!isColumn(name) || !Array.isArray(range) || range.length !== 2)
          continue
        const lo = Number(range[0])
        const hi = Number(range[1])
        if (Number.isFinite(lo) && Number.isFinite(hi)) brushes[name] = [lo, hi]
      }
    }
    const selected =
      typeof parsed.selected === 'number' && Number.isFinite(parsed.selected)
        ? parsed.selected
        : null
    return {
      v: 1,
      brushes,
      axes,
      inverted,
      scatter: { x: parsed.scatter.x, y: parsed.scatter.y },
      pareto: { x: parsed.pareto.x, y: parsed.pareto.y, xDir, yDir },
      color,
      splom,
      selected,
      hist,
    }
  } catch {
    return null
  }
}

export function hashFor(snapshot: UrlSnapshot) {
  return `#s=${encodeState(snapshot)}`
}
