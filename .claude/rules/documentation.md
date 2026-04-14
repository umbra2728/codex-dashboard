# Documentation rules

- Keep `README.md` focused on actual setup, environment variables, file mode contract, and verification commands used in this repo.
- When the normalized entity contract changes, update both `README.md` and `test/fixtures/mock-dashboard-data.js` references together.
- When adding a new runtime mode or watched file, document the exact env var and filename here and in `README.md`.
- After notable implementation changes, update `.claude/CLAUDE.md` with real paths and commands only.
