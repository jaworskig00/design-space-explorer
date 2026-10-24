import { describe, expect, it } from 'vitest'
import {
  decodeState,
  encodeState,
  hashFor,
  type UrlSnapshot,
} from './urlState.ts'

const snapshot: UrlSnapshot = {
  v: 1,
  brushes: {},
  axes: ['camber', 'cl'],
  inverted: [],
  scatter: { x: 'alpha_deg', y: 'cl' },
  pareto: { x: 'cd', y: 'cl', xDir: 'min', yDir: 'max' },
  color: 'ld',
  splom: ['thickness', 'cl'],
  selected: null,
  hist: 'thickness',
}

describe('url state', () => {
  it('roundtrips an empty brush map and a null selection', () => {
    const decoded = decodeState(hashFor(snapshot))
    expect(decoded).toEqual(snapshot)
    expect(encodeState(snapshot).length).toBeGreaterThan(10)
  })

  it('ignores a malformed hash', () => {
    expect(decodeState('#s=not-valid')).toBeNull()
    expect(decodeState('')).toBeNull()
  })
})
