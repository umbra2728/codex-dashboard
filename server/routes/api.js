import express from 'express';

export function createApiRouter({ store }) {
  const router = express.Router();

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
