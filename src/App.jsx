import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/AppShell.jsx';
import { GovernancePage } from './components/GovernancePage.jsx';
import { OverviewPage } from './components/OverviewPage.jsx';
import { RunsPage } from './components/RunsPage.jsx';
import { SessionsPage } from './components/SessionsPage.jsx';
import { ToolsPage } from './components/ToolsPage.jsx';
import { UsagePage } from './components/UsagePage.jsx';
import { createEmptyViews } from './config/constants.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { getWebSocketUrl, requestJson } from './utils/api.js';
import { buildSearchResults } from './utils/selectors.js';

const ACTIVE_RUN_STATUSES = new Set(['running', 'awaiting_approval']);
const FAILURE_STATUSES = new Set(['failed', 'error']);
const OPEN_POLICY_STATUSES = new Set(['open', 'pending']);

function getRangeCutoff(range) {
  const now = Date.now();
  if (range === '60m') {
    return now - 60 * 60 * 1000;
  }
  if (range === '24h') {
    return now - 24 * 60 * 60 * 1000;
  }
  if (range === '7d') {
    return now - 7 * 24 * 60 * 60 * 1000;
  }
  return 0;
}

function filterByWorkspace(items, workspaceId) {
  if (!workspaceId || workspaceId === 'all') {
    return items;
  }

  return items.filter((item) => item.workspaceId === workspaceId);
}

function filterByTime(items, field, range) {
  const cutoff = getRangeCutoff(range);
  if (!cutoff) {
    return items;
  }

  return items.filter((item) => {
    const value = item?.[field];
    if (!value) {
      return true;
    }
    return Date.parse(value) >= cutoff;
  });
}

function aggregateBy(items, key, metrics) {
  const bucket = new Map();

  for (const item of items) {
    const label = item[key] || 'unknown';
    const current = bucket.get(label) || { id: label, label };

    for (const metric of metrics) {
      current[metric] = (current[metric] || 0) + Number(item[metric] || 0);
    }

    bucket.set(label, current);
  }

  return Array.from(bucket.values()).sort((left, right) => {
    const primaryMetric = metrics[0];
    return (right[primaryMetric] || 0) - (left[primaryMetric] || 0);
  });
}

function aggregateToolsByName(tools) {
  return Array.from(
    tools.reduce((bucket, toolCall) => {
      const current = bucket.get(toolCall.tool) || { tool: toolCall.tool, count: 0, errors: 0, blocked: 0, latencyTotal: 0 };
      current.count += 1;
      current.errors += FAILURE_STATUSES.has(toolCall.status) ? 1 : 0;
      current.blocked += toolCall.blocked ? 1 : 0;
      current.latencyTotal += toolCall.latencyMs || 0;
      bucket.set(toolCall.tool, current);
      return bucket;
    }, new Map()).values()
  )
    .map((entry) => ({
      tool: entry.tool,
      count: entry.count,
      errors: entry.errors,
      blocked: entry.blocked,
      averageLatencyMs: entry.count ? Math.round(entry.latencyTotal / entry.count) : 0
    }))
    .sort((left, right) => right.count - left.count);
}

