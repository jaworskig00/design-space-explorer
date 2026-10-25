import { expect, test } from '@playwright/test'

test('first visit explains the keyboard and stays dismissed', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })
  await page.goto('/')
  await expect(page.getByTestId('design-count')).toHaveText('10000')
  const dialog = page.getByRole('dialog', { name: 'How to explore' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Walk the filtered designs')
  await expect(dialog).toContainText('surrogate')
  await page.getByTestId('dismiss-onboarding').click()
  await expect(dialog).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('design-count')).toHaveText('10000')
  await expect(dialog).toHaveCount(0)
})

test('help can be reopened and does not swallow the next shortcut', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByTestId('design-count')).toHaveText('10000')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByTestId('show-help').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('details')).toContainText(/id \d+/)
})

test('the corner card stays put and can open the full guide', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByTestId('design-count')).toHaveText('10000')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const fab = page.getByTestId('show-help-card')
  await expect(fab).toBeVisible()
  const box = await fab.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(box!.y).toBeGreaterThan(viewport!.height - 80)
  await page.keyboard.press('ArrowRight')
  const details = page.getByTestId('details')
  await expect(details).toContainText(/id \d+/)
  await fab.click()
  const card = page.getByTestId('help-card')
  await expect(card).toContainText('Walk the filtered designs')
  await page.keyboard.press('Escape')
  await expect(card).toHaveCount(0)
  await expect(details).toContainText(/id \d+/)
  await page.keyboard.press('?')
  await expect(card).toBeVisible()
  await page.keyboard.press('?')
  await expect(card).toHaveCount(0)
  await page.keyboard.press('?')
  await page.getByTestId('open-guide').click()
  await expect(
    page.getByRole('dialog', { name: 'How to explore' }),
  ).toBeVisible()
})
