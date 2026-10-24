import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('design-count')).toHaveText('10000')
})

test('live region and canvas names follow the filter', async ({ page }) => {
  const live = page.locator('[aria-live="polite"]')
  await expect(live).toHaveText('10000 of 10000 designs')
  const scatter = page.locator('[data-testid=view-scatter] canvas').first()
  await expect(scatter).toHaveAttribute(
    'aria-label',
    /Focused scatter, 10000 of 10000 designs/,
  )
  await page.getByTestId('brush-alpha_deg-min').fill('0')
  await page.getByTestId('brush-alpha_deg-max').fill('4')
  const count = await page.getByTestId('filter-count').textContent()
  await expect(live).toHaveText(`${count} of 10000 designs`)
  await expect(scatter).toHaveAttribute(
    'aria-label',
    new RegExp(`Focused scatter, ${count} of 10000 designs`),
  )
})

test('keyboard cycles, clears, and resets', async ({ page }) => {
  await page.getByRole('heading', { name: 'Design Space Explorer' }).click()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('details')).toContainText(/id \d+/)
  await expect(page.getByTestId('shape-preview')).toBeVisible()
  await page.keyboard.press(']')
  await expect(page.getByLabel('Color by')).toHaveValue('cm')
  await page.keyboard.press('[')
  await expect(page.getByLabel('Color by')).toHaveValue('ld')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('details')).toHaveCount(0)
  await page.getByTestId('brush-alpha_deg-min').fill('0')
  await page.getByTestId('brush-alpha_deg-max').fill('4')
  await expect(page.getByTestId('filter-count')).not.toHaveText('10000')
  await page.getByRole('heading', { name: 'Design Space Explorer' }).click()
  await page.keyboard.press('r')
  await expect(page.getByTestId('filter-count')).toHaveText('10000')
})

test('histogram foreground never exceeds the background', async ({ page }) => {
  await page.getByTestId('brush-alpha_deg-min').fill('0')
  await page.getByTestId('brush-alpha_deg-max').fill('4')
  const bins = await page
    .locator('[data-testid=view-histogram] [data-bin-count]')
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        count: Number(node.getAttribute('data-bin-count')),
        focus: Number(node.nextElementSibling?.getAttribute('data-bin-focus')),
      })),
    )
  expect(bins).toHaveLength(40)
  let focusTotal = 0
  let countTotal = 0
  for (const bin of bins) {
    expect(bin.focus).toBeLessThanOrEqual(bin.count)
    focusTotal += bin.focus
    countTotal += bin.count
  }
  expect(focusTotal).toBeGreaterThan(0)
  expect(focusTotal).toBeLessThan(countTotal)
})

test('changing the Pareto direction changes the front', async ({ page }) => {
  const path = page.locator('[data-testid=view-pareto] path:not(.domain)')
  const before = await path.getAttribute('d')
  expect(before).toBeTruthy()
  await page.getByLabel('Objective direction').nth(1).selectOption('min')
  await expect(path).not.toHaveAttribute('d', before ?? '')
})

test('adding camber grows the scatterplot matrix', async ({ page }) => {
  const cells = page.locator('[data-testid=view-splom] svg .overlay')
  const before = await cells.count()
  await page.getByTestId('splom-toggle-camber').check()
  await expect(cells).not.toHaveCount(before)
})

test('dragging the scatter writes both ranges', async ({ page }) => {
  const svg = page.locator('[data-testid=view-scatter] svg')
  await svg.dragTo(svg, {
    sourcePosition: { x: 100, y: 60 },
    targetPosition: { x: 240, y: 180 },
  })
  await expect(page.getByTestId('filter-count')).not.toHaveText('10000')
  await expect(page.getByTestId('brush-alpha_deg-min')).not.toHaveValue('')
  await expect(page.getByTestId('brush-cl-min')).not.toHaveValue('')
  await page.getByTestId('reset-filters').click()
  await expect(page.getByTestId('filter-count')).toHaveText('10000')
})

test('clicking the scatter pins a design', async ({ page }) => {
  await page.goto('/?e2e=1')
  await expect(page.getByTestId('design-count')).toHaveText('10000')
  await page.waitForFunction(() => window.__explorer?.hitTestScatter)
  const point = await page.evaluate(() => {
    const svg = document.querySelector(
      '[data-testid=view-scatter] svg',
    ) as SVGSVGElement | null
    if (!svg || !window.__explorer) return null
    for (let y = 24; y < svg.clientHeight - 8; y += 4) {
      for (let x = 56; x < svg.clientWidth - 8; x += 4) {
        const id = window.__explorer.hitTestScatter(x, y)
        if (id != null) return { id, x, y }
      }
    }
    return null
  })
  expect(point).not.toBeNull()
  await page.locator('[data-testid=view-scatter] svg').click({
    position: { x: point?.x ?? 0, y: point?.y ?? 0 },
  })
  await expect(page.getByTestId('details')).toContainText(`id ${point?.id}`)
  await expect(page.getByTestId('details')).toContainText('Camber')
  await expect(page.getByTestId('shape-preview')).toBeVisible()
  await expect(page.getByRole('link')).toHaveCount(0)
})

test('reduced motion skips the axis transition', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByTestId('design-count')).toHaveText('10000')
  await expect(page.locator('[data-testid=view-pcp] svg')).toHaveAttribute(
    'data-motion',
    'off',
  )
  await context.close()
})

test('inverting an axis survives reload', async ({ page }) => {
  await page.locator('[data-testid=view-pcp]').getByText('flip').first().click()
  await expect(
    page.locator('[data-testid=view-pcp]').getByText('invert').first(),
  ).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('design-count')).toHaveText('10000')
  await expect(
    page.locator('[data-testid=view-pcp]').getByText('invert').first(),
  ).toBeVisible()
})