function buildFilteredViews(rawViews, workspaceId, range) {
  const runs = filterByTime(filterByWorkspace(rawViews.runs.items, workspaceId), 'updatedAt', range);
  const sessions = filterByTime(filterByWorkspace(rawViews.sessions.items, workspaceId), 'lastEventAt', range);
  const tools = filterByTime(filterByWorkspace(rawViews.tools.ledger, workspaceId), 'timestamp', range);
  const approvals = filterByTime(filterByWorkspace(rawViews.governance.approvals, workspaceId), 'requestedAt', range);
  const policyFeed = filterByTime(filterByWorkspace(rawViews.governance.policyFeed, workspaceId), 'timestamp', range);
  const usageSamples = filterByTime(filterByWorkspace(rawViews.usage.samples, workspaceId), 'timestamp', range);
  const sourceHealthItems = filterByTime(
    rawViews.overview.sourceHealth.items.filter((item) => workspaceId === 'all' || item.workspaceId === 'global' || item.workspaceId === workspaceId),
    'updatedAt',
    range
  );

  const recentActivity = [...tools, ...approvals, ...policyFeed]
    .map((item) => {
      if (item.tool) {
        return { ...item, kind: 'tool' };
      }
      if (item.action) {
        return { ...item, kind: 'approval' };
      }
      return { ...item, kind: 'policy' };
    })
    .sort((left, right) => Date.parse(right.timestamp || right.requestedAt || 0) - Date.parse(left.timestamp || left.requestedAt || 0))
    .slice(0, 12);

  const totalTokens = usageSamples.reduce((total, sample) => total + sample.totalTokens, 0);
  const totalCost = usageSamples.reduce((total, sample) => total + sample.costUsd, 0);
  const failedRuns = runs.filter((run) => run.status === 'failed');
  const openApprovals = approvals.filter((approval) => approval.status === 'pending');
  const openPolicies = policyFeed.filter((policy) => OPEN_POLICY_STATUSES.has(policy.status));
  const failedTools = tools.filter((toolCall) => FAILURE_STATUSES.has(toolCall.status));
  const byTool = aggregateToolsByName(tools);
  const byModel = aggregateBy(usageSamples, 'model', ['inputTokens', 'outputTokens', 'totalTokens', 'costUsd']);
  const byWorkspace = aggregateBy(usageSamples, 'workspaceName', ['inputTokens', 'outputTokens', 'totalTokens', 'costUsd']);
  const workspaces = rawViews.workspaces;

  return {
    workspaces,
    overview: {
      generatedAt: rawViews.overview.generatedAt,
      mode: rawViews.overview.mode,
      metrics: {
        activeRuns: runs.filter((run) => ACTIVE_RUN_STATUSES.has(run.status)).length,
        failedRuns: failedRuns.length,
        openApprovals: openApprovals.length,
        policyFindings: openPolicies.length,
        toolErrorRate: tools.length ? failedTools.length / tools.length : 0,
        totalTokens,
        totalCost
      },
      activeRuns: runs.filter((run) => ACTIVE_RUN_STATUSES.has(run.status)).slice(0, 5),
      failedRuns: failedRuns.slice(0, 5),
      approvals: openApprovals.slice(0, 5),
      policyFindings: openPolicies.slice(0, 5),
      recentActivity,
      sourceHealth: {
        items: sourceHealthItems,
        healthyCount: sourceHealthItems.filter((item) => item.status === 'healthy').length,
        warningCount: sourceHealthItems.filter((item) => item.status === 'warning').length,
        errorCount: sourceHealthItems.filter((item) => item.status === 'error').length
      }
    },
    runs: { items: runs },
    sessions: {
      items: sessions,
      timeline: rawViews.sessions.timeline.filter((item) => {
        const workspaceMatch = workspaceId === 'all' || item.workspaceId === workspaceId;
        const timeValue = item.timestamp || item.requestedAt;
        return workspaceMatch && (!timeValue || Date.parse(timeValue) >= getRangeCutoff(range));
      })
    },
    tools: {
      ledger: tools,
      summary: {
        totalCalls: tools.length,
        errorCount: failedTools.length,
        blockedCount: tools.filter((toolCall) => toolCall.blocked).length,
        riskyCount: tools.filter((toolCall) => toolCall.risky).length,
        averageLatencyMs: tools.length ? Math.round(tools.reduce((total, toolCall) => total + toolCall.latencyMs, 0) / tools.length) : 0,
        byTool
      },
      failures: failedTools,
      riskyActions: tools.filter((toolCall) => toolCall.risky || toolCall.blocked)
    },
    governance: {
      approvals,
      policyFeed,
      managedConfig: filterByTime(
        rawViews.governance.managedConfig.filter((item) => workspaceId === 'all' || item.workspaceId === 'global' || item.workspaceId === workspaceId),
        'updatedAt',
        range
      ),
      counts: {
        pendingApprovals: openApprovals.length,
        openPolicies: openPolicies.length,
        criticalPolicies: openPolicies.filter((policy) => ['critical', 'high'].includes(policy.severity)).length,
        approvedToday: approvals.filter((approval) => approval.status === 'approved').length
      }
    },
    usage: {
      samples: usageSamples,
      totals: {
        inputTokens: usageSamples.reduce((total, sample) => total + sample.inputTokens, 0),
        outputTokens: usageSamples.reduce((total, sample) => total + sample.outputTokens, 0),
        totalTokens,
        totalCost
      },
      byModel,
      byWorkspace
    }
  };
}

