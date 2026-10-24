import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 1280, height: 800 },
  video: 'on',
})

test('records a brush crossing the views', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('design-count')).toHaveText('10000')
  await page.getByTestId('brush-alpha_deg-min').fill('0')
  await page.getByTestId('brush-alpha_deg-max').fill('4')
  await expect(page.getByTestId('filter-count')).not.toHaveText('10000')
  await page.getByTestId('reset-filters').click()
  await expect(page.getByTestId('filter-count')).toHaveText('10000')
  const video = page.video()
  await page.close()
  await video?.saveAs('docs/media/brush.webm')
})
