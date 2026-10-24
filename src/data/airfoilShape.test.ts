import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { airfoilPolyline } from './airfoilShape.ts'

type Golden = {
  naca0012: { xu: number[]; yu: number[]; xl: number[]; yl: number[] }
  naca2412: { xu: number[]; yu: number[] }
}

const golden = JSON.parse(
  readFileSync('data/fixtures/naca-golden.json', 'utf8'),
) as Golden

function expectSurface(
  actual: { x: number; y: number }[],
  xs: number[],
  ys: number[],
) {
  expect(actual).toHaveLength(xs.length)
  for (let i = 0; i < xs.length; i += 1) {
    expect(actual[i]?.x).toBeCloseTo(xs[i] ?? 0, 5)
    expect(actual[i]?.y).toBeCloseTo(ys[i] ?? 0, 5)
  }
}

describe('NACA shape', () => {
  it('matches the Python golden 0012 and 2412 coordinates', () => {
    const n0012 = airfoilPolyline(0, 0.4, 0.12)
    expectSurface(n0012.upper, golden.naca0012.xu, golden.naca0012.yu)
    expectSurface(n0012.lower, golden.naca0012.xl, golden.naca0012.yl)
    const n2412 = airfoilPolyline(0.02, 0.4, 0.12)
    expectSurface(n2412.upper, golden.naca2412.xu, golden.naca2412.yu)
  })
})
