import { expect, test } from '@playwright/test';
import { guides } from '../src/content/guides';
import { usecases } from '../src/content/usecases';
import { SITE_ORIGIN, sitePages } from '../src/seo';

test('every guide and use case has unique metadata, direct routes, and working content', async ({ page }) => {
  for (const item of [...guides.map(guide => ({ path: `/guides/${guide.slug}`, item: guide })), ...usecases.map(usecase => ({ path: `/usecase/${usecase.slug}`, item: usecase }))]) {
    await page.goto(item.path);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', item.item.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_ORIGIN}${item.path}`);
    await expect(page.locator('.guide-steps li')).toHaveCount(item.item.steps.length);
    await expect(page.locator('.guide-example')).toContainText(item.item.source);
    await expect(page.locator('.guide-example figcaption')).toContainText('Illustrative');
  }
});

test('article content and metadata are in the response without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/guides/xlsx-to-csv-offline');
  await expect(page.locator('h1')).toHaveText(guides[0].headline);
  await expect(page.getByRole('heading', { name: guides[0].steps[0].title })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_ORIGIN}/guides/xlsx-to-csv-offline`);
  await context.close();
});

test('guide illustrations pause and respect reduced motion on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/guides/split-excel-worksheets');
  await page.getByRole('button', { name: 'Pause motion' }).click();
  await expect(page.locator('.guide-example')).toHaveClass(/is-paused/);
  await expect(page.locator('.guide-output-file').first()).toHaveCSS('animation-play-state', 'paused');
  await page.getByRole('button', { name: 'Resume motion' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.guide-output-file').first()).toHaveCSS('animation-name', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: '/tmp/santra-guide-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '/tmp/santra-guide-desktop.png', fullPage: true });
});

test('indexes link to all articles and metadata follows client navigation', async ({ page }) => {
  await page.goto('/guides');
  await expect(page.locator('.guide-directory-row')).toHaveCount(guides.length);
  await page.locator('header').getByRole('link', { name: 'Use cases', exact: true }).click();
  await expect(page.locator('.usecase-story')).toHaveCount(usecases.length);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_ORIGIN}/usecase`);
  await page.locator('.usecase-story').first().click();
  await expect(page).toHaveURL(`/usecase/${usecases[0].slug}`);
  await page.goBack();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', sitePages.find(page => page.path === '/usecase')!.description);
  await page.goto('/nothing-here');
  await expect(page.locator('main h1')).toHaveText('This page went missing.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
});
