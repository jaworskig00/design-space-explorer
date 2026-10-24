import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COLUMNS, type SchemaFile } from './columns.ts'
import { tableFromSchema } from './loadDesigns.ts'

describe('loader', () => {
  it('reads a 4-row column-major buffer', () => {
    const schema: SchemaFile = {
      version: 1,
      n: 4,
      feasible: 'test',
      columns: COLUMNS.map((name) => ({
        name,
        label: name,
        unit: '',
        role: 'input' as const,
        domain: [0, 1] as [number, number],
      })),
    }
    const raw = new Float32Array(schema.n * COLUMNS.length)
    raw[schema.n * COLUMNS.indexOf('cl') + 2] = 1.25
    const table = tableFromSchema(schema, raw)
    expect(table.columns.cl[2]).toBeCloseTo(1.25)
  })

  it('matches the committed schema column order', () => {
    const schema = JSON.parse(
      readFileSync('public/data/schema.json', 'utf8'),
    ) as SchemaFile
    expect(schema.columns.map((column) => column.name)).toEqual([...COLUMNS])
    expect(schema.n).toBe(10_000)
  })
})
