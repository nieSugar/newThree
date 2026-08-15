import { expect, test } from '@playwright/test'

test('low-code controls reach persistent Three runtime and canvas reload keeps Three alive', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('#three-frame')).toHaveCount(1)
  await expect(page.locator('#canvas-frame')).toHaveCount(1)
  await expect(page.locator('#bridge-state')).toHaveText('ready', { timeout: 30_000 })

  const canvas = page.frameLocator('#canvas-frame')
  const bootBefore = await page.locator('#three-boot').textContent()
  const threeLoadsBefore = await page.locator('#three-loads').textContent()
  const canvasLoadsBefore = Number(await page.locator('#canvas-loads').textContent())

  await canvas.locator('#highlight').click()
  await expect(page.locator('#last-event')).toHaveText('object.highlighted', { timeout: 10_000 })

  await canvas.locator('#camera').click()
  await expect(page.locator('#last-event')).toHaveText('camera.changed', { timeout: 10_000 })

  await canvas.locator('#reload').click()
  await expect.poll(async () => Number(await page.locator('#canvas-loads').textContent()), { timeout: 15_000 }).toBeGreaterThan(canvasLoadsBefore)

  await expect(page.locator('#three-boot')).toHaveText(bootBefore || '')
  await expect(page.locator('#three-loads')).toHaveText(threeLoadsBefore || '')
  await expect(page.locator('#bridge-state')).toHaveText('ready')

  await canvas.locator('#highlight').click()
  await expect(page.locator('#last-event')).toHaveText('object.highlighted', { timeout: 10_000 })
})
