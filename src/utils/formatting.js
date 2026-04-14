const numberFormatter = new Intl.NumberFormat('en-US');
const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatNumber(value) {
  return numberFormatter.format(Number(value || 0));
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number(value || 0));
}

export function formatCurrency(value) {
  return moneyFormatter.format(Number(value || 0));
}

export function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

export function formatDurationMs(value) {
  const amount = Number(value || 0);
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}s`;
  }
  return `${Math.round(amount)}ms`;
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export function formatRelativeTime(value) {
  if (!value) {
    return '—';
  }

  const diffMs = Date.now() - Date.parse(value);
  const diffMinutes = Math.round(diffMs / 60_000);
  if (Math.abs(diffMinutes) < 1) {
    return 'just now';
  }
  if (Math.abs(diffMinutes) < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function titleCase(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function statusTone(status = '') {
  const normalized = String(status).toLowerCase();
  if (['running', 'active', 'healthy', 'completed', 'approved'].includes(normalized)) {
    return 'positive';
  }
  if (['warning', 'awaiting_approval', 'pending', 'waiting'].includes(normalized)) {
    return 'warning';
  }
  if (['failed', 'error', 'blocked', 'critical'].includes(normalized)) {
    return 'danger';
  }
  return 'neutral';
}
