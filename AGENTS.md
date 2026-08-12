# KantInfo Agent Guide

This file applies to the entire repository. Read it before making changes.

## First steps

1. Read `docs/engineering-backlog.md`. It is the canonical audit, prioritized
   backlog, acceptance criteria, measured baseline, and durable session handoff.
2. Inspect `git status --short --branch` before editing. The worktree may contain
   user or runtime changes; never discard changes you did not create.
3. Unless the user selects a task, begin with the first unchecked task in the
   highest-priority section of the backlog.
4. Keep work scoped to one task ID where practical. Add focused tests, run the
   relevant verification commands, then update that task's checkbox and context.
5. Do not put the engineering backlog into `README.md`. The user wants the normal
   project README kept separate from the detailed engineering handoff.

## System overview

KantInfo displays canteen menus supplied by Kokkenes Koekken.

```text
browser -> lb nginx -> frontend nginx
                    -> Go/Gin API -> SQLite
                                  -> upstream menu API (hourly sync)
```

- `backend/`: Go, Gin, SQLite, synchronization, and REST endpoints.
- `frontend/`: React, TypeScript, Vite, Tailwind CSS, and static nginx image.
- `lb/`: public nginx reverse proxy for `/api` and the frontend.
- `docker-compose.yml`: base/production-style topology.
- `docker-compose-dev.yml`: development bind mounts and reload processes.
- `.github/workflows/push.yml`: multi-architecture GHCR publishing.
- `docs/engineering-backlog.md`: complete findings and ordered implementation plan.

## Critical audit context

The audit was performed on 2026-08-12 at commit `1c5849b`. Verify assumptions if
the repository has moved forward.

- Highest priority is `P0-DATA-1`. Synchronization currently clears SQLite before
  fetching upstream data. Its raw `BEGIN`/`COMMIT` calls run through `sql.DB`, so
  the operations are not guaranteed to use one transaction or connection. A
  failed fetch can preserve an open transaction, lock the database, or remove the
  last good menu. Fetch and validate first, then replace data using a real
  `*sql.Tx` with rollback and tests.
- Persistence helpers panic on query failures and use `MustExec`. Convert ordinary
  storage failures into wrapped errors and controlled responses.
- The upstream request uses `http.DefaultClient` without a timeout. Bound requests
  and ensure a failed/stalled refresh does not stop later refreshes.
- The wallboard route does not poll. Browser cache expiration alone does not
  initiate a request, so unattended displays remain stale until reloaded.
- The wallboard route only removes navigation. At 1920x1080 it retains ordinary
  desktop typography and leaves most of the viewport unused.
- SQLite determines today using container `localtime`; business dates must be
  calculated explicitly in `Europe/Copenhagen`.
- Backend nullable response fields do not match frontend types and can produce
  `/menu/null` navigation.
- Frontend request failures can render a blank page or an endless `Loading` state.
  The date-list route is unnecessarily gated by a successful menu request.
- Static JavaScript is currently not compressed: nginx config lists `text/js`,
  while `.js` is served as `application/javascript`. Vite-hashed assets only get
  30-day caching. Effective nginx output also showed the inline Dockerfile asset
  regex losing its escaped dot/end anchor.
- API cache headers are assigned before controller execution. Public freshness
  must only be applied to validated successful responses; every failure must be
  `no-store`. The edge nginx does not currently cache `/api` responses.
- Wildcard CORS with credential support is unnecessary for the same-origin nginx
  deployment and should be removed or constrained to explicit origins.
- The server has no explicit HTTP timeouts, graceful shutdown, readiness state,
  or coordinated sync/database shutdown.
- CI publishes images on every branch push without first running tests, lint,
  vulnerability scans, or nginx checks. There are no releases/tags. The workflow
  publishes backend and frontend images but not the edge `lb` image.
- Containers use floating Alpine/tool images, default users, hard-coded IPs, and
  have no health checks, restart policy, read-only filesystems, or resource limits.
