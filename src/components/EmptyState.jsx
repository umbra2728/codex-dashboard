export function EmptyState({ eyebrow = 'No data', title, body, action }) {
  return (
    <div className="empty-state">
      <p className="eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
