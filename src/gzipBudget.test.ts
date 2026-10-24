import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { JS_GZIP_BUDGET, exceedsJsBudget, gzipSize } from './lib/gzipBudget.ts'

describe('bundle budget', () => {
  it('rejects a gzip size over the budget', () => {
    expect(exceedsJsBudget(JS_GZIP_BUDGET + 1)).toBe(true)
    expect(exceedsJsBudget(JS_GZIP_BUDGET)).toBe(false)
  })

  it('measures gzip size of a buffer', () => {
    const payload = new Uint8Array(80_000).fill(7)
    expect(gzipSize(payload)).toBe(gzipSync(payload).length)
    expect(gzipSize(payload)).toBeLessThan(JS_GZIP_BUDGET)
  })
})
