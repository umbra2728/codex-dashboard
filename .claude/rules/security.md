# Security rules

- The dashboard is localhost-only; keep CORS and WebSocket origins limited to explicit local origins from `config.js`.
- The dashboard no longer uses password auth; do not expand binding/origin scope or expose it outside local development without revisiting the access model first.
- Keep all dashboard REST routes and the `/ws` socket read-only in v1.
- File mode readers must resolve watched files through `server/utils/pathSafety.js` and must not follow symlinks.
- v1 governance is read-only; do not add approve/reject or shell execution endpoints without updating security rules first.
