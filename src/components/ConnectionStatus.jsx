import { formatRelativeTime, statusTone, titleCase } from '../utils/formatting.js';

export function ConnectionStatus({ connectionStatus, mode, generatedAt, authLabel }) {
  const tone = statusTone(connectionStatus);

  return (
    <div className={`status-cluster tone-${tone}`}>
      <div className="status-cluster-topline">
        <span className="status-dot" aria-hidden="true" />
        <span>{titleCase(connectionStatus)}</span>
      </div>
      <div className="status-cluster-meta">
        <span>{titleCase(mode)} source</span>
        <span>{formatRelativeTime(generatedAt)}</span>
        <span>{authLabel}</span>
      </div>
    </div>
  );
}
