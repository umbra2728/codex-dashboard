import { DataTable } from './DataTable.jsx';
import { EmptyState } from './EmptyState.jsx';
import { formatCompactNumber, formatCurrency, formatDateTime } from '../utils/formatting.js';

function UsageBars({ items, metricKey, formatter }) {
  const maxValue = Math.max(...items.map((item) => item[metricKey]), 1);

  return (
    <div className="usage-bar-list">
      {items.map((item) => (
        <div key={item.id || item.label} className="usage-bar-row">
          <div className="usage-bar-copy">
            <strong className="truncate">{item.label}</strong>
            <span>{formatter(item[metricKey])}</span>
          </div>
          <div className="usage-bar-track">
            <span className="usage-bar-fill" style={{ width: `${(item[metricKey] / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UsagePage({ usage }) {
  const sampleColumns = [
    {
      key: 'workspaceName',
      header: 'Workspace',
      render: (sample) => (
        <div className="content-stack">
          <strong className="truncate">{sample.workspaceName}</strong>
          <p className="truncate">{sample.runSummary}</p>
        </div>
      )
    },
    {
      key: 'model',
      header: 'Model',
      cellClassName: 'cell-truncate'
    },
    {
      key: 'totalTokens',
      header: 'Tokens',
      render: (sample) => formatCompactNumber(sample.totalTokens)
    },
    {
      key: 'costUsd',
      header: 'Cost',
      render: (sample) => formatCurrency(sample.costUsd)
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (sample) => formatDateTime(sample.timestamp)
    }
  ];

  return (
    <div className="page-stack">
      <section className="callout-grid">
        <div className="callout-card">
          <span>Input tokens</span>
          <strong>{formatCompactNumber(usage.totals.inputTokens)}</strong>
        </div>
        <div className="callout-card">
          <span>Output tokens</span>
          <strong>{formatCompactNumber(usage.totals.outputTokens)}</strong>
        </div>
        <div className="callout-card">
          <span>Total tokens</span>
          <strong>{formatCompactNumber(usage.totals.totalTokens)}</strong>
        </div>
        <div className="callout-card">
          <span>Estimated cost</span>
          <strong>{formatCurrency(usage.totals.totalCost)}</strong>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-usage">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">By model</p>
              <h3>Token concentration</h3>
            </div>
            <span className="panel-kicker">Model mix</span>
          </div>
          {usage.byModel.length ? (
            <UsageBars items={usage.byModel} metricKey="totalTokens" formatter={formatCompactNumber} />
          ) : (
            <EmptyState eyebrow="Models" title="No model usage in this slice." body="Usage bars will appear here as soon as token samples are available." />
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">By workspace</p>
              <h3>Cost concentration</h3>
            </div>
            <span className="panel-kicker">Workspace mix</span>
          </div>
          {usage.byWorkspace.length ? (
            <UsageBars items={usage.byWorkspace} metricKey="costUsd" formatter={formatCurrency} />
          ) : (
            <EmptyState eyebrow="Workspaces" title="No workspace cost data in this slice." body="Spend bars will appear here after the first usage samples arrive." />
          )}
        </article>

        <article className="panel panel-wide panel-table">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Usage samples</p>
              <h3>Token and cost events</h3>
            </div>
            <span className="panel-kicker">Chronological ledger</span>
          </div>
          <DataTable caption="Usage" columns={sampleColumns} rows={usage.samples} />
        </article>
      </section>
    </div>
  );
}
