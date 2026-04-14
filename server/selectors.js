const ACTIVE_RUN_STATUSES = new Set(['running', 'awaiting_approval']);
const OPEN_STATUSES = new Set(['pending', 'open']);
const FAILURE_STATUSES = new Set(['failed', 'error']);
const HIGH_SEVERITIES = new Set(['high', 'critical']);

function materialize(slice) {
  return slice.allIds.map((id) => slice.byId[id]).filter(Boolean);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values) {
  return values.length ? Math.round(sum(values) / values.length) : 0;
}

function sortByDateDesc(left, right, field) {
  return Date.parse(right?.[field] || 0) - Date.parse(left?.[field] || 0);
}

function buildLookup(items, key) {
  return items.reduce((accumulator, item) => {
    const value = item?.[key];
    if (!value) {
      return accumulator;
    }

    if (!accumulator[value]) {
      accumulator[value] = [];
    }

    accumulator[value].push(item);
    return accumulator;
  }, {});
}

function aggregateUsageBy(list, key) {
  const bucket = new Map();

  for (const sample of list) {
    const label = sample[key] || 'unknown';
    const current = bucket.get(label) || { id: label, label, inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0, sampleCount: 0 };
    current.inputTokens += sample.inputTokens;
    current.outputTokens += sample.outputTokens;
    current.totalTokens += sample.inputTokens + sample.outputTokens;
    current.costUsd += sample.costUsd;
    current.sampleCount += 1;
    bucket.set(label, current);
  }

  return Array.from(bucket.values()).sort((left, right) => right.totalTokens - left.totalTokens);
}

function aggregateToolUsageByTool(list) {
  const bucket = new Map();

  for (const call of list) {
    const current = bucket.get(call.tool) || { tool: call.tool, count: 0, errors: 0, blocked: 0, averageLatencyMs: 0, latencies: [] };
    current.count += 1;
    current.errors += FAILURE_STATUSES.has(call.status) ? 1 : 0;
    current.blocked += call.blocked ? 1 : 0;
    current.latencies.push(call.latencyMs);
    bucket.set(call.tool, current);
  }

  return Array.from(bucket.values())
    .map((entry) => ({
      tool: entry.tool,
      count: entry.count,
      errors: entry.errors,
      blocked: entry.blocked,
      averageLatencyMs: average(entry.latencies)
    }))
    .sort((left, right) => right.count - left.count);
}

function decorateActivity(items, kind) {
  return items.map((item) => ({ ...item, kind }));
}

export function materializeSnapshot(snapshot) {
  return {
    workspaces: materialize(snapshot.workspaces),
    runs: materialize(snapshot.runs),
    sessions: materialize(snapshot.sessions),
    toolCalls: materialize(snapshot.toolCalls),
    approvals: materialize(snapshot.approvals),
    policyEvents: materialize(snapshot.policyEvents),
    usageSamples: materialize(snapshot.usageSamples),
    sourceHealth: materialize(snapshot.sourceHealth)
  };
}

