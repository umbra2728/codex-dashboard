# Codex Dashboard project guide

## Core commands
- `npm run dev` — run backend and frontend locally
- `npm run build` — build the frontend bundle
- `npm test` — run Vitest coverage for server/client code
- `npm run test:e2e` — run Playwright smoke tests against the built app
- `CODEX_DASHBOARD_MODE=file npm run dev:server` — run the backend against watched normalized files

## Architecture map
- `config.js` — central runtime config for ports, security, watch mode, and file paths
- `server/app.js` — Express app creation, middleware, source startup, and shutdown wiring
- `server/auth.js` — local password setup/login and in-memory session token validation
- `server/store.js` — normalized store and update subscription surface
- `server/selectors.js` — derived dashboard views from normalized entities
- `server/routes/api.js` — auth and read-only dashboard REST routes
- `server/ws.js` — authenticated WebSocket snapshot+deltas transport
- `server/sources/*.js` — mock and file-backed ingestion adapters
- `src/App.jsx` — auth flow, websocket bootstrap, workspace/range filtering, and page orchestration
- `src/components/*.jsx` — app shell and six dashboard views
- `test/fixtures/mock-dashboard-data.js` — canonical entity fixture for mock mode and tests

## Non-obvious conventions
- The backend source contract is normalized entity arrays keyed by slice name; keep file mode aligned with `test/fixtures/mock-dashboard-data.js`.
- WebSocket transport is read-only in v1 and only emits `initial_data` and `dashboard_delta` messages.
- REST responses should remain compatible with the WebSocket bootstrap/delta views so stale fallback works without translation.
- Frontend filtering is local-only; do not introduce server-side query params for v1 unless the local snapshot becomes too large.

## Definition of done
- Requested behavior works in mock mode and does not break file mode.
- `npm run build`, `npm test`, and `npm run test:e2e` pass.
- `.claude` docs are updated when contracts, commands, or workflow rules change.

## Documentation update rule
- If you change entity shapes, auth flow, watched file names, or validation behavior, update `README.md` and the relevant `.claude/rules/*.md` file in the same task.

## Memory placement
- Keep this file as the short project index.
- Put detailed workflow rules in `.claude/rules/*.md`.
