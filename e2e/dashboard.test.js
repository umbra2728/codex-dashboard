import { expect, test } from '@playwright/test';

const PASSWORD = 'codex-dashboard-pass';

async function loginFromCurrentPage(page) {
  await page.locator('label').filter({ hasText: /^Password$/ }).locator('input').fill(PASSWORD);
  await page.getByRole('button', { name: 'Unlock dashboard' }).click();
}

async function unlockDashboard(page) {
  await page.goto('/');

  const setupButton = page.getByRole('button', { name: 'Create password and continue' });
  if (await setupButton.isVisible().catch(() => false)) {
    await page.locator('label').filter({ hasText: /^Password$/ }).locator('input').fill(PASSWORD);
    await page.locator('label').filter({ hasText: /^Confirm password$/ }).locator('input').fill(PASSWORD);
    await setupButton.click();

    const setupConflict = page.getByText('Dashboard password is already configured.');
    if (await setupConflict.isVisible().catch(() => false)) {
      await page.goto('/');
      await loginFromCurrentPage(page);
    }
  } else {
    await loginFromCurrentPage(page);
  }

  await expect(page.getByRole('heading', { name: 'Operational visibility for local agent workflows.' })).toBeVisible();
}

test('renders overview metrics from the mock fixture', async ({ page }) => {
  await unlockDashboard(page);

  await expect(page.locator('.metric-card').filter({ hasText: 'Active runs' })).toContainText('2');
  await expect(page.locator('.metric-card').filter({ hasText: 'Failed runs' })).toContainText('1');
  await expect(page.locator('.metric-card').filter({ hasText: 'Open approvals' })).toContainText('2');
  await expect(page.locator('.metric-card').filter({ hasText: 'Estimated cost' })).toContainText('$10.52');
  await expect(page.getByRole('button', { name: /^Stabilize approval polling in CLI wrapper/ })).toBeVisible();
  await expect(page.getByText('Watching for normalized files.')).toHaveCount(0);
});
