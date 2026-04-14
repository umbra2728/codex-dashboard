# Testing rules

- `npm test` should cover normalized store logic, websocket client behavior, and at least one presentational component.
- Keep `test/fixtures/mock-dashboard-data.js` as the canonical deterministic fixture for unit and e2e assertions.
- Playwright tests must handle first-run password setup before asserting on dashboard views.
- When adding a new dashboard view, add either a dedicated component test or extend the navigation smoke coverage.
