import { AUTH_TOKEN_KEY } from '../config/constants.js';

export function getAuthToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getWebSocketUrl(token) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = new URL('/ws', `${protocol}//${window.location.host}`);
  if (token) {
    url.searchParams.set('token', token);
  }
  return url.toString();
}

function normalizeBody(body) {
  if (body === undefined || body === null || typeof body === 'string' || body instanceof FormData) {
    return body;
  }

  return JSON.stringify(body);
}

export async function apiFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    body: normalizeBody(options.body)
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return response;
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
