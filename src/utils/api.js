export function getWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return new URL('/ws', `${protocol}//${window.location.host}`).toString();
}

function normalizeBody(body) {
  if (body === undefined || body === null || typeof body === 'string' || body instanceof FormData) {
    return body;
  }

  return JSON.stringify(body);
}

export async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    },
    body: normalizeBody(options.body)
  });
}

export async function requestJson(url, options = {}) {
  const response = await apiFetch(url, options);
  const data = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    const message = data?.error || 'Request failed.';
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  return data;
}
