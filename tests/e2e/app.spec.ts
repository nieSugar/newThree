import { expect, test, type Page } from '@playwright/test';

test('loads the learning app and renders a non-empty canvas', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '交互学习站' })).toBeVisible();
  await expect(page.getByTestId('lesson-canvas-host').locator('canvas')).toBeVisible();
  await expect(page.getByTestId('metrics-calls')).not.toHaveText('0');
  expect(await page.locator('[data-role="source"] .tok-keyword').count()).toBeGreaterThan(0);
  expect(await page.locator('[data-role="source"] .tok-namespace').count()).toBeGreaterThan(0);
  await expectCanvasHasColorVariance(page);
});

test('switches lessons without accumulating canvases', async ({ page }, testInfo) => {
  await page.goto('/');
  const lessons = page.locator('.lesson-row');
  const count = await lessons.count();
  expect(count).toBeGreaterThanOrEqual(26);
  const sampleCount = testInfo.project.name === 'mobile' ? Math.min(count, 6) : count;

  for (let index = 0; index < sampleCount; index += 1) {
    await lessons.nth(index).click();
    await expect(page.getByTestId('lesson-canvas-host').locator('canvas')).toBeVisible();
    await expect(page.locator('canvas.lesson-canvas')).toHaveCount(1);
  }
});

test('control changes update exercises and progress state', async ({ page }) => {
  await page.goto('/#foundation-scene-camera-renderer');
  const scale = page.getByTestId('control-scale').locator('input[type="range"]');
  await scale.fill('1.5');
  await page.getByTestId('control-wireframe').locator('input[type="checkbox"]').check();
  await expect(page.locator('.exercise-item.passed')).toHaveCount(1);
});

test('opens the wiki, searches shader content and jumps back to a related lesson', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Wiki' }).click();
  await expect(page.getByRole('heading', { name: '图文知识库' })).toBeVisible();

  await page.locator('[data-role="wiki-search"]').fill('shader');
  await expect(page.getByTestId('wiki-article-shader')).toBeVisible();
  await page.getByTestId('wiki-article-shader').click();

  await expect(page.locator('[data-role="wiki-title"]')).toContainText('Shader');
  await expect(page.getByTestId('wiki-visual-shader-flow')).toBeVisible();

  await page.getByTestId('wiki-related-lesson-shader-glsl-uniforms').click();
  await expect(page).toHaveURL(/#shader-glsl-uniforms/);
  await expect(page.getByTestId('lesson-canvas-host').locator('canvas')).toBeVisible();
});

test('opens a wiki article from a lesson term card', async ({ page }) => {
  await page.goto('/#foundation-scene-camera-renderer');
  await page.getByTestId('term-link-scene').click();

  await expect(page).toHaveURL(/#wiki\/scene/);
  await expect(page.locator('[data-role="wiki-title"]')).toContainText('Scene');
  await expect(page.getByTestId('wiki-visual-scene-graph')).toBeVisible();
});

async function expectCanvasHasColorVariance(page: Page): Promise<void> {
  await expect.poll(() => canvasHasColorVariance(page), {
    message: 'canvas should render visible color variance',
    timeout: 8_000
  }).toBe(true);
}

async function canvasHasColorVariance(page: Page): Promise<boolean> {
  return page.locator('canvas.lesson-canvas').evaluate(async (canvas) => {
    const source = canvas as HTMLCanvasElement;
    const image = new Image();
    image.src = source.toDataURL('image/png');
    await image.decode();

    const sampler = document.createElement('canvas');
    sampler.width = 32;
    sampler.height = 32;
    const context = sampler.getContext('2d');
    if (!context) {
      return false;
    }

    context.drawImage(image, 0, 0, sampler.width, sampler.height);
    const data = context.getImageData(0, 0, sampler.width, sampler.height).data;
    const colors = new Set<string>();

    for (let index = 0; index < data.length; index += 4 * 17) {
      colors.add(`${data[index]},${data[index + 1]},${data[index + 2]},${data[index + 3]}`);
      if (colors.size > 6) {
        return true;
      }
    }

    return false;
  });
}
