import { describe, expect, it } from 'vitest';
import { createEmptySnapshot, normalizeDashboardData, pickSnapshotSlices } from '../../server/utils/normalizers.js';

describe('normalizeDashboardData', () => {
  it('drops unsafe identifiers and preserves valid entities', () => {
    const snapshot = normalizeDashboardData({
      workspaces: [
        { id: '__proto__', name: 'Unsafe workspace' },
        { id: 'ws-safe', name: 'Safe workspace', slug: 'safe' }
      ],
      runs: [
        { id: 'run-2', workspaceId: 'ws-safe', summary: 'Older', updatedAt: '2026-04-14T09:00:00.000Z' },
        { id: 'run-1', workspaceId: 'ws-safe', summary: 'Latest', updatedAt: '2026-04-14T10:00:00.000Z' }
      ],
      sessions: [],
      toolCalls: [],
      approvals: [],
      policyEvents: [],
      usageSamples: [],
      sourceHealth: []
    });

    expect(snapshot.workspaces.allIds).toEqual(['ws-safe']);
    expect(snapshot.workspaces.byId['__proto__']).toBeUndefined();
    expect(snapshot.runs.allIds).toEqual(['run-1', 'run-2']);
  });

  it('creates empty slices and can pick partial snapshots', () => {
    const empty = createEmptySnapshot();
    expect(Object.keys(empty)).toEqual([
      'workspaces',
      'runs',
      'sessions',
      'toolCalls',
      'approvals',
      'policyEvents',
      'usageSamples',
      'sourceHealth'
    ]);

    const partial = pickSnapshotSlices({
      ...empty,
      runs: { byId: { 'run-1': { id: 'run-1' } }, allIds: ['run-1'] }
    }, ['runs']);

    expect(partial).toEqual({
      runs: { byId: { 'run-1': { id: 'run-1' } }, allIds: ['run-1'] }
    });
  });
});
