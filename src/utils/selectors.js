import { MAX_SEARCH_RESULTS } from '../config/constants.js';

export function filterByWorkspace(items, workspaceId) {
  if (!workspaceId || workspaceId === 'all') {
    return items;
  }

  return items.filter((item) => item.workspaceId === workspaceId);
}

export function filterByQuery(items, query, fields) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => fields.some((field) => String(item?.[field] || '').toLowerCase().includes(normalizedQuery)));
}

export function buildSearchResults(views, query, workspaceId) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const collections = [
    {
      page: 'runs',
      label: 'Runs',
      items: filterByWorkspace(views.runs.items, workspaceId),
      fields: ['summary', 'actor', 'model', 'branch', 'workspaceName'],
      toResult: (item) => ({ id: item.id, page: 'runs', title: item.summary, meta: `${item.workspaceName} · ${item.status}`, runId: item.id, workspaceId: item.workspaceId })
    },
    {
      page: 'sessions',
      label: 'Sessions',
      items: filterByWorkspace(views.sessions.items, workspaceId),
      fields: ['label', 'runSummary', 'model', 'workspaceName'],
      toResult: (item) => ({ id: item.id, page: 'sessions', title: item.label, meta: `${item.workspaceName} · ${item.status}`, runId: item.runId, workspaceId: item.workspaceId })
    },
    {
      page: 'tools',
      label: 'Tools',
      items: filterByWorkspace(views.tools.ledger, workspaceId),
      fields: ['tool', 'summary', 'workspaceName', 'runSummary', 'sessionLabel'],
      toResult: (item) => ({ id: item.id, page: 'tools', title: item.summary, meta: `${item.tool} · ${item.workspaceName}`, runId: item.runId, workspaceId: item.workspaceId })
    },
    {
      page: 'governance',
      label: 'Governance',
      items: filterByWorkspace([...views.governance.approvals, ...views.governance.policyFeed], workspaceId),
      fields: ['action', 'message', 'reason', 'workspaceName', 'runSummary'],
      toResult: (item) => ({ id: item.id, page: 'governance', title: item.action || item.message, meta: `${item.workspaceName} · ${item.runSummary || item.status}`, runId: item.runId, workspaceId: item.workspaceId })
    }
  ];

  return collections
    .flatMap((collection) => filterByQuery(collection.items, normalizedQuery, collection.fields).map(collection.toResult))
    .slice(0, MAX_SEARCH_RESULTS);
}

export function summarizeSourceHealth(sourceHealth = { healthyCount: 0, warningCount: 0, errorCount: 0 }) {
  return {
    healthy: sourceHealth.healthyCount || 0,
    warning: sourceHealth.warningCount || 0,
    error: sourceHealth.errorCount || 0
  };
}

export function getSelectedRun(runs = [], selectedRunId) {
  if (!runs.length) {
    return null;
  }

  return runs.find((run) => run.id === selectedRunId) || runs[0];
}
