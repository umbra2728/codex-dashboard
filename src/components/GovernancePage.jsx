import { DataTable } from './DataTable.jsx';
import { formatDateTime, formatRelativeTime, titleCase } from '../utils/formatting.js';

function TonePill({ value }) {
  return <span className={`tone-pill tone-${['critical', 'failed', 'error', 'blocked'].includes(String(value).toLowerCase()) ? 'danger' : ['high', 'pending', 'warning'].includes(String(value).toLowerCase()) ? 'warning' : ['approved', 'healthy', 'resolved'].includes(String(value).toLowerCase()) ? 'positive' : 'neutral'}`}>{titleCase(value)}</span>;
}

export function GovernancePage({ governance }) {
  const approvalColumns = [
    {
      key: 'action',
      header: 'Approval request',
      render: (approval) => (
        <div>
          <strong>{approval.action}</strong>
          <p>{approval.workspaceName} · {approval.runSummary}</p>
        </div>
      )
    },
    {
      key: 'risk',
      header: 'Risk',
      render: (approval) => <TonePill value={approval.risk} />
    },
    {
      key: 'status',
      header: 'Status',
      render: (approval) => <TonePill value={approval.status} />
    },
    {
      key: 'requestedAt',
      header: 'Requested',
      render: (approval) => formatDateTime(approval.requestedAt)
    }
  ];

  return (
    <div className="page-stack">
      <section className="callout-grid">
        <div className="callout-card">
          <span>Pending approvals</span>
          <strong>{governance.counts.pendingApprovals}</strong>
        </div>
        <div className="callout-card">
          <span>Open policies</span>
          <strong>{governance.counts.openPolicies}</strong>
        </div>
        <div className="callout-card">
          <span>Critical findings</span>
          <strong>{governance.counts.criticalPolicies}</strong>
        </div>
        <div className="callout-card">
          <span>Approved today</span>
          <strong>{governance.counts.approvedToday}</strong>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-governance">
        <article className="panel panel-table">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Approvals</p>
              <h3>Read-only approval queue</h3>
            </div>
            <span className="panel-kicker">No write-back in v1</span>
          </div>
          <DataTable caption="Approvals" columns={approvalColumns} rows={governance.approvals} />
        </article>

        <article className="panel panel-tall">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Policy feed</p>
              <h3>Compliance and safety findings</h3>
            </div>
            <span className="panel-kicker">Newest first</span>
          </div>
          <div className="stack-list">
            {governance.policyFeed.map((event) => (
              <div key={event.id} className="list-row-card">
                <div>
                  <strong>{event.message}</strong>
                  <p>{event.policy} · {event.workspaceName}</p>
                </div>
                <div className="list-row-meta">
                  <TonePill value={event.severity} />
                  <span>{formatRelativeTime(event.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel panel-wide">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Managed config</p>
              <h3>Adapter and policy configuration status</h3>
            </div>
            <span className="panel-kicker">Guardrails visible</span>
          </div>
          <div className="stack-list">
            {governance.managedConfig.map((item) => (
              <div key={item.id} className="list-row-card">
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.detail}</p>
                </div>
                <div className="list-row-meta">
                  <TonePill value={item.status} />
                  <span>{formatDateTime(item.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
