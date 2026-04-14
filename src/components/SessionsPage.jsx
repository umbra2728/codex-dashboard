import { DataTable } from './DataTable.jsx';
import { formatDateTime, formatRelativeTime, titleCase } from '../utils/formatting.js';

function TonePill({ value }) {
  return <span className={`tone-pill tone-${['failed', 'error', 'blocked'].includes(String(value).toLowerCase()) ? 'danger' : ['pending', 'awaiting_approval', 'waiting'].includes(String(value).toLowerCase()) ? 'warning' : ['running', 'completed', 'active'].includes(String(value).toLowerCase()) ? 'positive' : 'neutral'}`}>{titleCase(value)}</span>;
}

function TimelineItem({ item }) {
  return (
    <li className="timeline-item">
      <div className="timeline-marker" aria-hidden="true" />
      <div className="timeline-body">
        <div className="timeline-row">
          <strong>{item.summary || item.action || item.message}</strong>
          <TonePill value={item.status || item.severity || item.kind} />
        </div>
        <p>{item.workspaceName} · {item.runSummary || item.sessionLabel || item.tool}</p>
        <span>{formatDateTime(item.timestamp || item.requestedAt)}</span>
      </div>
    </li>
  );
}

export function SessionsPage({ sessions, timeline }) {
  const columns = [
    {
      key: 'label',
      header: 'Session',
      render: (session) => (
        <div>
          <strong>{session.label}</strong>
          <p>{session.workspaceName} · {session.runSummary}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (session) => <TonePill value={session.status} />
    },
    { key: 'model', header: 'Model' },
    { key: 'toolCallCount', header: 'Tools' },
    { key: 'pendingApprovalCount', header: 'Approvals' },
    {
      key: 'lastEventAt',
      header: 'Last event',
      render: (session) => formatRelativeTime(session.lastEventAt)
    }
  ];

  return (
    <section className="dashboard-grid dashboard-grid-sessions">
      <article className="panel panel-table">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Sessions</p>
            <h3>Execution sessions and status</h3>
          </div>
          <span className="panel-kicker">{sessions.length} sessions</span>
        </div>
        <DataTable caption="Sessions" columns={columns} rows={sessions} />
      </article>

      <article className="panel panel-tall">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Session timeline</p>
            <h3>Cross-surface event stream</h3>
          </div>
          <span className="panel-kicker">Newest first</span>
        </div>
        <ul className="timeline-list">
          {timeline.map((item, index) => (
            <TimelineItem key={`${item.kind}-${item.id}-${index}`} item={item} />
          ))}
        </ul>
      </article>
    </section>
  );
}
