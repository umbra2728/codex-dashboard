import { expect, test } from '@playwright/test';

test('renders overview metrics from the mock fixture', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Operational visibility for local agent workflows.' })).toBeVisible();
  await expect(page.locator('.metric-card').filter({ hasText: 'Active runs' })).toContainText('2');
  await expect(page.locator('.metric-card').filter({ hasText: 'Failed runs' })).toContainText('1');
  await expect(page.locator('.metric-card').filter({ hasText: 'Open approvals' })).toContainText('2');
  await expect(page.locator('.metric-card').filter({ hasText: 'Estimated cost' })).toContainText('$10.52');
  await expect(page.getByRole('button', { name: /^Stabilize approval polling in CLI wrapper/ })).toBeVisible();
  await expect(page.getByText('Watching for normalized files.')).toHaveCount(0);
});