export function buildDashboardViews(snapshot, { generatedAt, mode }) {
  const entities = materializeSnapshot(snapshot);
  const workspaceMap = Object.fromEntries(entities.workspaces.map((workspace) => [workspace.id, workspace]));
  const sessionsByRunId = buildLookup(entities.sessions, 'runId');
  const toolsByRunId = buildLookup(entities.toolCalls, 'runId');
  const toolsBySessionId = buildLookup(entities.toolCalls, 'sessionId');
  const approvalsByRunId = buildLookup(entities.approvals, 'runId');
  const policiesByRunId = buildLookup(entities.policyEvents, 'runId');
  const usageByRunId = buildLookup(entities.usageSamples, 'runId');
  const approvalsBySessionId = buildLookup(entities.approvals, 'sessionId');
  const policiesBySessionId = buildLookup(entities.policyEvents, 'sessionId');

  const decoratedRuns = entities.runs.map((run) => {
    const workspace = workspaceMap[run.workspaceId];
    const sessions = sessionsByRunId[run.id] || [];
    const tools = toolsByRunId[run.id] || [];
    const approvals = approvalsByRunId[run.id] || [];
    const policies = policiesByRunId[run.id] || [];
    const usageSamples = usageByRunId[run.id] || [];
    const totalTokens = sum(usageSamples.map((sample) => sample.inputTokens + sample.outputTokens));
    const totalCost = sum(usageSamples.map((sample) => sample.costUsd));

    return {
      ...run,
      workspaceName: workspace?.name || run.workspaceId,
      workspaceSlug: workspace?.slug || run.workspaceId,
      sessionCount: sessions.length,
      toolCallCount: tools.length,
      pendingApprovalCount: approvals.filter((approval) => approval.status === 'pending').length,
      openPolicyCount: policies.filter((policy) => policy.status !== 'resolved').length,
      totalTokens,
      totalCost,
      lastToolAt: tools[0]?.timestamp || run.updatedAt,
      sessions
    };
  });

  const decoratedSessions = entities.sessions.map((session) => {
    const workspace = workspaceMap[session.workspaceId];
    const run = snapshot.runs.byId[session.runId];
    const tools = toolsBySessionId[session.id] || [];
    const approvals = approvalsBySessionId[session.id] || [];
    const policies = policiesBySessionId[session.id] || [];

    return {
      ...session,
      workspaceName: workspace?.name || session.workspaceId,
      runSummary: run?.summary || session.runId,
      toolCallCount: tools.length,
      pendingApprovalCount: approvals.filter((approval) => approval.status === 'pending').length,
      openPolicyCount: policies.filter((policy) => policy.status !== 'resolved').length
    };
  });

  const decoratedApprovals = entities.approvals.map((approval) => ({
    ...approval,
    workspaceName: workspaceMap[approval.workspaceId]?.name || approval.workspaceId,
    runSummary: snapshot.runs.byId[approval.runId]?.summary || approval.runId,
    sessionLabel: snapshot.sessions.byId[approval.sessionId]?.label || approval.sessionId
  }));

  const decoratedPolicies = entities.policyEvents.map((policyEvent) => ({
    ...policyEvent,
    workspaceName: workspaceMap[policyEvent.workspaceId]?.name || policyEvent.workspaceId,
    runSummary: snapshot.runs.byId[policyEvent.runId]?.summary || policyEvent.runId,
    sessionLabel: snapshot.sessions.byId[policyEvent.sessionId]?.label || policyEvent.sessionId
  }));

  const decoratedTools = entities.toolCalls.map((toolCall) => ({
    ...toolCall,
    workspaceName: workspaceMap[toolCall.workspaceId]?.name || toolCall.workspaceId,
    runSummary: snapshot.runs.byId[toolCall.runId]?.summary || toolCall.runId,
    sessionLabel: snapshot.sessions.byId[toolCall.sessionId]?.label || toolCall.sessionId
  }));

  const decoratedUsage = entities.usageSamples.map((sample) => ({
    ...sample,
    workspaceName: workspaceMap[sample.workspaceId]?.name || sample.workspaceId,
    runSummary: snapshot.runs.byId[sample.runId]?.summary || sample.runId,
    sessionLabel: snapshot.sessions.byId[sample.sessionId]?.label || sample.sessionId,
    totalTokens: sample.inputTokens + sample.outputTokens
  }));

  const decoratedSourceHealth = entities.sourceHealth.map((source) => ({
    ...source,
    workspaceName: workspaceMap[source.workspaceId]?.name || (source.workspaceId === 'global' ? 'Global' : source.workspaceId)
  }));

  const recentActivity = [
    ...decorateActivity(decoratedTools, 'tool'),
    ...decorateActivity(decoratedApprovals, 'approval'),
    ...decorateActivity(decoratedPolicies, 'policy')
  ]
    .sort((left, right) => {
      const leftTime = left.timestamp || left.requestedAt || left.updatedAt;
      const rightTime = right.timestamp || right.requestedAt || right.updatedAt;
      return Date.parse(rightTime || 0) - Date.parse(leftTime || 0);
    })
    .slice(0, 12);

  const totalTokens = sum(decoratedUsage.map((sample) => sample.totalTokens));
  const totalCost = Number(sum(decoratedUsage.map((sample) => sample.costUsd)).toFixed(2));
  const failedToolCalls = decoratedTools.filter((toolCall) => FAILURE_STATUSES.has(toolCall.status));
  const blockedToolCalls = decoratedTools.filter((toolCall) => toolCall.blocked);
  const riskyToolCalls = decoratedTools.filter((toolCall) => toolCall.risky);
  const pendingApprovals = decoratedApprovals.filter((approval) => approval.status === 'pending');
  const openPolicies = decoratedPolicies.filter((policy) => policy.status !== 'resolved');
  const workspaces = entities.workspaces.map((workspace) => {
    const workspaceRuns = decoratedRuns.filter((run) => run.workspaceId === workspace.id);
    const workspaceUsage = decoratedUsage.filter((sample) => sample.workspaceId === workspace.id);
    const workspacePolicies = decoratedPolicies.filter((policy) => policy.workspaceId === workspace.id && policy.status !== 'resolved');
    const workspaceApprovals = decoratedApprovals.filter((approval) => approval.workspaceId === workspace.id && approval.status === 'pending');

    return {
      ...workspace,
      runCount: workspaceRuns.length,
      activeRunCount: workspaceRuns.filter((run) => ACTIVE_RUN_STATUSES.has(run.status)).length,
      tokenTotal: sum(workspaceUsage.map((sample) => sample.totalTokens)),
      costTotal: Number(sum(workspaceUsage.map((sample) => sample.costUsd)).toFixed(2)),
      openPolicyCount: workspacePolicies.length,
      openApprovalCount: workspaceApprovals.length
    };
  });

  const sessionTimeline = [
    ...decorateActivity(decoratedTools, 'tool'),
    ...decorateActivity(decoratedApprovals, 'approval'),
    ...decorateActivity(decoratedPolicies, 'policy')
  ].sort((left, right) => {
    const leftTime = left.timestamp || left.requestedAt;
    const rightTime = right.timestamp || right.requestedAt;
    return Date.parse(rightTime || 0) - Date.parse(leftTime || 0);
  });

  return {
    workspaces,
    overview: {
      generatedAt,
      mode,
      metrics: {
        activeRuns: decoratedRuns.filter((run) => ACTIVE_RUN_STATUSES.has(run.status)).length,
        failedRuns: decoratedRuns.filter((run) => run.status === 'failed').length,
        openApprovals: pendingApprovals.length,
        policyFindings: openPolicies.length,
        toolErrorRate: decoratedTools.length ? failedToolCalls.length / decoratedTools.length : 0,
        totalTokens,
        totalCost
      },
      activeRuns: decoratedRuns.filter((run) => ACTIVE_RUN_STATUSES.has(run.status)).slice(0, 5),
      failedRuns: decoratedRuns.filter((run) => run.status === 'failed').slice(0, 5),
      approvals: pendingApprovals.slice(0, 5),
      policyFindings: openPolicies.slice(0, 5),
      recentActivity,
      sourceHealth: {
        items: decoratedSourceHealth,
        healthyCount: decoratedSourceHealth.filter((item) => item.status === 'healthy').length,
        warningCount: decoratedSourceHealth.filter((item) => item.status === 'warning').length,
        errorCount: decoratedSourceHealth.filter((item) => item.status === 'error').length
      }
    },
    runs: {
      items: decoratedRuns
    },
    sessions: {
      items: decoratedSessions,
      timeline: sessionTimeline
    },
    tools: {
      ledger: decoratedTools,
      summary: {
        totalCalls: decoratedTools.length,
        errorCount: failedToolCalls.length,
        blockedCount: blockedToolCalls.length,
        riskyCount: riskyToolCalls.length,
        averageLatencyMs: average(decoratedTools.map((toolCall) => toolCall.latencyMs)),
        byTool: aggregateToolUsageByTool(decoratedTools)
      },
      failures: failedToolCalls,
      riskyActions: decoratedTools.filter((toolCall) => toolCall.risky || toolCall.blocked)
    },
    governance: {
      approvals: decoratedApprovals,
      policyFeed: decoratedPolicies,
      managedConfig: decoratedSourceHealth.filter((item) => item.category === 'config' || item.category === 'security'),
      counts: {
        pendingApprovals: pendingApprovals.length,
        openPolicies: openPolicies.length,
        criticalPolicies: openPolicies.filter((policy) => HIGH_SEVERITIES.has(policy.severity)).length,
        approvedToday: decoratedApprovals.filter((approval) => approval.status === 'approved').length
      }
    },
    usage: {
      samples: decoratedUsage.sort((left, right) => sortByDateDesc(left, right, 'timestamp')).reverse(),
      totals: {
        inputTokens: sum(decoratedUsage.map((sample) => sample.inputTokens)),
        outputTokens: sum(decoratedUsage.map((sample) => sample.outputTokens)),
        totalTokens,
        totalCost
      },
      byModel: aggregateUsageBy(decoratedUsage, 'model'),
      byWorkspace: aggregateUsageBy(decoratedUsage, 'workspaceName')
    }
  };
}
