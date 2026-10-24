import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

// Keep in sync with src/lib/gzipBudget.ts (ADR-006).
const JS_GZIP_BUDGET = 500_000

const dir = 'dist/assets'
const files = readdirSync(dir).filter((name) => name.endsWith('.js'))
if (files.length === 0) {
  console.error('no JavaScript assets in dist/assets')
  process.exit(1)
}

let failed = false
for (const name of files) {
  const size = gzipSync(readFileSync(join(dir, name))).length
  console.log(`${name} gzip ${size}`)
  if (size > JS_GZIP_BUDGET) {
    console.error(`${name} exceeds the ${JS_GZIP_BUDGET} byte gzip budget`)
    failed = true
  }
}
if (failed) process.exit(1)
