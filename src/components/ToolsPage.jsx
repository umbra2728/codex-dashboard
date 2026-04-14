import { DataTable } from './DataTable.jsx';
import { formatDurationMs, formatRelativeTime, titleCase } from '../utils/formatting.js';

function TonePill({ value }) {
  return <span className={`tone-pill tone-${['failed', 'error', 'blocked'].includes(String(value).toLowerCase()) ? 'danger' : ['pending', 'warning'].includes(String(value).toLowerCase()) ? 'warning' : ['ok', 'completed', 'healthy'].includes(String(value).toLowerCase()) ? 'positive' : 'neutral'}`}>{titleCase(value)}</span>;
}

export function ToolsPage({ tools }) {
  const columns = [
    {
      key: 'tool',
      header: 'Tool',
      render: (toolCall) => (
        <div>
          <strong>{toolCall.tool}</strong>
          <p>{toolCall.summary}</p>
        </div>
      )
    },
    { key: 'workspaceName', header: 'Workspace' },
    { key: 'runSummary', header: 'Run' },
    {
      key: 'status',
      header: 'Status',
      render: (toolCall) => <TonePill value={toolCall.status} />
    },
    {
      key: 'latencyMs',
      header: 'Latency',
      render: (toolCall) => formatDurationMs(toolCall.latencyMs)
    },
    {
      key: 'timestamp',
      header: 'When',
      render: (toolCall) => formatRelativeTime(toolCall.timestamp)
    }
  ];

  return (
    <div className="page-stack">
      <section className="callout-grid callout-grid-tools">
        <div className="callout-card">
          <span>Total calls</span>
          <strong>{tools.summary.totalCalls}</strong>
        </div>
        <div className="callout-card">
          <span>Average latency</span>
          <strong>{formatDurationMs(tools.summary.averageLatencyMs)}</strong>
        </div>
        <div className="callout-card">
          <span>Blocked actions</span>
          <strong>{tools.summary.blockedCount}</strong>
        </div>
        <div className="callout-card">
          <span>Risky actions</span>
          <strong>{tools.summary.riskyCount}</strong>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-tools">
        <article className="panel panel-table">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Tool ledger</p>
              <h3>Executed tool calls</h3>
            </div>
            <span className="panel-kicker">{tools.ledger.length} entries</span>
          </div>
          <DataTable caption="Tools" columns={columns} rows={tools.ledger} />
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Tool distribution</p>
              <h3>Volume by tool</h3>
            </div>
            <span className="panel-kicker">Top tools</span>
          </div>
          <div className="stack-list">
            {tools.summary.byTool.map((entry) => (
              <div key={entry.tool} className="list-row-card">
                <div>
                  <strong>{entry.tool}</strong>
                  <p>{entry.count} calls · {entry.errors} errors · {entry.blocked} blocked</p>
                </div>
                <div className="list-row-meta">
                  <span>{formatDurationMs(entry.averageLatencyMs)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Exceptions</p>
              <h3>Failures and risky actions</h3>
            </div>
            <span className="panel-kicker">Needs review</span>
          </div>
          <div className="stack-list">
            {[...tools.failures, ...tools.riskyActions].slice(0, 10).map((item) => (
              <div key={item.id} className="list-row-card">
                <div>
                  <strong>{item.summary}</strong>
                  <p>{item.tool} · {item.workspaceName}</p>
                </div>
                <div className="list-row-meta">
                  <TonePill value={item.status} />
                  <span>{formatRelativeTime(item.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
