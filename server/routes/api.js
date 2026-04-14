import express from 'express';

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export function createApiRouter({ auth, authLimiter, store }) {
  const router = express.Router();

  router.get('/auth/required', asyncHandler(async (_req, res) => {
    res.json(await auth.getAuthState());
  }));

  router.post('/auth/setup', authLimiter, asyncHandler(async (req, res) => {
    const { password, confirmPassword } = req.body || {};
    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Password confirmation does not match.' });
      return;
    }

    const session = await auth.setupPassword(password);
    res.status(201).json(session);
  }));

  router.post('/auth/login', authLimiter, asyncHandler(async (req, res) => {
    const { password } = req.body || {};
    const session = await auth.login(password);
    res.json(session);
  }));

  router.post('/auth/logout', asyncHandler(async (req, res) => {
    auth.logout(auth.extractToken(req));
    res.status(204).end();
  }));

  router.use((req, res, next) => auth.requireApiAuth(req, res, next));

  router.get('/health', (_req, res) => {
    res.json({ ok: true, meta: store.getMeta() });
  });

  router.get('/bootstrap', (_req, res) => {
    res.json(store.getBootstrapPayload());
  });

  router.get('/dashboard', (_req, res) => {
    res.json({ meta: store.getMeta(), views: store.getViews() });
  });

  router.get('/overview', (_req, res) => {
    res.json({ meta: store.getMeta(), overview: store.getViews().overview });
  });

  router.get('/runs', (_req, res) => {
    res.json({ meta: store.getMeta(), runs: store.getViews().runs });
  });

  router.get('/sessions', (_req, res) => {
    res.json({ meta: store.getMeta(), sessions: store.getViews().sessions });
  });

  router.get('/tools', (_req, res) => {
    res.json({ meta: store.getMeta(), tools: store.getViews().tools });
  });

  router.get('/governance', (_req, res) => {
    res.json({ meta: store.getMeta(), governance: store.getViews().governance });
  });

  router.get('/usage', (_req, res) => {
    res.json({ meta: store.getMeta(), usage: store.getViews().usage });
  });

  router.use((error, _req, res, _next) => {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Unexpected server error.' });
  });

  return router;
}
