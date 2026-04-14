import { useMemo } from 'react';
import { DataTable } from './DataTable.jsx';
import { EmptyState } from './EmptyState.jsx';
import { formatCompactNumber, formatCurrency, formatDateTime, formatRelativeTime, titleCase } from '../utils/formatting.js';

function TonePill({ value }) {
  return <span className={`tone-pill tone-${['failed', 'error', 'blocked'].includes(String(value).toLowerCase()) ? 'danger' : ['pending', 'awaiting_approval'].includes(String(value).toLowerCase()) ? 'warning' : ['running', 'completed', 'active'].includes(String(value).toLowerCase()) ? 'positive' : 'neutral'}`}>{titleCase(value)}</span>;
}

export function RunsPage({ runs, selectedRunId, onSelectRun }) {
  const selectedRun = useMemo(() => runs.find((run) => run.id === selectedRunId) || runs[0] || null, [runs, selectedRunId]);

  const columns = [
    {
      key: 'summary',
      header: 'Run',
      render: (run) => (
        <div className="content-stack">
          <strong className="truncate-2">{run.summary}</strong>
          <p className="truncate">{run.workspaceName} · {run.actor}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (run) => <TonePill value={run.status} />
    },
    {
      key: 'model',
      header: 'Model',
      cellClassName: 'cell-truncate'
    },
    {
      key: 'pendingApprovalCount',
      header: 'Approvals',
      render: (run) => formatCompactNumber(run.pendingApprovalCount)
    },
    {
      key: 'totalCost',
      header: 'Cost',
      render: (run) => formatCurrency(run.totalCost)
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (run) => formatRelativeTime(run.updatedAt)
    }
  ];

  return (
    <section className="dashboard-grid dashboard-grid-runs">
      <article className="panel panel-table">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Run inventory</p>
            <h3>Execution runs across workspaces</h3>
          </div>
          <span className="panel-kicker">{runs.length} visible</span>
        </div>
        <DataTable
          caption="Runs"
          columns={columns}
          rows={runs}
          onRowClick={(row) => onSelectRun(row.id)}
          selectedId={selectedRun?.id}
          emptyTitle="No runs in the current scope."
          emptyBody="Try changing the workspace filter or switch back to mock mode."
        />
      </article>

      <article className="panel detail-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Selected run</p>
            <h3 className="truncate-2">{selectedRun ? selectedRun.summary : 'No run selected'}</h3>
          </div>
          {selectedRun ? <TonePill value={selectedRun.status} /> : null}
        </div>

        {selectedRun ? (
          <div className="detail-stack">
            <div className="detail-grid">
              <div>
                <span className="detail-label">Workspace</span>
                <strong className="wrap-anywhere">{selectedRun.workspaceName}</strong>
              </div>
              <div>
                <span className="detail-label">Actor</span>
                <strong className="wrap-anywhere">{selectedRun.actor}</strong>
              </div>
              <div>
                <span className="detail-label">Model</span>
                <strong className="wrap-anywhere">{selectedRun.model}</strong>
              </div>
              <div>
                <span className="detail-label">Branch</span>
                <strong className="wrap-anywhere">{selectedRun.branch}</strong>
              </div>
              <div>
                <span className="detail-label">Started</span>
                <strong>{formatDateTime(selectedRun.startedAt)}</strong>
              </div>
              <div>
                <span className="detail-label">Updated</span>
                <strong>{formatDateTime(selectedRun.updatedAt)}</strong>
              </div>
            </div>

            <div className="callout-grid">
              <div className="callout-card">
                <span>Sessions</span>
                <strong>{formatCompactNumber(selectedRun.sessionCount)}</strong>
              </div>
              <div className="callout-card">
                <span>Tool calls</span>
                <strong>{formatCompactNumber(selectedRun.toolCallCount)}</strong>
              </div>
              <div className="callout-card">
                <span>Pending approvals</span>
                <strong>{formatCompactNumber(selectedRun.pendingApprovalCount)}</strong>
              </div>
              <div className="callout-card">
                <span>Open policies</span>
                <strong>{formatCompactNumber(selectedRun.openPolicyCount)}</strong>
              </div>
              <div className="callout-card">
                <span>Total tokens</span>
                <strong>{formatCompactNumber(selectedRun.totalTokens)}</strong>
              </div>
              <div className="callout-card">
                <span>Estimated cost</span>
                <strong>{formatCurrency(selectedRun.totalCost)}</strong>
              </div>
            </div>

            <div className="subpanel">
              <div className="subpanel-header">
                <h4>Attached sessions</h4>
                <span>{selectedRun.sessions?.length || 0} sessions</span>
              </div>
              {selectedRun.sessions?.length ? (
                <ul className="chip-list">
                  {selectedRun.sessions.map((session) => (
                    <li key={session.id} className="chip-card">
                      <strong className="truncate">{session.label}</strong>
                      <span className="truncate">{session.model} · {titleCase(session.status)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState eyebrow="Sessions" title="No sessions are attached to this run." body="Newly ingested runs will populate here automatically." />
              )}
            </div>
          </div>
        ) : (
          <EmptyState eyebrow="Run detail" title="Select a run to inspect it." body="The detail drawer tracks sessions, tool volume, and approval pressure." />
        )}
      </article>
    </section>
  );
}
