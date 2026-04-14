import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config as defaultConfig } from '../config.js';
import { createAuthService } from './auth.js';
import { createApiRouter } from './routes/api.js';
import { createMockSource } from './sources/mockSource.js';
import { createFileSource } from './sources/fileSource.js';
import { createDashboardStore } from './store.js';
import { createDashboardWebSocketServer } from './ws.js';

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function createCorsOptions(runtimeConfig) {
  return {
    origin(origin, callback) {
      if (!origin || runtimeConfig.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed.'));
    }
  };
}

function createJsonContentGuard() {
  return (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method) || !req.path.startsWith('/api')) {
      next();
      return;
    }

    if (!req.is('application/json')) {
      res.status(415).json({ error: 'API requests must use application/json.' });
      return;
    }

    next();
  };
}

function createPermissionsPolicyHeader() {
  return (_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  };
}

function createApiLogger() {
  return (req, res, next) => {
    const startedAt = performance.now();
    res.on('finish', () => {
      if (!req.path.startsWith('/api')) {
        return;
      }

      const durationMs = Math.round(performance.now() - startedAt);
      console.info(`${req.method} ${req.path} -> ${res.statusCode} (${durationMs}ms)`);
    });
    next();
  };
}

export async function createDashboardServer(runtimeConfig = defaultConfig) {
  const app = express();
  const server = http.createServer(app);
  const store = createDashboardStore({ mode: runtimeConfig.mode });
  const auth = createAuthService({
    authFile: runtimeConfig.paths.authFile,
    minimumPasswordLength: runtimeConfig.security.minimumPasswordLength,
    sessionTtlMs: runtimeConfig.security.sessionTtlMs
  });
  const source = runtimeConfig.mode === 'file'
    ? createFileSource({ dataDir: runtimeConfig.paths.dataDir, watch: runtimeConfig.watch })
    : createMockSource();
  const ws = createDashboardWebSocketServer({ server, store, auth, config: runtimeConfig });
  const authLimiter = rateLimit({
    ...runtimeConfig.authRateLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false
  });

  app.disable('x-powered-by');
  app.use(compression());
  app.use(cors(createCorsOptions(runtimeConfig)));
  app.use(helmet(runtimeConfig.security.helmet));
  app.use(createPermissionsPolicyHeader());
  app.use(rateLimit({
    ...runtimeConfig.rateLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false
  }));
  app.use(express.json({ limit: runtimeConfig.security.jsonLimit }));
  app.use(createJsonContentGuard());
  app.use(createApiLogger());
  app.use('/api', createApiRouter({ auth, authLimiter, store }));

  const distIndexPath = path.resolve(runtimeConfig.paths.distDir, 'index.html');
  if (await fileExists(distIndexPath)) {
    app.use(express.static(runtimeConfig.paths.distDir));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(distIndexPath);
    });
  } else {
    app.get('/', (_req, res) => {
      res.status(503).send('Frontend build not found. Run `npm run dev` for local development or `npm run build` before `npm run start`.');
    });
  }

  app.use((error, _req, res, _next) => {
    const message = error.message || 'Unexpected server error.';
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: message });
  });

  await source.start((update) => {
    store.hydrate(update.data, {
      changed: update.changed,
      reason: update.reason
    });
  });

  return {
    app,
    server,
    store,
    auth,
    config: runtimeConfig,
    async start() {
      await new Promise((resolve) => {
        server.listen(runtimeConfig.server.port, runtimeConfig.server.host, resolve);
      });

      console.info(`Codex dashboard listening on http://${runtimeConfig.server.host}:${runtimeConfig.server.port}`);
      console.info(`Mode: ${runtimeConfig.mode}`);
    },
    async close() {
      auth.stop();
      await source.stop();
      await ws.close();
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  };
}
