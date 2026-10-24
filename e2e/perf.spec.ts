import { expect, test } from '@playwright/test'

test('redraws stay inside the ADR-006 budgets', async ({ page }) => {
  await page.goto('/?e2e=1')
  await expect(page.getByTestId('design-count')).toHaveText('10000')
  await page.waitForFunction(() => window.__explorer?.setBrush)
  const firstPaint = await page.evaluate(() => {
    const mark = performance.getEntriesByName('explorer-first-paint').at(-1)
    return mark?.duration ?? Number.POSITIVE_INFINITY
  })
  expect(firstPaint).toBeLessThan(1500)

  const timings = await page.evaluate(() => {
    const samples = []
    for (let i = 0; i < 5; i += 1) {
      window.__explorer?.setBrush(
        'thickness',
        i % 2 === 0 ? [0.1, 0.16] : [0.12, 0.18],
      )
      samples.push({ ...(window.__timings ?? {}) })
    }
    const median = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b)
      return sorted[2] ?? Number.POSITIVE_INFINITY
    }
    return {
      pcp: median(
        samples.map((sample) => sample.pcp ?? Number.POSITIVE_INFINITY),
      ),
      scatter: median(
        samples.map((sample) => sample.scatter ?? Number.POSITIVE_INFINITY),
      ),
      splom: median(
        samples.map((sample) => sample.splom ?? Number.POSITIVE_INFINITY),
      ),
    }
  })
  expect(timings.pcp).toBeLessThan(16)
  expect(timings.scatter).toBeLessThan(16)
  expect(timings.splom).toBeLessThan(50)

  const hit = await page.evaluate(() => {
    const start = performance.now()
    for (let i = 0; i < 30; i += 1) window.__explorer?.hitTestScatter(180, 120)
    return (performance.now() - start) / 30
  })
  expect(hit).toBeLessThan(2)
})
