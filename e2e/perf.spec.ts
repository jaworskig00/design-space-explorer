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

  await page.evaluate(() => {
    window.__explorer?.setBrush('thickness', [0.1, 0.16])
  })
  const timings = await page.evaluate(() => window.__timings ?? {})
  expect(timings.pcp ?? Number.POSITIVE_INFINITY).toBeLessThan(16)
  expect(timings.scatter ?? Number.POSITIVE_INFINITY).toBeLessThan(16)
  expect(timings.splom ?? Number.POSITIVE_INFINITY).toBeLessThan(50)

  const hit = await page.evaluate(() => {
    const start = performance.now()
    for (let i = 0; i < 30; i += 1) window.__explorer?.hitTestScatter(180, 120)
    return (performance.now() - start) / 30
  })
  expect(hit).toBeLessThan(2)
})
