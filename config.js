import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SERVER_PORT = 3001;
const DEFAULT_CLIENT_PORT = 5173;
const LOCAL_HOSTS = ['localhost', '127.0.0.1'];
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

function resolvePathFromRoot(candidatePath, fallbackPath = '.') {
  if (!candidatePath) {
    return path.resolve(ROOT_DIR, fallbackPath);
  }

  if (path.isAbsolute(candidatePath)) {
    return candidatePath;
  }

  return path.resolve(ROOT_DIR, candidatePath);
}

function createLocalOrigins(protocol, port) {
  const origins = [];

  for (const host of LOCAL_HOSTS) {
    origins.push(`${protocol}://${host}:${port}`);
  }

  return origins;
}

function createAllowedOrigins(serverPort, clientPort) {
  return [
    ...createLocalOrigins('http', serverPort),
    ...createLocalOrigins('http', clientPort)
  ];
}

function createConnectSources(serverPort, clientPort) {
  return [
    "'self'",
    ...createLocalOrigins('ws', serverPort),
    ...createLocalOrigins('http', serverPort),
    ...createLocalOrigins('http', clientPort),
    ...createLocalOrigins('ws', clientPort)
  ];
}

export function createConfig() {
  const serverPort = Number(process.env.CODEX_DASHBOARD_PORT || DEFAULT_SERVER_PORT);
  const clientPort = Number(process.env.CODEX_DASHBOARD_CLIENT_PORT || DEFAULT_CLIENT_PORT);
  const mode = process.env.CODEX_DASHBOARD_MODE === 'file' ? 'file' : 'mock';

  return {
    env: process.env.NODE_ENV || 'development',
    mode,
    rootDir: ROOT_DIR,
    paths: {
      rootDir: ROOT_DIR,
      distDir: path.resolve(ROOT_DIR, 'dist'),
      dataDir: resolvePathFromRoot(process.env.CODEX_DASHBOARD_DATA_DIR, './data')
    },
    server: {
      host: process.env.CODEX_DASHBOARD_HOST || '127.0.0.1',
      port: serverPort,
      clientPort
    },
    corsOrigins: createAllowedOrigins(serverPort, clientPort),
    rateLimit: {
      windowMs: FIFTEEN_MINUTES_MS,
      max: 240,
      message: 'Too many requests from this client. Please slow down.'
    },
    watch: {
      persistent: true,
      ignoreInitial: false,
      followSymlinks: false,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      },
      depth: 1
    },
    security: {
      jsonLimit: '10kb',
      helmet: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            connectSrc: createConnectSources(serverPort, clientPort),
            imgSrc: ["'self'", 'data:'],
            fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
          }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: { policy: 'same-origin' },
        crossOriginResourcePolicy: { policy: 'same-origin' },
        referrerPolicy: { policy: 'same-origin' },
        frameguard: { action: 'deny' },
        noSniff: true
      }
    },
    ws: {
      path: '/ws',
      heartbeatMs: 15_000,
      maxPayload: 64 * 1024
    }
  };
}

export const config = createConfig();
