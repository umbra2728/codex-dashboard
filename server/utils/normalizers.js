export const SLICE_NAMES = [
  'workspaces',
  'runs',
  'sessions',
  'toolCalls',
  'approvals',
  'policyEvents',
  'usageSamples',
  'sourceHealth'
];

const UNSAFE_IDS = new Set(['', '__proto__', 'constructor', 'prototype']);

function safeText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function safeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function safeBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function safeId(value, prefix) {
  const candidate = safeText(value, '');
  if (UNSAFE_IDS.has(candidate)) {
    return null;
  }

  return candidate || `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function sortByTimestampDesc(left, right, field) {
  return Date.parse(right?.[field] || 0) - Date.parse(left?.[field] || 0);
}

function normalizeCollection(items, normalizeItem, sortItems) {
  const normalizedItems = [];

  for (const item of Array.isArray(items) ? items : []) {
    const normalized = normalizeItem(item);
    if (normalized) {
      normalizedItems.push(normalized);
    }
  }

  normalizedItems.sort(sortItems);

  return normalizedItems.reduce(
    (accumulator, item) => {
      accumulator.byId[item.id] = item;
      accumulator.allIds.push(item.id);
      return accumulator;
    },
    { byId: Object.create(null), allIds: [] }
  );
}

function normalizeWorkspace(item = {}) {
  const id = safeId(item.id || item.slug || item.name, 'workspace');
  if (!id) {
    return null;
  }

  return {
    id,
    name: safeText(item.name, 'Unknown workspace'),
    slug: safeText(item.slug, id),
    rootPath: safeText(item.rootPath, ''),
    policyStatus: safeText(item.policyStatus, 'watch'),
    owner: safeText(item.owner, 'unknown')
  };
}

function normalizeRun(item = {}) {
  const id = safeId(item.id, 'run');
  if (!id) {
    return null;
  }

  return {
    id,
    workspaceId: safeText(item.workspaceId, 'unknown'),
    summary: safeText(item.summary, 'Untitled run'),
    status: safeText(item.status, 'unknown'),
    actor: safeText(item.actor, 'unknown'),
    model: safeText(item.model, 'unknown'),
    branch: safeText(item.branch, 'unknown'),
    riskLevel: safeText(item.riskLevel, 'low'),
    blocked: safeBoolean(item.blocked),
    startedAt: safeText(item.startedAt, null),
    updatedAt: safeText(item.updatedAt, item.startedAt || null)
  };
}

function normalizeSession(item = {}) {
  const id = safeId(item.id, 'session');
  if (!id) {
    return null;
  }

  return {
    id,
    workspaceId: safeText(item.workspaceId, 'unknown'),
    runId: safeText(item.runId, 'unknown'),
    label: safeText(item.label, 'Untitled session'),
    status: safeText(item.status, 'unknown'),
    model: safeText(item.model, 'unknown'),
    cwd: safeText(item.cwd, ''),
    terminal: safeText(item.terminal, ''),
    startedAt: safeText(item.startedAt, null),
    lastEventAt: safeText(item.lastEventAt, item.startedAt || null),
    endedAt: safeText(item.endedAt, null)
  };
}

function normalizeToolCall(item = {}) {
  const id = safeId(item.id, 'tool');
  if (!id) {
    return null;
  }

  return {
    id,
    workspaceId: safeText(item.workspaceId, 'unknown'),
    runId: safeText(item.runId, 'unknown'),
    sessionId: safeText(item.sessionId, 'unknown'),
    tool: safeText(item.tool, 'unknown'),
    kind: safeText(item.kind, 'unknown'),
    status: safeText(item.status, 'ok'),
    latencyMs: safeNumber(item.latencyMs),
    timestamp: safeText(item.timestamp, null),
    summary: safeText(item.summary, ''),
    risky: safeBoolean(item.risky),
    blocked: safeBoolean(item.blocked)
  };
}

function normalizeApproval(item = {}) {
  const id = safeId(item.id, 'approval');
  if (!id) {
    return null;
  }

  return {
    id,
    workspaceId: safeText(item.workspaceId, 'unknown'),
    runId: safeText(item.runId, 'unknown'),
    sessionId: safeText(item.sessionId, 'unknown'),
    status: safeText(item.status, 'pending'),
    action: safeText(item.action, ''),
    reason: safeText(item.reason, ''),
    risk: safeText(item.risk, 'medium'),
    requestedBy: safeText(item.requestedBy, 'system'),
    requestedAt: safeText(item.requestedAt, null),
    resolvedAt: safeText(item.resolvedAt, null)
  };
}

function normalizePolicyEvent(item = {}) {
  const id = safeId(item.id, 'policy');
  if (!id) {
    return null;
  }

  return {
    id,
    workspaceId: safeText(item.workspaceId, 'unknown'),
    runId: safeText(item.runId, 'unknown'),
    sessionId: safeText(item.sessionId, 'unknown'),
    severity: safeText(item.severity, 'low'),
    category: safeText(item.category, 'general'),
    status: safeText(item.status, 'open'),
    message: safeText(item.message, ''),
    policy: safeText(item.policy, ''),
    timestamp: safeText(item.timestamp, null)
  };
}

function normalizeUsageSample(item = {}) {
  const id = safeId(item.id, 'usage');
  if (!id) {
    return null;
  }

  return {
    id,
    workspaceId: safeText(item.workspaceId, 'unknown'),
    runId: safeText(item.runId, 'unknown'),
    sessionId: safeText(item.sessionId, 'unknown'),
    model: safeText(item.model, 'unknown'),
    inputTokens: safeNumber(item.inputTokens),
    outputTokens: safeNumber(item.outputTokens),
    costUsd: safeNumber(item.costUsd),
    timestamp: safeText(item.timestamp, null)
  };
}

function normalizeSourceHealth(item = {}) {
  const id = safeId(item.id, 'source');
  if (!id) {
    return null;
  }

  return {
    id,
    workspaceId: safeText(item.workspaceId, 'global'),
    source: safeText(item.source, 'unknown'),
    label: safeText(item.label, 'Unknown source'),
    category: safeText(item.category, 'adapter'),
    status: safeText(item.status, 'healthy'),
    detail: safeText(item.detail, ''),
    lagMs: safeNumber(item.lagMs),
    updatedAt: safeText(item.updatedAt, null)
  };
}

export function createEmptySnapshot() {
  return SLICE_NAMES.reduce((accumulator, sliceName) => {
    accumulator[sliceName] = { byId: Object.create(null), allIds: [] };
    return accumulator;
  }, {});
}

export function normalizeDashboardData(rawData = {}) {
  return {
    workspaces: normalizeCollection(rawData.workspaces, normalizeWorkspace, (left, right) => left.name.localeCompare(right.name)),
    runs: normalizeCollection(rawData.runs, normalizeRun, (left, right) => sortByTimestampDesc(left, right, 'updatedAt')),
    sessions: normalizeCollection(rawData.sessions, normalizeSession, (left, right) => sortByTimestampDesc(left, right, 'lastEventAt')),
    toolCalls: normalizeCollection(rawData.toolCalls, normalizeToolCall, (left, right) => sortByTimestampDesc(left, right, 'timestamp')),
    approvals: normalizeCollection(rawData.approvals, normalizeApproval, (left, right) => sortByTimestampDesc(left, right, 'requestedAt')),
    policyEvents: normalizeCollection(rawData.policyEvents, normalizePolicyEvent, (left, right) => sortByTimestampDesc(left, right, 'timestamp')),
    usageSamples: normalizeCollection(rawData.usageSamples, normalizeUsageSample, (left, right) => sortByTimestampDesc(left, right, 'timestamp')),
    sourceHealth: normalizeCollection(rawData.sourceHealth, normalizeSourceHealth, (left, right) => sortByTimestampDesc(left, right, 'updatedAt'))
  };
}

export function pickSnapshotSlices(snapshot, changedSlices = SLICE_NAMES) {
  return changedSlices.reduce((accumulator, sliceName) => {
    if (snapshot[sliceName]) {
      accumulator[sliceName] = snapshot[sliceName];
    }
    return accumulator;
  }, {});
}
