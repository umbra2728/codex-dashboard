# Code style rules

- Prefer small modules with one responsibility: auth, store, selectors, sources, routes, and websocket transport stay separate.
- Keep dashboard contracts explicit: use named slice keys (`workspaces`, `runs`, `sessions`, `toolCalls`, `approvals`, `policyEvents`, `usageSamples`, `sourceHealth`).
- Generate repeated localhost origin lists from shared helpers in `config.js` so CORS and CSP sources stay aligned.
- Do not add backend write actions for approvals or policies in v1.
- Keep the frontend local-first: reuse the bootstrap payload and websocket deltas instead of adding parallel state sources.
- Preserve the dense graphite + mint visual language unless the user requests a different UI direction.
