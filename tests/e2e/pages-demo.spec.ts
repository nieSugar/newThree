import { expect, test } from '@playwright/test'

test('3D model click switches low-code page and browser URL without reloading Three', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('#three-frame')).toHaveCount(1)
  await expect(page.locator('#canvas-frame')).toHaveCount(1)
  await expect(page.locator('#bridge-state')).toHaveText('ready', { timeout: 30_000 })

  const lowcode = page.frameLocator('#canvas-frame')
  const three = page.frameLocator('#three-frame')

  await expect(lowcode.locator('#current-page')).toHaveText('overview')
  await expect(three.locator('canvas')).toBeVisible({ timeout: 30_000 })
  await expect(page).toHaveURL(/\/newThree\/?$/)

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
  await expect(page).toHaveURL(/\?page=pump-detail&device=pump_001$/)

  // Switching the low-code page and changing browser history must not reload either iframe.
  await expect(page.locator('#canvas-loads')).toHaveText(canvasLoadsBefore || '')
  await expect(page.locator('#three-boot')).toHaveText(threeBootBefore || '')
  await expect(page.locator('#three-loads')).toHaveText(threeLoadsBefore || '')

  // The newly selected low-code page can still control the same Three runtime.
  await lowcode.locator('#detail-highlight').click()
  await expect(page.locator('#last-event')).toHaveText('object.highlighted', { timeout: 10_000 })

  await lowcode.locator('#detail-camera').click()
  await expect(page.locator('#last-event')).toHaveText('camera.focused', { timeout: 10_000 })

  // A real Low-code Canvas reload keeps the URL/page state while preserving Three.
  const canvasLoadsBeforeReload = Number(await page.locator('#canvas-loads').textContent())
  await lowcode.getByRole('button', { name: /Reload Low-code Canvas/ }).click()
  await expect.poll(async () => Number(await page.locator('#canvas-loads').textContent()), { timeout: 15_000 }).toBeGreaterThan(canvasLoadsBeforeReload)

  await expect(page.locator('#active-page')).toHaveText('pump-detail')
  await expect(lowcode.locator('#current-page')).toHaveText('pump-detail')
  await expect(page).toHaveURL(/\?page=pump-detail&device=pump_001$/)
  await expect(page.locator('#three-boot')).toHaveText(threeBootBefore || '')
  await expect(page.locator('#three-loads')).toHaveText(threeLoadsBefore || '')
  await expect(page.locator('#bridge-state')).toHaveText('ready')

  const canvasLoadsAfterReload = await page.locator('#canvas-loads').textContent()

  // Low-code navigation back to overview updates the browser address without iframe reloads.
  await lowcode.locator('#back-overview').click()
  await expect(page.locator('#active-page')).toHaveText('overview')
  await expect(page.locator('#page-switches')).toHaveText('2')
  await expect(lowcode.locator('#current-page')).toHaveText('overview')
  await expect(page).toHaveURL(/\/newThree\/?$/)
  await expect(page.locator('#canvas-loads')).toHaveText(canvasLoadsAfterReload || '')
  await expect(page.locator('#three-boot')).toHaveText(threeBootBefore || '')
  await expect(page.locator('#three-loads')).toHaveText(threeLoadsBefore || '')

  // Native browser Back drives the low-code router via popstate; Three still stays alive.
  await page.goBack()
  await expect(page).toHaveURL(/\?page=pump-detail&device=pump_001$/)
  await expect(page.locator('#active-page')).toHaveText('pump-detail')
  await expect(page.locator('#page-switches')).toHaveText('3')
  await expect(lowcode.locator('#current-page')).toHaveText('pump-detail')
  await expect(lowcode.locator('#page-title')).toContainText('Pump P-101')
  await expect(page.locator('#canvas-loads')).toHaveText(canvasLoadsAfterReload || '')
  await expect(page.locator('#three-boot')).toHaveText(threeBootBefore || '')
  await expect(page.locator('#three-loads')).toHaveText(threeLoadsBefore || '')
})

test('direct query URL initializes the requested low-code page on GitHub Pages', async ({ page }) => {
  await page.goto('/?page=tank-detail&device=tank_002')

  await expect(page.locator('#bridge-state')).toHaveText('ready', { timeout: 30_000 })
  const lowcode = page.frameLocator('#canvas-frame')

  await expect(page.locator('#active-page')).toHaveText('tank-detail')
  await expect(lowcode.locator('#current-page')).toHaveText('tank-detail')
  await expect(lowcode.locator('#page-title')).toContainText('Tank T-202')
  await expect(page).toHaveURL(/\?page=tank-detail&device=tank_002$/)
})
