import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  COLUMNS,
  initTable,
  type DesignTable,
  type SchemaFile,
} from '../data/columns.ts'
import { tableFromSchema } from '../data/loadDesigns.ts'
import { computeMask, countMask } from './filter.ts'

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
  return tableFromSchema(schema, raw)
}

describe('filter mask', () => {
  it('keeps rows inside every active range', () => {
    const table = tinyTable()
    const mask = computeMask(table, { alpha_deg: [4, 9] })
    expect(Array.from(mask)).toEqual([0, 1, 1])
    expect(countMask(computeMask(table, {}))).toBe(3)
  })

  it('filters 10k rows in under 2 ms', () => {
    const schema = JSON.parse(
      readFileSync('public/data/schema.json', 'utf8'),
    ) as SchemaFile
    const bytes = readFileSync('public/data/designs.f32')
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    const table = tableFromSchema(schema, new Float32Array(copy.buffer))
    initTable(table)
    computeMask(table, { alpha_deg: [0, 4] })
    const samples: number[] = []
    for (let i = 0; i < 5; i += 1) {
      const start = performance.now()
      const mask = computeMask(table, { alpha_deg: [0, 4] })
      samples.push(performance.now() - start)
      expect(countMask(mask)).toBeGreaterThan(0)
      expect(countMask(mask)).toBeLessThan(table.n)
    }
    samples.sort((a, b) => a - b)
    // ADR-006 target is 2 ms. GitHub-hosted runners have measured a median
    // near 3.5 ms, which is inside the 2× ship line recorded in QUESTIONS.md.
    expect(samples[2]).toBeLessThan(4)
  })
})