- The frontend bundle is already small enough; prioritize delivery/caching and UX
  over additional code splitting.

See the backlog for the remaining GitHub, release, observability, accessibility,
container, network, documentation, and frontend-maintainability findings.

## Audited baseline

- `go test ./...`: passed, but all packages reported `[no test files]`.
- `go vet ./...`: passed.
- `npm run lint`: passed.
- Clean production Docker builds: passed for backend, frontend, and `lb`.
- Effective frontend and edge nginx configurations: syntax checks passed.
- Frontend output: about 237.5 kB JavaScript raw/76.4 kB gzip and 9.6 kB
  CSS raw/2.7 kB gzip.
- Local image sizes: about 41.9 MB backend, 62.6 MB frontend, and 62.3 MB edge.
- Backend binary: about 21 MB stripped versus 32 MB unstripped.
- `govulncheck`: reachable `GO-2026-5856` with Go 1.26.4; fixed in 1.26.5.
- `npm audit`: `GHSA-2v37-7h3g-55p8` through `nanoid` 3.3.16.
- GitHub CLI was unauthenticated during the audit. Hosted branch protection,
  workflow history, package retention, Dependabot, code scanning, and release
  settings were not verified.

## Workspace hazards

- At audit time `backend/db.sqlite-journal` was untracked, owned by `nobody`, and
  created by a development container. Treat it as pre-existing runtime state. Do
  not commit, delete, chown, or otherwise alter it without confirming that no
  database process is using it.
- `backend/db.sqlite` is ignored runtime data. Never commit it.
- Local `frontend/node_modules` was installed inside Alpine and contains
  musl-native, container-owned dependencies. Host Vite can fail on a glibc host
  even when TypeScript and ESLint work. Until `P2-DEV-1` is complete, use a clean
  Docker production build for authoritative frontend build results.
- The backend lacks `.dockerignore`; its build context can include SQLite and
  journal files. Fix this under `P2-DEV-1` before treating build contexts as clean.
- Do not commit `.env`, credentials, `node_modules`, generated `dist`, databases,
  journals, audit screenshots, or temporary binaries/images.

## Implementation conventions

- Prefer existing Go, React, and Compose patterns unless a backlog task explicitly
  calls for changing them.
- In Go, return and wrap operational errors; do not introduce new panics or
  `Must*` calls on request/sync paths. Use contexts for I/O and transactions.
- Preserve last-known-good menu data during upstream or storage failures.
- Keep backend and TypeScript JSON contracts aligned, especially nullability.
- User-facing strings are Danish. Preserve correct Danish text and date behavior.
- Frontend work must include loading, error, empty, stale, offline, and long-text
  states where applicable. Do not mutate fetched arrays in place.
- Cache rules must be tested against actual HTTP headers, not inferred from Vite's
  gzip size report. Never cache error responses publicly.
- For wallboard changes, verify unattended refresh/recovery and screenshots at
  1920x1080, 1366x768, portrait display dimensions, and long-content cases.
- Keep `docs/engineering-backlog.md` current when a finding is resolved, split,
  superseded, or newly discovered. Mark a task complete only after its acceptance
  criteria and relevant checks pass.

## Verification

Use the relevant subset for the task. The full target suite is:

```shell
# Backend
cd backend
gofmt -w <changed-go-files>
go test ./...
go test -race ./...
go vet ./...
go run golang.org/x/vuln/cmd/govulncheck@latest ./...

# Frontend
cd frontend
npm ci
npm run lint
npm run build
npm audit

# From repository root
docker compose config
docker build --target production -t kantinfo-backend-audit backend
docker build --target production -t kantinfo-frontend-audit frontend
docker build -t kantinfo-lb-audit lb
docker run --rm kantinfo-frontend-audit nginx -T
docker run --rm kantinfo-lb-audit nginx -T
```

Networked vulnerability checks and Docker daemon access may require explicit
approval in restricted environments. Remove temporary audit images after use.
