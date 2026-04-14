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

test('navigates through the primary dashboard views', async ({ page }) => {
  await unlockDashboard(page);

  await page.getByRole('button', { name: 'Runs Execution inventory' }).click();
  await expect(page.getByRole('heading', { name: 'Execution runs across workspaces' })).toBeVisible();
  await expect(page.getByText('Selected run')).toBeVisible();

  await page.getByRole('button', { name: 'Sessions Timelines' }).click();
  await expect(page.getByRole('heading', { name: 'Execution sessions and status' })).toBeVisible();

  await page.getByRole('button', { name: 'Tools Ledger + latency' }).click();
  await expect(page.getByRole('heading', { name: 'Executed tool calls' })).toBeVisible();

  await page.getByRole('button', { name: 'Governance Approvals + policy' }).click();
  await expect(page.getByRole('heading', { name: 'Read-only approval queue' })).toBeVisible();

  await page.getByRole('button', { name: 'Usage Tokens + cost' }).click();
  await expect(page.getByRole('heading', { name: 'Token and cost events' })).toBeVisible();

  await page.getByPlaceholder('Search runs, sessions, tools, approvals…').fill('deploy');
  await page.getByRole('button', { name: /bash deploy.sh --prod/i }).click();
  await expect(page.getByRole('heading', { name: 'Read-only approval queue' })).toBeVisible();
  await expect(page.getByText('Deploy command requires manual approval before execution')).toBeVisible();
});
