import { describe, expect, it } from 'vitest';
import { createDashboardStore } from '../../server/store.js';
import { mockDashboardData } from '../fixtures/mock-dashboard-data.js';

describe('createDashboardStore', () => {
  it('hydrates fixture data into dashboard views', () => {
    const store = createDashboardStore({ mode: 'mock' });
    store.hydrate(mockDashboardData, { reason: 'test:init' });

    const bootstrap = store.getBootstrapPayload();

    expect(bootstrap.revision).toBe(1);
    expect(bootstrap.mode).toBe('mock');
    expect(bootstrap.views.overview.metrics).toMatchObject({
      activeRuns: 2,
      failedRuns: 1,
      openApprovals: 2,
      policyFindings: 3,
      totalTokens: 285000,
      totalCost: 10.52
    });
    expect(bootstrap.views.tools.summary).toMatchObject({
      totalCalls: 12,
      errorCount: 2,
      blockedCount: 2,
      riskyCount: 4
    });
    expect(bootstrap.views.runs.items[0].id).toBe('run-1042');
    expect(bootstrap.views.governance.counts.criticalPolicies).toBe(2);
    expect(bootstrap.views.usage.byWorkspace[0]).toMatchObject({
      label: 'Ops Lab',
      totalTokens: 152000,
      costUsd: 6.02
    });
  });

  it('notifies subscribers with changed slices', () => {
    const store = createDashboardStore({ mode: 'mock' });
    const updates = [];
    const unsubscribe = store.subscribe((update) => updates.push(update));

    store.hydrate(mockDashboardData, { changed: ['runs', 'sessions'], reason: 'test:update' });
    unsubscribe();

    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({
      reason: 'test:update',
      changed: ['runs', 'sessions']
    });
    expect(updates[0].snapshot.runs.allIds).toContain('run-1042');
    expect(updates[0].views.overview.metrics.activeRuns).toBe(2);
  });
});
