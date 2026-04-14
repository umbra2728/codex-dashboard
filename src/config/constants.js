export const AUTH_TOKEN_KEY = 'codex-dashboard-token';
export const WS_STALE_THRESHOLD_MS = 20_000;
export const REST_POLL_INTERVAL_MS = 15_000;
export const MAX_SEARCH_RESULTS = 8;

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', kicker: 'Live brief' },
  { id: 'runs', label: 'Runs', kicker: 'Execution inventory' },
  { id: 'sessions', label: 'Sessions', kicker: 'Timelines' },
  { id: 'tools', label: 'Tools', kicker: 'Ledger + latency' },
  { id: 'governance', label: 'Governance', kicker: 'Approvals + policy' },
  { id: 'usage', label: 'Usage', kicker: 'Tokens + cost' }
];

export const TIME_RANGE_OPTIONS = [
  { value: '60m', label: 'Last hour' },
  { value: '24h', label: 'Last day' },
  { value: '7d', label: 'Last week' }
];

export function createEmptyViews() {
  return {
    workspaces: [],
    overview: {
      generatedAt: null,
      mode: 'mock',
      metrics: {
        activeRuns: 0,
        failedRuns: 0,
        openApprovals: 0,
        policyFindings: 0,
        toolErrorRate: 0,
        totalTokens: 0,
        totalCost: 0
      },
      activeRuns: [],
      failedRuns: [],
      approvals: [],
      policyFindings: [],
      recentActivity: [],
      sourceHealth: {
        items: [],
        healthyCount: 0,
        warningCount: 0,
        errorCount: 0
      }
    },
    runs: { items: [] },
    sessions: { items: [], timeline: [] },
    tools: {
      ledger: [],
      summary: {
        totalCalls: 0,
        errorCount: 0,
        blockedCount: 0,
        riskyCount: 0,
        averageLatencyMs: 0,
        byTool: []
      },
      failures: [],
      riskyActions: []
    },
    governance: {
      approvals: [],
      policyFeed: [],
      managedConfig: [],
      counts: {
        pendingApprovals: 0,
        openPolicies: 0,
        criticalPolicies: 0,
        approvedToday: 0
      }
    },
    usage: {
      samples: [],
      totals: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCost: 0
      },
      byModel: [],
      byWorkspace: []
    }
  };
}
