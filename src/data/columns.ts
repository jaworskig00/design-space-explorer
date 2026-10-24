export const COLUMNS = [
  'camber',
  'camber_pos',
  'thickness',
  'alpha_deg',
  'log10_reynolds',
  'cl',
  'cd',
  'ld',
  'cm',
  'stall_margin_deg',
] as const

export type ColumnName = (typeof COLUMNS)[number]

export type Direction = 'min' | 'max'

export type ColumnMeta = {
  name: ColumnName
  label: string
  unit: string
  role: 'input' | 'output'
  domain: [number, number]
}

export type SchemaFile = {
  version: number
  n: number
  columns: ColumnMeta[]
  feasible: string
}

export type DesignTable = {
  n: number
  columns: Record<ColumnName, Float32Array>
  meta: Record<ColumnName, ColumnMeta>
}

export const DEFAULT_AXES: ColumnName[] = [
  'camber',
  'thickness',
  'alpha_deg',
  'log10_reynolds',
  'cl',
  'cd',
  'ld',
  'cm',
]

export const DEFAULT_SPLOM: ColumnName[] = [
  'thickness',
  'alpha_deg',
  'cl',
  'cd',
  'ld',
]

export function isColumn(value: string): value is ColumnName {
  return (COLUMNS as readonly string[]).includes(value)
}

let table: DesignTable | null = null

export function initTable(next: DesignTable) {
  table = next
}

export function getTable() {
  if (!table) throw new Error('design table is not loaded')
  return table
}

export function isFeasible(data: DesignTable, index: number) {
  const thickness = data.columns.thickness[index] ?? 0
  const margin = data.columns.stall_margin_deg[index] ?? -1
  return margin >= 0 && thickness >= 0.08 && thickness <= 0.2
}

export function nearestNaca(
  camber: number,
  camberPos: number,
  thickness: number,
) {
  const m = Math.round(camber * 100)
  const p = Math.round(camberPos * 10)
  const t = Math.round(thickness * 100)
  return `${m}${p}${String(t).padStart(2, '0')}`
}

export function formatValue(column: ColumnName, value: number) {
  if (column === 'log10_reynolds') return (10 ** value).toExponential(2)
  if (column === 'alpha_deg' || column === 'stall_margin_deg')
    return value.toFixed(2)
  return value.toFixed(4)
}
