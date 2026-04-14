import { formatCompactNumber, formatCurrency, formatPercent } from '../utils/formatting.js';

const METRIC_CONFIG = [
  {
    key: 'activeRuns',
    label: 'Active runs',
    format: formatCompactNumber,
    note: 'running now'
  },
  {
    key: 'failedRuns',
    label: 'Failed runs',
    format: formatCompactNumber,
    note: 'needs attention'
  },
  {
    key: 'openApprovals',
    label: 'Open approvals',
    format: formatCompactNumber,
    note: 'manual gates'
  },
  {
    key: 'policyFindings',
    label: 'Policy findings',
    format: formatCompactNumber,
    note: 'open findings'
  },
  {
    key: 'toolErrorRate',
    label: 'Tool error rate',
    format: formatPercent,
    note: 'across ledger'
  },
  {
    key: 'totalCost',
    label: 'Estimated cost',
    format: formatCurrency,
    note: 'selected range'
  }
];

export function StatsStrip({ metrics }) {
  return (
    <section className="stats-strip" aria-label="Overview metrics">
      {METRIC_CONFIG.map((metric) => (
        <article key={metric.key} className="metric-card">
          <p className="metric-label">{metric.label}</p>
          <p className="metric-value">{metric.format(metrics?.[metric.key] ?? 0)}</p>
          <p className="metric-note">{metric.note}</p>
        </article>
      ))}
    </section>
  );
}
