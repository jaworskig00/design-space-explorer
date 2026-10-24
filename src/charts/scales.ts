import { scaleLinear } from 'd3-scale'
import type { ColumnName, DesignTable } from '../data/columns.ts'

export function columnScale(
  table: DesignTable,
  column: ColumnName,
  range: [number, number],
  inverted: boolean,
) {
  const [lo, hi] = table.meta[column].domain
  return scaleLinear()
    .domain(inverted ? [hi, lo] : [lo, hi])
    .range(range)
}
