import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { paretoFront } from './pareto.ts'

describe('pareto front', () => {
  it('matches the hand-built fixture, including the infeasible point', () => {
    const fixture = JSON.parse(
      readFileSync('data/fixtures/pareto-6.json', 'utf8'),
    ) as {
      rows: { cl: number; cd: number; feasible: boolean; onFront: boolean }[]
    }
    const cl = fixture.rows.map((row) => row.cl)
    const cd = fixture.rows.map((row) => row.cd)
    const feasible = fixture.rows.map((row) => (row.feasible ? 1 : 0))
    const front = paretoFront(cd, cl, feasible, 'min', 'max')
    fixture.rows.forEach((row, index) => {
      expect(front[index]).toBe(row.onFront ? 1 : 0)
    })
  })
})
