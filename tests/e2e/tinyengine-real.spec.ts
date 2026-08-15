import { expect, test } from '@playwright/test'

test('real TinyEngine refresh keeps the Three.js runtime alive and bridged', async ({ page }) => {
  await page.goto('/?type=app&id=1&tenant=1')

  await expect
    .poll(() => page.locator('html').getAttribute('data-tiny-engine-mounted'), { timeout: 90_000 })
    .toBe('true')

  await expect(page.locator('iframe#canvas')).toHaveCount(1, { timeout: 90_000 })
  await expect(page.getByTestId('tiny-three-proof')).toBeVisible({ timeout: 90_000 })
  await expect(page.locator('#persistent-three-frame')).toHaveCount(1)

  await expect
    .poll(() => page.evaluate(() => (window as any).__threePocBridge?.getState().ready), { timeout: 30_000 })
    .toBe(true)

  const before = await page.evaluate(() => (window as any).__threePocBridge.getState())
  expect(before.bootId).toBeTruthy()

  const widthBefore = await page.locator('#three-runtime-pane').evaluate((element) => element.getBoundingClientRect().width)

  // TinyEngine's mock application can show a first-run confirm modal over the toolbar.
  // Calling the actual ToolbarBase root's DOM click still exercises
  // ToolbarBase @click -> click-api -> ThreePocToolbar.runProof without depending on modal copy.
  await page
    .getByTestId('tiny-three-proof')
    .locator('.toolbar-item-wrap')
    .evaluate((element: HTMLElement) => element.click())

  await expect
    .poll(() => page.evaluate(() => (window as any).__TINY_ENGINE_THREE_POC?.commandSent))
    .toBe(true)
  await expect
    .poll(() => page.evaluate(() => (window as any).__TINY_ENGINE_THREE_POC?.canvasReloadRequested))
    .toBe(true)
  await expect
    .poll(() => page.evaluate(() => (window as any).__TINY_ENGINE_THREE_POC?.canvasReloadCompleted), { timeout: 30_000 })
    .toBe(true)
  await expect
    .poll(() => page.evaluate(() => (window as any).__TINY_ENGINE_THREE_POC?.lastInboundEvent?.name), { timeout: 30_000 })
    .toBe('object.highlighted')

  await expect
    .poll(() => page.locator('#three-runtime-pane').evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(widthBefore)

  const afterRefresh = await page.evaluate(() => (window as any).__threePocBridge.getState())
  expect(afterRefresh.bootId).toBe(before.bootId)
  expect(afterRefresh.loadCount).toBe(before.loadCount)
  await expect(page.locator('#persistent-three-frame')).toHaveCount(1)

  const threeCanvas = page.frameLocator('#persistent-three-frame').locator('canvas')
  await threeCanvas.evaluate((canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      })
    )
  })
  await expect
    .poll(() => page.evaluate(() => (window as any).__TINY_ENGINE_THREE_POC?.lastInboundEvent?.name), { timeout: 15_000 })
    .toBe('object.click')
  await expect
    .poll(() => page.evaluate(() => (window as any).__TINY_ENGINE_THREE_POC?.lastInboundEvent?.payload?.objectId))
    .toBe('poc-cube')

  const proof = await page.evaluate(() => (window as any).__TINY_ENGINE_THREE_POC)
  expect(proof.runs).toBe(1)
  expect(proof.lastError).toBeNull()
})
