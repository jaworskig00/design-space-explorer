import { gzipSync } from 'node:zlib'

/** ADR-006: gzipped JavaScript in dist/assets stays under 500 KB. */
export const JS_GZIP_BUDGET = 500_000

export function gzipSize(buffer: Uint8Array) {
  return gzipSync(buffer).length
}

export function exceedsJsBudget(gzipBytes: number) {
  return gzipBytes > JS_GZIP_BUDGET
}
