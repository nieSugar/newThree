import { expect, test } from '@playwright/test';

test('PBR reading links and Fresnel experiment follow the active lesson', async ({ page }) => {
  await page.goto('/#material-pbr-texture');
  const readings = page.locator('[data-role="lesson-readings"]');
  await expect(readings.getByRole('heading', { name: '深入阅读 · PBRT 第四版' })).toBeVisible();
  await expect(readings.getByRole('link')).toHaveCount(3);
  const fresnelLink = readings.getByRole('link', { name: /9.3/ });
  await expect(fresnelLink).toHaveAttribute('href', 'https://www.pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission');
  await expect(fresnelLink).toHaveAttribute('target', '_blank');
  await expect(fresnelLink).toHaveAttribute('rel', 'noopener noreferrer');

  const exercise = page.locator('.exercise-item').filter({ hasText: '观察掠射角反射' });
  await expect(exercise).not.toHaveClass(/passed/);
  await page.getByTestId('control-materialType').locator('select').selectOption('standard');
  await page.getByTestId('control-fresnelDemo').locator('input').check();
  await page.getByTestId('control-viewAngle').locator('input').fill('75');
  await page.getByTestId('control-metalness').locator('input').fill('0');
  await page.getByTestId('control-roughness').locator('input').fill('0.1');
  await page.getByTestId('control-textureEnabled').locator('input').uncheck();
  await expect(exercise).not.toHaveClass(/passed/);
  await page.getByTestId('control-viewAngle').locator('input').fill('0');
  await page.getByTestId('control-viewAngle').locator('input').fill('75');
  await expect(exercise).toHaveClass(/passed/);
  await expect(page.locator('canvas.lesson-canvas')).toHaveCount(1);

  await page.getByTestId('control-materialType').locator('select').selectOption('basic');
  await expect(exercise).not.toHaveClass(/passed/);
  await page.getByTestId('control-fresnelDemo').locator('input').uncheck();
  await expect(page.getByTestId('metrics-triangles')).not.toHaveText('0');

  await page.getByRole('button', { name: '上一课' }).click();
  await expect(page).toHaveURL(/#geometry-buffer-attributes/);
  await expect(readings).toBeHidden();
  await expect(readings.getByRole('link')).toHaveCount(0);
});

test('light isolation affects rendering and the PBR wiki exposes translated concepts', async ({ page }) => {
  await page.goto('/#lighting-shadow-tone');
  const mode = page.getByTestId('control-lightingMode').locator('select');
  const exercise = page.locator('.exercise-item').filter({ hasText: '隔离主光看入射方向' });
  await page.getByTestId('control-lightHeight').locator('input').fill('1.5');
  await mode.selectOption('key');
  await expect(exercise).not.toHaveClass(/passed/);
  await mode.selectOption('environment');
  await expect(page.locator('.exercise-item.passed')).toHaveCount(0);

  const environmentBrightness = await canvasBrightness();
  await mode.selectOption('key');
  await expect(exercise).toHaveClass(/passed/);
  await page.getByTestId('control-keyIntensity').locator('input').fill('0');
  await expect(page.locator('.exercise-item.passed')).toHaveCount(0);
  await expect.poll(canvasBrightness).toBeLessThan(environmentBrightness * 0.6);

  await page.getByRole('button', { name: 'Wiki', exact: true }).click();
  await page.locator('[data-role="wiki-search"]').fill('PBRT');
  await page.getByTestId('wiki-article-pbr').click();
  await expect(page.getByRole('heading', { name: '菲涅耳效应与能量守恒' })).toBeVisible();
  await expect(page.locator('[data-role="wiki-detail"] .reading-list a')).toHaveCount(3);
  await page.getByTestId('wiki-related-lesson-material-pbr-texture').click();
  await expect(page).toHaveURL(/#material-pbr-texture/);
  await expect(page.locator('[data-role="lesson-readings"] .reading-list a')).toHaveCount(3);

  async function canvasBrightness(): Promise<number> {
    return page.locator('canvas.lesson-canvas').evaluate(async (canvas) => {
      // 等新参数真正绘制到画布，再比较中央区域的平均亮度。
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const source = canvas as HTMLCanvasElement;
      const sampler = document.createElement('canvas');
      sampler.width = sampler.height = 32;
      const context = sampler.getContext('2d')!;
      context.drawImage(source, source.width * 0.2, source.height * 0.2, source.width * 0.6, source.height * 0.6, 0, 0, 32, 32);
      const data = context.getImageData(0, 0, 32, 32).data;
      let brightness = 0;
      for (let index = 0; index < data.length; index += 4) {
        brightness += (data[index] + data[index + 1] + data[index + 2]) / 3;
      }
      return brightness / (32 * 32);
    });
  }
});
