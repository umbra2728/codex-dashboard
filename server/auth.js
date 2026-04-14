import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

async function readPasswordRecord(authFile) {
  try {
    const content = await fs.readFile(authFile, 'utf8');
    const [salt, hash] = content.trim().split(':');
    if (!salt || !hash) {
      return null;
    }

    return { salt, hash };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function writePasswordRecord(authFile, record) {
  await fs.mkdir(path.dirname(authFile), { recursive: true });
  await fs.writeFile(authFile, `${record.salt}:${record.hash}\n`, { mode: 0o600 });

  if (process.platform !== 'win32') {
    await fs.chmod(authFile, 0o600);
  }
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt)).toString('hex');
  return { salt, hash };
}

async function verifyPassword(password, record) {
  if (!record?.salt || !record?.hash) {
    return false;
  }

  const actual = await scryptAsync(password, record.salt);
  const expected = Buffer.from(record.hash, 'hex');

  if (actual.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expected);
}

function createSessionStore(sessionTtlMs) {
  const sessions = new Map();
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [token, expiresAt] of sessions.entries()) {
      if (expiresAt <= now) {
        sessions.delete(token);
      }
    }
  }, Math.min(sessionTtlMs, 60_000));

  interval.unref?.();

  return {
    create() {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + sessionTtlMs;
      sessions.set(token, expiresAt);
      return { token, expiresAt: new Date(expiresAt).toISOString() };
    },
    verify(token) {
      const expiresAt = sessions.get(token);
      if (!expiresAt) {
        return false;
      }

      if (expiresAt <= Date.now()) {
        sessions.delete(token);
        return false;
      }

      return true;
    },
    destroy(token) {
      if (!token) {
        return;
      }

      sessions.delete(token);
    },
    stop() {
      clearInterval(interval);
      sessions.clear();
    }
  };
}

function extractBearerToken(headerValue = '') {
  const [scheme, token] = String(headerValue).split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function createAuthService({ authFile, minimumPasswordLength, sessionTtlMs }) {
  const sessions = createSessionStore(sessionTtlMs);

  function validatePassword(password) {
    if (typeof password !== 'string' || password.length < minimumPasswordLength) {
      const error = new Error(`Password must be at least ${minimumPasswordLength} characters long.`);
      error.statusCode = 400;
      throw error;
    }
  }

  async function isConfigured() {
    return Boolean(await readPasswordRecord(authFile));
  }

  async function setupPassword(password) {
    validatePassword(password);

    if (await isConfigured()) {
      const error = new Error('Dashboard password is already configured.');
      error.statusCode = 409;
      throw error;
    }

    await writePasswordRecord(authFile, await hashPassword(password));
    return sessions.create();
  }

  async function login(password) {
    const record = await readPasswordRecord(authFile);
    if (!record) {
      const error = new Error('Dashboard password has not been configured yet.');
      error.statusCode = 409;
      throw error;
    }

    const isValid = await verifyPassword(password, record);
    if (!isValid) {
      const error = new Error('Incorrect dashboard password.');
      error.statusCode = 401;
      throw error;
    }

    return sessions.create();
  }

  return {
    async getAuthState() {
      const configured = await isConfigured();
      return {
        authEnabled: true,
        setupRequired: !configured,
        configured
      };
    },
    async setupPassword(password) {
      return setupPassword(password);
    },
    async login(password) {
      return login(password);
    },
    verifyToken(token) {
      return sessions.verify(token);
    },
    extractToken(req) {
      return extractBearerToken(req.headers.authorization) || null;
    },
    logout(token) {
      sessions.destroy(token);
    },
    async requireApiAuth(req, res, next) {
      const state = await this.getAuthState();
      if (state.setupRequired) {
        res.status(428).json({ error: 'Dashboard setup is required before accessing protected routes.' });
        return;
      }

      const token = this.extractToken(req);
      if (!this.verifyToken(token)) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      req.authToken = token;
      next();
    },
    stop() {
      sessions.stop();
    }
  };
}
