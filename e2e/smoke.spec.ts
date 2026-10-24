import { expect, test } from '@playwright/test'

const regions = [
  'Parallel coordinates',
  'Focused scatter',
  'Pareto front',
  'Scatterplot matrix',
  'Distributions',
]

test('shows the titled dashboard regions', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Design Space Explorer')
  for (const name of regions) {
    await expect(page.getByRole('heading', { name })).toBeVisible()
  }
})
