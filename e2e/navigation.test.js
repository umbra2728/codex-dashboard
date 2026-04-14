import { expect, test } from '@playwright/test';

test('navigates through the primary dashboard views', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Operational visibility for local agent workflows.' })).toBeVisible();

  await page.getByRole('button', { name: /^Runs/ }).click();
  await expect(page.getByRole('heading', { name: 'Execution runs across workspaces' })).toBeVisible();
  await expect(page.getByText('Selected run')).toBeVisible();

  await page.getByRole('button', { name: /^Sessions/ }).click();
  await expect(page.getByRole('heading', { name: 'Execution sessions and status' })).toBeVisible();

  await page.getByRole('button', { name: /^Tools/ }).click();
  await expect(page.getByRole('heading', { name: 'Executed tool calls' })).toBeVisible();

  await page.getByRole('button', { name: /^Governance/ }).click();
  await expect(page.getByRole('heading', { name: 'Read-only approval queue' })).toBeVisible();

  await page.getByRole('button', { name: /^Usage/ }).click();
  await expect(page.getByRole('heading', { name: 'Token and cost events' })).toBeVisible();

  await page.getByPlaceholder('Search runs, sessions, tools, approvals…').fill('deploy');
  await page.getByRole('button', { name: /bash deploy\.sh --prod/i }).click();
  await expect(page.getByRole('heading', { name: 'Read-only approval queue' })).toBeVisible();
  await expect(page.getByText('Deploy command requires manual approval before execution')).toBeVisible();
});
