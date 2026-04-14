import { WebSocketServer } from 'ws';

function rejectSocket(socket, statusCode, message) {
  socket.write(`HTTP/1.1 ${statusCode} ${message}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function getRequestToken(requestUrl, request) {
  return requestUrl.searchParams.get('token') || request.headers.authorization?.replace(/^Bearer\s+/i, '') || null;
}

function serializeInitialData(store) {
  return JSON.stringify({
    type: 'initial_data',
    data: store.getBootstrapPayload()
  });
}

function serializeDelta(update) {
  return JSON.stringify({
    type: 'dashboard_delta',
    data: update
  });
}

export function createDashboardWebSocketServer({ server, store, auth, config }) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: config.ws.maxPayload });
  const clients = new Set();

  const upgradeHandler = (request, socket, head) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    if (requestUrl.pathname !== config.ws.path) {
      return;
    }

    const origin = request.headers.origin;
    if (origin && !config.corsOrigins.includes(origin)) {
      rejectSocket(socket, 403, 'Forbidden');
      return;
    }

    const token = getRequestToken(requestUrl, request);
    if (!auth.verifyToken(token)) {
      rejectSocket(socket, 401, 'Unauthorized');
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.isAlive = true;
      wss.emit('connection', ws, request);
    });
  };

  server.on('upgrade', upgradeHandler);

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(serializeInitialData(store));

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', () => {
      // The dashboard is read-only in v1.
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  const unsubscribe = store.subscribe((update) => {
    const payload = serializeDelta(update);
    for (const client of clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  });

  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (client.isAlive === false) {
        client.terminate();
        clients.delete(client);
        continue;
      }

      client.isAlive = false;
      client.ping();
    }
  }, config.ws.heartbeatMs);

  heartbeat.unref?.();

  return {
    async close() {
      clearInterval(heartbeat);
      unsubscribe();
      server.off('upgrade', upgradeHandler);

      for (const client of clients) {
        client.close();
      }

      await new Promise((resolve) => wss.close(resolve));
    }
  };
}
