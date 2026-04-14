import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createEmptyViews, REST_POLL_INTERVAL_MS, WS_STALE_THRESHOLD_MS } from '../config/constants.js';
import { requestJson } from '../utils/api.js';

const INITIAL_META = {
  revision: 0,
  generatedAt: null,
  mode: 'mock'
};

function applyIncomingPayload(payload, setViews, setMeta) {
  if (!payload) {
    return;
  }

  if (payload.views) {
    setViews(payload.views);
  }

  if (payload.meta) {
    setMeta((current) => ({ ...current, ...payload.meta }));
    return;
  }

  setMeta((current) => ({
    ...current,
    revision: payload.revision ?? current.revision,
    generatedAt: payload.generatedAt ?? current.generatedAt,
    mode: payload.mode ?? current.mode
  }));
}

export function useWebSocket(url, { enabled = false, initialPayload = null } = {}) {
  const [views, setViews] = useState(() => initialPayload?.views || createEmptyViews());
  const [meta, setMeta] = useState(() => initialPayload?.meta || {
    revision: initialPayload?.revision || 0,
    generatedAt: initialPayload?.generatedAt || null,
    mode: initialPayload?.mode || 'mock'
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(enabled ? 'connecting' : 'idle');
  const [lastRawMessage, setLastRawMessage] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const pausedRef = useRef(false);
  const previousUrlRef = useRef(url);
  const lastDataReceivedRef = useRef(initialPayload ? Date.now() : 0);

  useEffect(() => {
    if (!initialPayload) {
      return;
    }

    applyIncomingPayload(initialPayload, setViews, setMeta);
    lastDataReceivedRef.current = Date.now();
  }, [initialPayload]);

  const connect = useCallback(() => {
    if (!enabled || pausedRef.current || !url) {
      return;
    }

    try {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      setConnectionStatus(reconnectAttempts.current > 0 ? 'reconnecting' : 'connecting');
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastRawMessage(message);
          lastDataReceivedRef.current = Date.now();

          if (message.type === 'initial_data') {
            applyIncomingPayload(message.data, setViews, setMeta);
            return;
          }

          if (message.type === 'dashboard_delta') {
            applyIncomingPayload(message.data, setViews, setMeta);
            return;
          }
        } catch (parseError) {
          console.error('Failed to parse dashboard websocket payload.', parseError);
        }
      };

      ws.onerror = () => {
        setError('Connection error');
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        if (!enabled) {
          setConnectionStatus('idle');
          return;
        }

        if (!navigator.onLine) {
          pausedRef.current = true;
          setConnectionStatus('offline');
          return;
        }

        setConnectionStatus('reconnecting');
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30_000);
        reconnectAttempts.current += 1;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (connectionError) {
      setError('Failed to connect');
      setConnectionStatus('error');
    }
  }, [enabled, url]);

  useEffect(() => {
    if (!enabled) {
      setConnectionStatus('idle');
      setIsConnected(false);
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    connect();

    const handleOnline = () => {
      pausedRef.current = false;
      reconnectAttempts.current = 0;
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      connect();
    };

    const handleOffline = () => {
      pausedRef.current = true;
      setConnectionStatus('offline');
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, enabled]);

  useEffect(() => {
    if (previousUrlRef.current === url) {
      return;
    }

    previousUrlRef.current = url;
    reconnectAttempts.current = 0;
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (enabled) {
      connect();
    }
  }, [connect, enabled, url]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      const wsIsStale = Date.now() - lastDataReceivedRef.current > WS_STALE_THRESHOLD_MS;
      const wsDown = !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN;
      if (!wsIsStale && !wsDown) {
        return;
      }

      try {
        const data = await requestJson('/api/dashboard');
        applyIncomingPayload(data, setViews, setMeta);
        lastDataReceivedRef.current = Date.now();
      } catch {
        // Let the socket retry naturally.
      }
    }, REST_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled]);

  return useMemo(() => ({
    views,
    meta: meta || INITIAL_META,
    isConnected,
    error,
    lastRawMessage,
    connectionStatus,
    reconnectAttempts: reconnectAttempts.current
  }), [views, meta, isConnected, error, lastRawMessage, connectionStatus]);
}
