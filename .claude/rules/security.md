# Security rules

- The dashboard is localhost-only; keep CORS and WebSocket origins limited to explicit local origins from `config.js`.
- All non-auth `/api` routes and the `/ws` socket require a valid in-memory bearer session.
- Keep password storage file-backed and hashed with scrypt; never store plaintext credentials in the repo.
- File mode readers must resolve watched files through `server/utils/pathSafety.js` and must not follow symlinks.
- v1 governance is read-only; do not add approve/reject or shell execution endpoints without updating security rules first.
