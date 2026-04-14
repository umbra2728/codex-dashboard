import { formatRelativeTime, statusTone, titleCase } from '../utils/formatting.js';

export function ConnectionStatus({ connectionStatus, mode, generatedAt }) {
  const tone = statusTone(connectionStatus);
  const snapshotLabel = generatedAt ? formatRelativeTime(generatedAt) : 'Awaiting snapshot';

  return (
    <div className={`status-cluster tone-${tone}`}>
      <div className="status-cluster-topline">
        <span className="status-dot" aria-hidden="true" />
        <span>{titleCase(connectionStatus)}</span>
      </div>
      <div className="status-cluster-meta">
        <span>{titleCase(mode)} source</span>
        <span>{snapshotLabel}</span>
      </div>
    </div>
  );
}
