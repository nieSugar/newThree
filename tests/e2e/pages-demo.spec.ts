import { expect, test } from '@playwright/test'

test('3D model click switches low-code page while persistent Three runtime stays alive', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('#three-frame')).toHaveCount(1)
  await expect(page.locator('#canvas-frame')).toHaveCount(1)
  await expect(page.locator('#bridge-state')).toHaveText('ready', { timeout: 30_000 })

  const lowcode = page.frameLocator('#canvas-frame')
  const three = page.frameLocator('#three-frame')

  await expect(lowcode.locator('#current-page')).toHaveText('overview')
  await expect(three.locator('canvas')).toBeVisible({ timeout: 30_000 })

  const threeBootBefore = await page.locator('#three-boot').textContent()
  const threeLoadsBefore = await page.locator('#three-loads').textContent()
  const canvasLoadsBefore = await page.locator('#canvas-loads').textContent()

  // The camera target is centered on Pump P-101, so clicking the center of the
  // real WebGL canvas exercises Raycaster -> object.click -> AppShell routing.
  const canvasBox = await three.locator('canvas').boundingBox()
  if (!canvasBox) throw new Error('Three canvas has no bounding box')
  await three.locator('canvas').click({
    position: { x: Math.floor(canvasBox.width / 2), y: Math.floor(canvasBox.height / 2) }
  })

  await expect(page.locator('#last-event')).toHaveText('object.click', { timeout: 10_000 })
  await expect(page.locator('#active-page')).toHaveText('pump-detail')
  await expect(page.locator('#page-switches')).toHaveText('1')
  await expect(lowcode.locator('#current-page')).toHaveText('pump-detail')
  await expect(lowcode.locator('#page-title')).toContainText('Pump P-101')

  // Switching the low-code page must not reload either iframe.
  await expect(page.locator('#canvas-loads')).toHaveText(canvasLoadsBefore || '')
  await expect(page.locator('#three-boot')).toHaveText(threeBootBefore || '')
  await expect(page.locator('#three-loads')).toHaveText(threeLoadsBefore || '')

  // The newly selected low-code page can still control the same Three runtime.
  await lowcode.locator('#detail-highlight').click()
  await expect(page.locator('#last-event')).toHaveText('object.highlighted', { timeout: 10_000 })

  await lowcode.locator('#detail-camera').click()
  await expect(page.locator('#last-event')).toHaveText('camera.focused', { timeout: 10_000 })

  // Even a real Canvas reload restores the active low-code page from AppShell
  // while keeping the existing Three iframe / bootId / WebGL runtime.
  const canvasLoadsBeforeReload = Number(await page.locator('#canvas-loads').textContent())
  await lowcode.getByRole('button', { name: /Reload Low-code Canvas/ }).click()
  await expect.poll(async () => Number(await page.locator('#canvas-loads').textContent()), { timeout: 15_000 }).toBeGreaterThan(canvasLoadsBeforeReload)

  await expect(page.locator('#active-page')).toHaveText('pump-detail')
  await expect(lowcode.locator('#current-page')).toHaveText('pump-detail')
  await expect(page.locator('#three-boot')).toHaveText(threeBootBefore || '')
  await expect(page.locator('#three-loads')).toHaveText(threeLoadsBefore || '')
  await expect(page.locator('#bridge-state')).toHaveText('ready')

  await lowcode.locator('#detail-highlight').click()
  await expect(page.locator('#last-event')).toHaveText('object.highlighted', { timeout: 10_000 })

  // A normal low-code navigation back to overview also leaves Three untouched.
  await lowcode.locator('#back-overview').click()
  await expect(page.locator('#active-page')).toHaveText('overview')
  await expect(page.locator('#page-switches')).toHaveText('2')
  await expect(lowcode.locator('#current-page')).toHaveText('overview')
  await expect(page.locator('#three-boot')).toHaveText(threeBootBefore || '')
  await expect(page.locator('#three-loads')).toHaveText(threeLoadsBefore || '')
})
