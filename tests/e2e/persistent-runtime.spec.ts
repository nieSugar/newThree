import { expect, test } from '@playwright/test'

test('Three runtime survives low-code remount, resizes, and communicates both ways', async ({ page }) => {
  await page.goto('/poc-host.html')

  const frameElement = page.locator('#three-runtime-frame')
  await expect(frameElement).toBeVisible()

  const runtime = page.frameLocator('#three-runtime-frame')
  await expect(runtime.locator('canvas')).toBeVisible()

  const bootIdBefore = await page.locator('[data-testid="boot-id"]').textContent()
  expect(bootIdBefore).toBeTruthy()
  expect(bootIdBefore).not.toBe('-')

  const frameBoxBefore = await frameElement.boundingBox()
  expect(frameBoxBefore?.height).toBeGreaterThan(300)

  await page.getByRole('button', { name: '低代码 → 3D：高亮/旋转立方体' }).click()

  await page.getByRole('button', { name: '调整 3D 面板大小' }).click()
  await expect.poll(async () => (await frameElement.boundingBox())?.height ?? 0).toBeGreaterThan(550)

  await page.getByRole('button', { name: '模拟 Schema/Page 重渲染' }).click()
  await expect(page.locator('[data-testid="remount-count"]')).toHaveText('4')

  const bootIdAfter = await page.locator('[data-testid="boot-id"]').textContent()
  expect(bootIdAfter).toBe(bootIdBefore)

  const iframeCount = await page.locator('#three-runtime-frame').count()
  expect(iframeCount).toBe(1)

  const canvas = runtime.locator('canvas')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  if (!box) return

  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
  await expect(page.locator('[data-testid="selected-object"]')).toHaveText('poc-cube')
})
