import { expect, test } from '@playwright/test'

test.describe('screenshots', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('writes the README stills', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('design-count')).toHaveText('10000')
    await page.screenshot({ path: 'docs/screenshots/overview.png' })
    await page
      .locator('[data-testid=view-scatter]')
      .screenshot({ path: 'docs/screenshots/scatter.png' })
    await page
      .locator('[data-testid=view-splom]')
      .screenshot({ path: 'docs/screenshots/splom.png' })
    await page
      .locator('[data-testid=view-pareto]')
      .screenshot({ path: 'docs/screenshots/pareto.png' })
    await page.getByRole('heading', { name: 'Design Space Explorer' }).click()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('details')).toBeVisible()
    await page
      .locator('[data-testid=view-details]')
      .screenshot({ path: 'docs/screenshots/details.png' })
    await page.getByTestId('brush-alpha_deg-min').fill('0')
    await page.getByTestId('brush-alpha_deg-max').fill('4')
    await expect(page.getByTestId('filter-count')).not.toHaveText('10000')
    await page.screenshot({ path: 'docs/screenshots/brushed.png' })
  })
})
