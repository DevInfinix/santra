import { expect, test } from '@playwright/test';

test('spreadsheet catalogue exposes desktop conversions and tools', async ({ page }) => {
  await page.goto('/tools?family=spreadsheets&mode=convert&action=PDF');
  await expect(page.locator('.desk-state')).toHaveText('BUILT IN');
  await expect(page.locator('.desk-selected h4')).toHaveText('PDF');
  await expect(page.locator('.desk-selected p')).toContainText('layout-limited');
  for (const action of ['Split worksheets', 'Delete metadata']) {
    await page.goto(`/tools?family=spreadsheets&mode=tools&action=${encodeURIComponent(action)}`);
    await expect(page.locator('.desk-selected h4')).toHaveText(action);
    await expect(page.locator('.motion-spreadsheets-' + action.toLowerCase().replaceAll(' ', '-'))).toBeVisible();
    await expect(page.locator('.desk-empty')).toHaveCount(0);
  }
});

test('GitHub remains accessible in the header on desktop and mobile', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools');
    const github = page.locator('header').getByRole('link', { name: 'Santra on GitHub (opens in a new tab)' });
    await expect(github).toBeVisible();
    await expect(github).toHaveAttribute('href', 'https://github.com/SinghAman21/santara');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test('crawler resources return plain text and are discoverable', async ({ page, request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toContain('User-agent: *\nAllow: /');
  const llms = await request.get('/llms.txt');
  expect(llms.status()).toBe(200);
  expect(llms.headers()['content-type']).toContain('text/plain');
  expect(await llms.text()).toContain('# Santra');
  expect(await llms.text()).toContain('Split worksheets');
  await page.goto('/tools');
  await expect(page.locator('link[rel="describedby"]')).toHaveAttribute('href', '/llms.txt');
});
