import type { ColumnName, DesignTable } from '../data/columns.ts'

export type BrushMap = Partial<Record<ColumnName, [number, number]>>

export function computeMask(table: DesignTable, brushes: BrushMap) {
  const mask = new Uint8Array(table.n)
  mask.fill(1)
  const active = Object.entries(brushes) as [ColumnName, [number, number]][]
  for (const [name, range] of active) {
    if (!range) continue
    const lo = Math.min(range[0], range[1])
    const hi = Math.max(range[0], range[1])
    const column = table.columns[name]
    for (let i = 0; i < table.n; i += 1) {
      const value = column[i] ?? 0
      if (mask[i] && (value < lo || value > hi)) mask[i] = 0
    }
  }
  return mask
}

export function countMask(mask: Uint8Array) {
  let count = 0
  for (let i = 0; i < mask.length; i += 1) count += mask[i] ?? 0
  return count
}
