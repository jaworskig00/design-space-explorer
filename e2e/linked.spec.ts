import { expect, test } from '@playwright/test'

test('brushing angle of attack filters the design count', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('design-count')).toHaveText('10000')
  await page.getByTestId('brush-alpha_deg-min').fill('0')
  await page.getByTestId('brush-alpha_deg-max').fill('4')
  await expect(page.getByTestId('filter-count')).not.toHaveText('10000')
  const count = Number(await page.getByTestId('filter-count').textContent())
  expect(count).toBeGreaterThan(0)
  expect(count).toBeLessThan(10000)
  await page.reload()
  await expect(page.getByTestId('filter-count')).toHaveText(String(count))
  await page.getByTestId('reset-filters').click()
  await expect(page.getByTestId('filter-count')).toHaveText('10000')
})
