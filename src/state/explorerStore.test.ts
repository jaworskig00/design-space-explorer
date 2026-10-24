import { describe, expect, it } from 'vitest'
import {
  COLUMNS,
  initTable,
  type DesignTable,
  type SchemaFile,
} from '../data/columns.ts'
import { tableFromSchema } from '../data/loadDesigns.ts'
import { useExplorer } from './explorerStore.ts'

function tinyTable(): DesignTable {
  const schema: SchemaFile = {
    version: 1,
    n: 3,
    feasible: '',
    columns: COLUMNS.map((name) => ({
      name,
      label: name,
      unit: '',
      role: 'input' as const,
      domain: [0, 10] as [number, number],
    })),
  }
  const raw = new Float32Array(3 * COLUMNS.length)
  const alpha = COLUMNS.indexOf('alpha_deg') * 3
  raw[alpha] = 0
  raw[alpha + 1] = 5
  raw[alpha + 2] = 9
  const thickness = COLUMNS.indexOf('thickness') * 3
  raw[thickness] = 0.1
  raw[thickness + 1] = 0.12
  raw[thickness + 2] = 0.3
  return tableFromSchema(schema, raw)
}

describe('explorer store', () => {
  it('ANDs two brushes into the match count', () => {
    initTable(tinyTable())
    useExplorer.getState().setReady()
    useExplorer.getState().clearBrushes()
    useExplorer.getState().setBrush('alpha_deg', [4, 9])
    useExplorer.getState().setBrush('thickness', [0, 0.2])
    expect(useExplorer.getState().matchCount).toBe(1)
  })
})