function LoadingScreen({ title, body, action = null }) {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <p className="eyebrow">Codex dashboard</p>
        <h1>{title}</h1>
        <p>{body}</p>
        {action ? <div className="empty-state-action">{action}</div> : null}
      </div>
    </div>
  );
}

function getDashboardMeta(bootstrap, socketMeta) {
  if (socketMeta?.generatedAt) {
    return socketMeta;
  }

  if (!bootstrap) {
    return socketMeta;
  }

  return {
    revision: bootstrap.revision ?? 0,
    generatedAt: bootstrap.generatedAt ?? null,
    mode: bootstrap.mode ?? 'mock'
  };
}

export default function App() {
  const [bootstrap, setBootstrap] = useState(null);
  const [bootstrapError, setBootstrapError] = useState('');
  const [activeView, setActiveView] = useState('overview');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const wsUrl = useMemo(() => getWebSocketUrl(), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await requestJson('/api/bootstrap');
        if (cancelled) {
          return;
        }
        setBootstrap(data);
        setBootstrapError('');
      } catch (error) {
        if (cancelled) {
          return;
        }
        setBootstrapError(error.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const socketState = useWebSocket(wsUrl, {
    enabled: Boolean(bootstrap),
    initialPayload: bootstrap
  });

  const dashboardMeta = getDashboardMeta(bootstrap, socketState.meta);
  const rawViews = dashboardMeta.generatedAt ? socketState.views : bootstrap?.views || socketState.views || createEmptyViews();
  const filteredViews = useMemo(
    () => buildFilteredViews(rawViews, selectedWorkspaceId, selectedTimeRange),
    [rawViews, selectedWorkspaceId, selectedTimeRange]
  );
  const currentWorkspace = filteredViews.workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null;
  const searchResults = useMemo(
    () => buildSearchResults(filteredViews, searchQuery, selectedWorkspaceId),
    [filteredViews, searchQuery, selectedWorkspaceId]
  );

  useEffect(() => {
    if (!selectedRunId && filteredViews.runs.items[0]) {
      setSelectedRunId(filteredViews.runs.items[0].id);
      return;
    }

    if (selectedRunId && !filteredViews.runs.items.some((run) => run.id === selectedRunId)) {
      setSelectedRunId(filteredViews.runs.items[0]?.id || null);
    }
  }, [filteredViews.runs.items, selectedRunId]);

  function handleSearchResultSelect(result) {
    setActiveView(result.page);
    setSelectedRunId(result.runId || result.id);
    setSearchQuery('');
  }

  if (!dashboardMeta.generatedAt && bootstrapError) {
    return (
      <LoadingScreen
        title="Unable to load the local dashboard."
        body={bootstrapError}
        action={(
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        )}
      />
    );
  }

  if (!dashboardMeta.generatedAt) {
    return (
      <LoadingScreen
        title="Loading the local dashboard."
        body="Connecting to the dashboard backend and hydrating the current workspace snapshot."
      />
    );
  }

  const pageProps = {
    overview: <OverviewPage overview={filteredViews.overview} onSelectRun={(runId) => { setSelectedRunId(runId); setActiveView('runs'); }} />,
    runs: <RunsPage runs={filteredViews.runs.items} selectedRunId={selectedRunId} onSelectRun={setSelectedRunId} />,
    sessions: <SessionsPage sessions={filteredViews.sessions.items} timeline={filteredViews.sessions.timeline} />,
    tools: <ToolsPage tools={filteredViews.tools} />,
    governance: <GovernancePage governance={filteredViews.governance} />,
    usage: <UsagePage usage={filteredViews.usage} />
  };

  return (
    <AppShell
      activeView={activeView}
      onSelectView={setActiveView}
      currentWorkspace={currentWorkspace}
      workspaceCount={filteredViews.workspaces.length}
      headerProps={{
        workspaces: filteredViews.workspaces,
        selectedWorkspaceId,
        onWorkspaceChange: setSelectedWorkspaceId,
        selectedTimeRange,
        onTimeRangeChange: setSelectedTimeRange,
        searchQuery,
        onSearchQueryChange: setSearchQuery,
        searchResults,
        onSearchResultSelect: handleSearchResultSelect,
        connectionStatus: socketState.connectionStatus,
        mode: dashboardMeta.mode,
        generatedAt: dashboardMeta.generatedAt
      }}
    >
      {pageProps[activeView]}
    </AppShell>
  );
}
