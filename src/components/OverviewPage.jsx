import { StatsStrip } from './StatsStrip.jsx';
import { EmptyState } from './EmptyState.jsx';
import { formatCompactNumber, formatCurrency, formatPercent, formatRelativeTime, titleCase } from '../utils/formatting.js';

function TonePill({ value }) {
  const normalized = String(value || '').toLowerCase();
  const tone = ['healthy', 'approved', 'completed', 'active', 'running'].includes(normalized)
    ? 'positive'
    : ['warning', 'pending', 'awaiting_approval'].includes(normalized)
      ? 'warning'
      : ['blocked', 'failed', 'error', 'critical'].includes(normalized)
        ? 'danger'
        : 'neutral';

  return <span className={`tone-pill tone-${tone}`}>{titleCase(value)}</span>;
}

function ActivityItem({ item }) {
  const title = item.kind === 'tool' ? item.summary : item.action || item.message;
  const meta = item.kind === 'tool'
    ? `${item.tool} · ${item.workspaceName}`
    : `${item.workspaceName} · ${item.runSummary}`;

  return (
    <li className="activity-item">
      <div className="content-stack">
        <p className="activity-title truncate-2">{title}</p>
        <p className="activity-meta truncate">{meta}</p>
      </div>
      <div className="activity-side">
        <TonePill value={item.status || item.severity || item.kind} />
        <span>{formatRelativeTime(item.timestamp || item.requestedAt)}</span>
      </div>
    </li>
  );
}

function SourceHealthItem({ item }) {
  return (
    <li className="source-item">
      <div className="content-stack">
        <p className="truncate">{item.label}</p>
        <span className="truncate-2">{item.detail}</span>
      </div>
      <div className="source-item-side">
        <TonePill value={item.status} />
        <small>{formatRelativeTime(item.updatedAt)}</small>
      </div>
    </li>
  );
}

export function OverviewPage({ overview, onSelectRun }) {
  const metrics = overview.metrics;
  const activeRuns = overview.activeRuns || [];

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="content-stack">
          <p className="eyebrow">Overview</p>
          <h2>Track live execution, governance pressure, and cost from one local workspace.</h2>
          <p className="hero-copy">
            The dashboard stays read-only, localhost-only, and streams a shared snapshot plus deltas from mock or file-backed sources.
          </p>
        </div>
        <div className="hero-metrics-grid">
          <div className="hero-metric-card">
            <span>Total tokens</span>
            <strong>{formatCompactNumber(metrics.totalTokens)}</strong>
            <small>Across the selected slice</small>
          </div>
          <div className="hero-metric-card">
            <span>Estimated cost</span>
            <strong>{formatCurrency(metrics.totalCost)}</strong>
            <small>Local aggregate estimate</small>
          </div>
          <div className="hero-metric-card">
            <span>Tool error rate</span>
            <strong>{formatPercent(metrics.toolErrorRate)}</strong>
            <small>Across current tool volume</small>
          </div>
        </div>
      </section>

      <StatsStrip metrics={metrics} />

      <section className="dashboard-grid dashboard-grid-overview">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Live runs</p>
              <h3>Active execution lanes</h3>
            </div>
            <span className="panel-kicker">{activeRuns.length} active</span>
          </div>
          {activeRuns.length ? (
            <div className="stack-list">
              {activeRuns.map((run) => (
                <button type="button" key={run.id} className="list-row-button" onClick={() => onSelectRun(run.id)}>
                  <div className="content-stack">
                    <strong className="truncate-2">{run.summary}</strong>
                    <p className="truncate">{run.workspaceName} · {run.actor} · {run.model}</p>
                  </div>
                  <div className="list-row-meta">
                    <TonePill value={run.status} />
                    <span>{run.pendingApprovalCount} approvals</span>
                    <span>{formatCompactNumber(run.totalTokens)} tok</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState eyebrow="Runs" title="No active runs in scope." body="Switch workspace filters or wait for a new snapshot." />
          )}
        </article>

        <article className="panel panel-tall">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h3>Latest tool, approval, and policy events</h3>
            </div>
            <span className="panel-kicker">Updated {formatRelativeTime(overview.generatedAt)}</span>
          </div>
          {overview.recentActivity?.length ? (
            <ul className="activity-feed">
              {overview.recentActivity.map((item) => (
                <ActivityItem key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </ul>
          ) : (
            <EmptyState eyebrow="Activity" title="No recent events yet." body="Tool calls, approvals, and policy findings will appear here." />
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Governance</p>
              <h3>Pending approvals</h3>
            </div>
            <span className="panel-kicker">{overview.approvals?.length || 0} open</span>
          </div>
          {overview.approvals?.length ? (
            <div className="stack-list">
              {overview.approvals.map((approval) => (
                <div key={approval.id} className="list-row-card">
                  <div className="content-stack">
                    <strong className="truncate-2">{approval.action}</strong>
                    <p className="truncate">{approval.workspaceName} · {approval.runSummary}</p>
                  </div>
                  <div className="list-row-meta">
                    <TonePill value={approval.risk} />
                    <span>{formatRelativeTime(approval.requestedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState eyebrow="Approvals" title="Nothing is waiting for review." body="Read-only governance signals appear here." />
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Policy surface</p>
              <h3>Open findings</h3>
            </div>
            <span className="panel-kicker">{overview.policyFindings?.length || 0} findings</span>
          </div>
          {overview.policyFindings?.length ? (
            <div className="stack-list">
              {overview.policyFindings.map((policy) => (
                <div key={policy.id} className="list-row-card">
                  <div className="content-stack">
                    <strong className="truncate-2">{policy.message}</strong>
                    <p className="truncate">{policy.policy} · {policy.workspaceName}</p>
                  </div>
                  <div className="list-row-meta">
                    <TonePill value={policy.severity} />
                    <span>{formatRelativeTime(policy.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState eyebrow="Policy" title="No open policy findings." body="The dashboard will surface rule hits here as they arrive." />
          )}
        </article>

        <article className="panel panel-wide">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Source health</p>
              <h3>Adapter and config integrity</h3>
            </div>
            <span className="panel-kicker">{overview.sourceHealth?.healthyCount || 0} healthy</span>
          </div>
          {overview.sourceHealth?.items?.length ? (
            <ul className="source-health-list">
              {overview.sourceHealth.items.map((item) => (
                <SourceHealthItem key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <EmptyState eyebrow="Sources" title="No health signals received." body="Mock/file adapters and managed config status land here." />
          )}
        </article>
      </section>
    </div>
  );
}
