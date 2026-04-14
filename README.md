# Codex Dashboard

Local-first operational dashboard for Codex/OpenAI workflows.

## Features

- localhost-only access model
- realtime snapshot + delta WebSocket updates
- normalized backend store with derived views
- deterministic mock mode for development and tests
- file-backed live mode for watched JSON/JSONL ingestion
- six primary views: Overview, Runs, Sessions, Tools, Governance, Usage
- read-only governance visibility in v1

## Scripts

- `npm run dev` — start backend and Vite frontend together
- `npm run dev:server` — start the local backend
- `npm run dev:client` — start the Vite frontend
- `npm run build` — build the frontend bundle
- `npm run start` — serve the built dashboard
- `npm test` — run unit/integration tests
- `npm run test:e2e` — run Playwright smoke tests

## Environment

Copy `.env.example` and set values as needed.

Important variables:

- `CODEX_DASHBOARD_MODE=mock|file`
- `CODEX_DASHBOARD_DATA_DIR=./data`

## Local access model

The dashboard is designed for local-only use. It binds to localhost by default, keeps CORS and WebSocket origins limited to explicit local origins from `config.js`, and exposes a read-only API plus read-only websocket updates.

## File mode contract

In `file` mode, the backend watches a normalized data directory for these files:

- `workspaces.json` or `workspaces.jsonl`
- `runs.json` or `runs.jsonl`
- `sessions.json` or `sessions.jsonl`
- `toolCalls.json` or `toolCalls.jsonl`
- `approvals.json` or `approvals.jsonl`
- `policyEvents.json` or `policyEvents.jsonl`
- `usageSamples.json` or `usageSamples.jsonl`
- `sourceHealth.json` or `sourceHealth.jsonl`

Each file should contain either a top-level array or newline-delimited JSON objects matching the normalized entity shape used in `test/fixtures/mock-dashboard-data.js`.

## Architecture

- `server/` — normalized store, selectors, REST routes, WebSocket server, data sources
- `src/` — frontend shell, pages, realtime client hook, formatting/selectors utilities
- `test/` — unit/integration fixtures and backend/client tests
- `e2e/` — Playwright smoke coverage
- `.claude/` — project-specific rules and working guidance

## Verification

- `npm run build`
- `npm test`
- `npm run test:e2e`
