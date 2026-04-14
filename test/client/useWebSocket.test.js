import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWebSocket } from '../../src/hooks/useWebSocket.js';

vi.mock('../../src/utils/api.js', () => ({
  requestJson: vi.fn()
}));

const { requestJson } = await import('../../src/utils/api.js');

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    MockWebSocket.instances.push(this);
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  emit(payload) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  ping() {}
}

const bootstrapPayload = {
  revision: 1,
  generatedAt: '2026-04-14T10:45:00.000Z',
  mode: 'mock',
  views: {
    workspaces: [],
    overview: {
      generatedAt: '2026-04-14T10:45:00.000Z',
      mode: 'mock',
      metrics: {
        activeRuns: 1,
        failedRuns: 0,
        openApprovals: 0,
        policyFindings: 0,
        toolErrorRate: 0,
        totalTokens: 100,
        totalCost: 1
      },
      activeRuns: [],
      failedRuns: [],
      approvals: [],
      policyFindings: [],
      recentActivity: [],
      sourceHealth: { items: [], healthyCount: 0, warningCount: 0, errorCount: 0 }
    },
    runs: { items: [{ id: 'run-1', summary: 'Initial run' }] },
    sessions: { items: [], timeline: [] },
    tools: { ledger: [], summary: { totalCalls: 0, errorCount: 0, blockedCount: 0, riskyCount: 0, averageLatencyMs: 0, byTool: [] }, failures: [], riskyActions: [] },
    governance: { approvals: [], policyFeed: [], managedConfig: [], counts: { pendingApprovals: 0, openPolicies: 0, criticalPolicies: 0, approvedToday: 0 } },
    usage: { samples: [], totals: { inputTokens: 0, outputTokens: 0, totalTokens: 0, totalCost: 0 }, byModel: [], byWorkspace: [] }
  }
};

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
    MockWebSocket.instances = [];
    requestJson.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('hydrates from websocket initial and delta payloads', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost/ws?token=test', { enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(MockWebSocket.instances).toHaveLength(1);

    await act(async () => {
      MockWebSocket.instances[0].open();
      MockWebSocket.instances[0].emit({ type: 'initial_data', data: bootstrapPayload });
      MockWebSocket.instances[0].emit({
        type: 'dashboard_delta',
        data: {
          revision: 2,
          generatedAt: '2026-04-14T10:46:00.000Z',
          mode: 'mock',
          views: {
            ...bootstrapPayload.views,
            runs: { items: [{ id: 'run-2', summary: 'Delta run' }] }
          }
        }
      });
      await Promise.resolve();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.meta.revision).toBe(2);
    expect(result.current.views.runs.items[0].id).toBe('run-2');
    expect(result.current.connectionStatus).toBe('connected');
  });

  it('falls back to REST polling when the socket is stale or down', async () => {
    vi.useFakeTimers();

    requestJson.mockResolvedValue({
      meta: { revision: 3, generatedAt: '2026-04-14T10:47:00.000Z', mode: 'mock' },
      views: {
        ...bootstrapPayload.views,
        overview: {
          ...bootstrapPayload.views.overview,
          metrics: { ...bootstrapPayload.views.overview.metrics, activeRuns: 4 }
        }
      }
    });

    const { result } = renderHook(() => useWebSocket('ws://localhost/ws?token=test', { enabled: true, initialPayload: bootstrapPayload }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(MockWebSocket.instances).toHaveLength(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
      await Promise.resolve();
    });

    expect(requestJson).toHaveBeenCalledWith('/api/dashboard');
    expect(result.current.views.overview.metrics.activeRuns).toBe(4);
    expect(result.current.meta.revision).toBe(3);
  });
});
