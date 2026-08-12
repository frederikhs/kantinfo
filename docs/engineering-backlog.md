# KantInfo Engineering Backlog

This is the canonical technical audit and prioritized improvement plan for
KantInfo. Keep it in source control so future development sessions have the
architecture, findings, task rationale, acceptance criteria, and verification
context without requiring access to a particular GitHub account or project.

KantInfo displays canteen menu data supplied by Kokkenes Koekken. It consists of
a Go API, a React frontend, and an nginx edge proxy. The application also has a
navigation-free route intended for unattended wallboard displays.

## Repository map

- `backend/`: Go, Gin, SQLite, and the upstream menu synchronization job.
- `frontend/`: React, TypeScript, Vite, Tailwind CSS, and static-file nginx.
- `lb/`: public nginx reverse proxy for the frontend and `/api`.
- `docker-compose.yml`: production-style service topology.
- `docker-compose-dev.yml`: bind-mounted development overrides.
- `.github/workflows/push.yml`: multi-architecture GHCR image publishing.

Runtime request flow:

```text
browser -> lb nginx -> frontend nginx
                    -> Go API -> SQLite
                              -> Kokkenes Koekken upstream API (hourly)
```

## Local development

Requirements:

- Docker
- Docker Compose

Copy `.env.example` to `.env` and set `SCHOOL_ID` and `OFFER_ID`. Then run:

```shell
docker compose up -d --build
```

The application is available at <http://localhost:42069>. The Docker network
also assigns `172.33.0.2` to the edge proxy, although this fixed-address setup is
scheduled for removal below.

`COMPOSE_FILE` in `.env.example` enables both the base and development Compose
files. Development mode runs Reflex for Go and Vite for React.

## Prioritized improvement plan

This section is the durable handoff for future development sessions. It records
the production-readiness audit performed on **2026-08-12** at commit `1c5849b`.
Tasks are listed in recommended execution order. A future Codex session should:

1. Read this entire plan and inspect the current Git status.
2. Start with the first unchecked task unless the user selects another task.
3. Keep changes scoped to that task and add tests proportional to its risk.
4. Run the task's acceptance checks.
5. Mark completed checkboxes and update the audit baseline when behavior or
   commands change.

Do not commit database files, journals, credentials, generated frontend output,
or `node_modules`.

### Audited baseline

Application code and configuration were not modified by the audit; this document
records its results. At audit time:

- `go test ./...` passed, but every package reported `[no test files]`.
- `go vet ./...` passed.
- `npm run lint` passed.
- A clean Docker production build passed for all three images.
- Both nginx configurations passed `nginx -T` validation.
- The frontend production output was approximately:
  - JavaScript: 237.5 kB raw, 76.4 kB gzip.
  - CSS: 9.6 kB raw, 2.7 kB gzip.
  - The bundle is small enough; delivery and caching matter more than splitting.
- Approximate local image sizes were 41.9 MB backend, 62.6 MB frontend, and
  62.3 MB edge nginx.
- A stripped backend binary was 21 MB instead of 32 MB unstripped.
- `govulncheck` found reachable `GO-2026-5856` in Go 1.26.4, fixed in 1.26.5.
- `npm audit` found `GHSA-2v37-7h3g-55p8` through `nanoid` 3.3.16.
- The worktree contained an untracked, `nobody`-owned
  `backend/db.sqlite-journal`. Treat it as existing runtime state; do not commit
  it or remove it without first confirming no database process is using it.
- Local `frontend/node_modules` was produced in Alpine and contains musl-native,
  container-owned dependencies. Host-side Vite builds can fail on a glibc host.
  Use a clean container build until task `P2-DEV-1` is complete.
- GitHub CLI was unauthenticated, so hosted branch protection, Actions history,
  package retention, Dependabot, and release settings were not verified.

### P0: Data integrity and availability

These defects can empty the published menu, wedge SQLite, or leave unattended
screens stale. Complete them before deployment and release refinements.

- [ ] **P0-DATA-1: Make synchronization atomic and preserve last-known-good data.**
  - Problem: `backend/internal/service/service.go` clears `menu` before fetching
    upstream data. A fetch failure returns without rollback. `Begin` and `Commit`
    in `backend/internal/persistence/sqlite.go` execute on `sql.DB`, so statements
    are not guaranteed to share one connection or transaction.
  - Implement: fetch and validate the complete schedule first; start a real
    `*sql.Tx`; replace data inside that transaction; defer rollback; commit only
    after every insert succeeds. Reject unexpectedly empty upstream schedules
    unless empty data is explicitly valid.
  - Tests: successful replacement, upstream failure, empty/invalid response,
    insert failure, rollback, and preservation of the previous dataset.
  - Done when: readers see either the old complete schedule or the new complete
    schedule, never a partial or empty intermediate state.

- [ ] **P0-DATA-2: Return persistence errors instead of panicking.**
  - Problem: generic query helpers and `MustExec` panic on ordinary storage
    failures, making controller error branches mostly ineffective.
  - Implement: return wrapped errors from all persistence methods; propagate
    them through the service and controllers; reserve process termination for
    unrecoverable startup failures. Close the database during graceful shutdown.
  - Tests: force query/write errors and verify controlled `500` responses,
    `Cache-Control: no-store`, useful logs, and no process crash.

- [ ] **P0-SYNC-1: Bound upstream requests and make refresh scheduling resilient.**
  - Problem: synchronization uses `http.DefaultClient` without a timeout. One
    stalled request can prevent all future hourly refreshes.
  - Implement: inject a client with a total timeout; pass contexts; add bounded
    retry/backoff with jitter; record the last attempt, last success, duration,
    item count, and failure. Prefer a ticker/scheduler that cannot overlap jobs.
  - Done when: a stalled upstream terminates predictably, old data remains
    available, and later scheduled refreshes still run.

- [ ] **P0-UI-1: Automatically refresh unattended wallboards.**
  - Problem: `frontend/src/Frame.tsx` fetches only when the route date changes.
    HTTP cache expiry does not initiate a request, so wallboards remain stale
    until manually reloaded.
  - Implement: revalidate shortly after the backend refresh boundary, on tab
    visibility, and after reconnecting. Keep showing last-known-good data while
    refreshing. Avoid synchronized polling across many clients by adding jitter.
  - Done when: `/menu/neaste/stor` updates without navigation or page reload and
    recovers from temporary network/API failure.

### P1: Correctness, contracts, and visible UX

- [ ] **P1-DATE-1: Use an explicit Europe/Copenhagen business date.**
  - Problem: SQLite uses `date('now', 'localtime')`, which follows the container
    timezone and may classify today incorrectly near midnight.
  - Implement: load `Europe/Copenhagen` in Go, calculate the date once per
    request/sync, and pass it into SQL. Include timezone data in the image if the
    selected Go approach requires it.
  - Tests: dates around UTC midnight, daylight-saving transitions, weekends,
    and no-current-menu cases.

- [ ] **P1-API-1: Make the API contract explicit and null-safe.**
  - Problem: backend `CurrentOrNextDate` allows nullable date and future fields,
    while the frontend type only allows a nullable date. Navigation can generate
    `/menu/null`.
  - Implement: define stable JSON response structs, return empty arrays instead
    of ambiguous `null` where appropriate, align TypeScript types, validate
    responses at the frontend boundary, and hide unavailable navigation actions.
  - Consider adding an OpenAPI document or shared generated schema after the
    response shapes settle.

- [ ] **P1-API-2: Remove or constrain CORS.**
  - Problem: the API is served same-origin through nginx, but the backend enables
    wildcard origins together with credential support. That combination is
    unnecessary and inconsistent with browser CORS rules.
  - Implement: remove CORS for the normal same-origin deployment, or configure an
    explicit allowlist if a separately hosted client is a real requirement. Test
    allowed and rejected origins rather than accepting `*` by default.

- [ ] **P1-UI-1: Add complete loading, error, empty, and retry states.**
  - Problem: menu errors render a blank page; date-list errors remain on
    `Loading`; promise rejections are not handled. `/datoer` unnecessarily waits
    for `/menu/next` because its outlet is gated by frame menu data.
  - Implement: decouple date-list loading from menu loading; use `AbortController`;
    provide Danish loading/error/empty states and retry commands; retain stale
    menu data during background refreshes; add a not-found route.
  - Tests: route transitions, aborted requests, non-JSON responses, `404`, `500`,
    offline recovery, empty date list, and empty current menu.

- [ ] **P1-UI-2: Build a real wallboard layout.**
  - Problem: the current wallboard route only hides navigation. At 1920x1080 it
    keeps normal desktop typography and leaves most of the viewport unused.
  - Implement: create a dedicated responsive display variant with large readable
    type, balanced columns, stable card dimensions, viewport-height use, long-item
    overflow behavior, update status, and a subtle stale/offline indicator.
  - Verify with screenshots at 1920x1080, 1366x768, portrait display dimensions,
    and worst-case long menu/group text.

- [ ] **P1-HTTP-1: Add server timeouts and graceful shutdown.**
  - Problem: `gin.Engine.Run` supplies no explicit read-header, read, write, or
    idle timeouts and does not coordinate shutdown with the sync worker/database.
  - Implement: create `http.Server`, configure timeouts, handle termination
    signals, cancel background work, stop accepting traffic, drain requests, and
    close SQLite. Add `/health/live` and `/health/ready`; readiness should account
    for database access and a usable last synchronization state.

- [ ] **P1-CACHE-1: Correct static compression and immutable caching.**
  - Problem: frontend nginx config enables gzip for `text/js`, but `.js` is served
    as `application/javascript`. Runtime verification returned the 229.6 kB vendor
    file uncompressed. Hashed assets receive only 30-day caching.
  - Implement: gzip or Brotli `application/javascript`, CSS, JSON, SVG, and other
    useful text types; give Vite-hashed assets one-year `public, immutable`
    caching; keep HTML on `no-cache`/revalidation. Preserve correct `Vary` headers.
  - Add a repeatable header test for compressed JS, immutable hashed assets, and
    uncached `index.html`.

- [ ] **P1-CACHE-2: Make API cache policy response-aware.**
  - Problem: API cache headers are assigned before controller execution. Current
    error helpers overwrite them, but panics and future handlers can accidentally
    expose cacheable failures. The expiry also represents the next attempted sync,
    not necessarily the freshness of the last successful dataset.
  - Implement: apply public freshness only to successful, validated responses;
    make every error and incomplete response `no-store`; expose data freshness
    separately from retry scheduling. Add header tests for `200`, `400`, `404`,
    `500`, panic recovery, successful sync, and failed sync.

- [ ] **P1-NGINX-1: Move inline frontend nginx configuration into a file.**
  - Problem: effective `nginx -T` output showed the asset regex lost its escaped
    dot and end anchor while passing through the Dockerfile heredoc.
  - Implement: keep a normal tracked nginx config, validate it during CI, and
    document which layer owns API versus static caching.

- [ ] **P1-SEC-1: Patch known dependency vulnerabilities.**
  - Upgrade the Go toolchain/base image from 1.26.4 to at least 1.26.5 and rerun
    `govulncheck`.
  - Upgrade the frontend dependency chain so `nanoid` is at least 3.3.17 and run
    `npm audit`.
  - Move `@tailwindcss/vite` and `tailwindcss` to `devDependencies`; they are build
    tooling, not browser runtime dependencies.
  - Record or automate accepted exceptions rather than silently ignoring scans.

### P2: CI/CD, releases, and operations

- [ ] **P2-CI-1: Separate pull-request validation from image publishing.**
  - Current workflow publishes backend and frontend images for every branch push
    without first running application checks.
  - Add PR and main-branch jobs for `go test ./...`, `go vet ./...`, race-sensitive
    tests where practical, frontend typecheck/build/lint/tests, nginx syntax and
    header checks, Compose validation, `govulncheck`, `npm audit`, and container
    scanning. Add concurrency cancellation.
  - Publish only from protected `main` and version tags. Do not grant package
    write permission to validation-only jobs.

- [ ] **P2-REL-1: Establish a reproducible release process.**
  - Add semantic version tags and release notes/changelog policy.
  - Tag images with the release, commit SHA, and `latest` only from the default
    branch. Clean up architecture-specific intermediate tags.
  - Add OCI source/revision/version labels, SBOMs, build provenance, signatures,
    deployment documentation, and rollback instructions.
  - Decide how the edge `lb` image is delivered. The current workflow publishes
    only backend and frontend images while Compose builds `lb` from source, so the
    deployment is not fully represented by immutable release artifacts.
  - Pin GitHub Actions and base images by immutable digest; use an automated
    dependency update tool to keep those pins current.

- [ ] **P2-GH-1: Audit hosted GitHub settings after authentication.**
  - Verify required reviews/checks, protected tags, force-push/deletion policy,
    Actions permissions, secret exposure, Dependabot alerts/updates, code scanning,
    GHCR visibility, package retention, and artifact retention.
  - Add `CODEOWNERS`, a pull-request template, issue templates, `SECURITY.md`, and
    a license if this repository is intended for collaboration or distribution.

- [ ] **P2-OPS-1: Add container health and hardening controls.**
  - Run services as non-root where supported; use read-only filesystems and
    writable tmp/data mounts; add `no-new-privileges`, health checks, restart
    policies, resource limits, and log rotation.
  - Add explicit production configuration validation for required school/offer
    IDs. Do not expose the backend/frontend directly.
  - Consider whether three runtime containers are still justified: the frontend
    static files could be served by the public nginx, reducing one image and hop.

- [ ] **P2-NET-1: Replace fixed container IPs with service discovery.**
  - Use Compose service names (`backend:8080`, `frontend:80`) rather than a fixed
    `/16` network and hard-coded addresses. Remove the custom MTU unless its
    deployment requirement is documented.
  - Configure proxy connect/read/send timeouts, forwarded protocol headers, and
    upstream failure behavior. Add TLS/security headers at the actual external
    ingress when deployment topology is known.

- [ ] **P2-DEV-1: Stop development containers from polluting host dependencies.**
  - Mount a named volume at `/app/node_modules`, run containers with the host UID
    where practical, and avoid mixing Alpine/musl dependencies with host/glibc
    dependencies.
  - Put SQLite under a dedicated data directory/volume, not the source tree.
  - Add `backend/.dockerignore` and ignore `db.sqlite-*`, build outputs, coverage,
    editor files, and local tooling caches. Confirm build contexts contain no
    database or journal files.
  - Pin the Reflex version instead of installing `@latest`.

- [ ] **P2-OBS-1: Add useful operational visibility.**
  - Use structured logs with request/sync IDs and avoid logging every inserted
    row in normal production operation.
  - Expose counters/timings for sync attempts, failures, duration, fetched menu
    items, last success age, API status/latency, and SQLite failures.
  - Alert when no successful sync has occurred for more than the expected window
    or when no future menu remains.

### P3: Accessibility and maintainability

- [ ] **P3-A11Y-1: Complete an accessibility pass.**
  - Add an accessible label and tooltip to the icon-only theme button.
  - Use `<main>`, a page-level `<h1>`, descriptive navigation landmarks, and
    `aria-current` for the active date.
  - Add visible `:focus-visible` states and verify keyboard-only navigation.
  - Raise contrast for past-date text and test both themes against WCAG AA.
  - Check 320/375/390/768/800px widths and long Danish text for overflow. The
    full date navigation currently wraps awkwardly around the `md` breakpoint.

- [ ] **P3-FE-1: Tighten frontend implementation details.**
  - Do not mutate API state with in-place `.sort()` in `MenuPage`; use `toSorted`
    or clone first.
  - Use stable semantic keys rather than array indexes for menu items and dates.
  - Parse date-only strings without browser/UTC ambiguity and centralize Danish
    date formatting.
  - Replace misspellings such as `neaste` with a canonical route while preserving
    a redirect for existing wallboard bookmarks.
  - Consider route-level lazy loading only if the application grows; current
    bundle size does not justify complexity by itself.

- [ ] **P3-DOC-1: Expand operator and contributor documentation.**
  - Document environment variables, upstream ownership/terms, data refresh and
    stale-data behavior, ports, production deployment, backup/recovery, release,
    rollback, troubleshooting, and all verification commands.
  - Explain intentional `robots.txt`/`noindex` behavior and whether the service is
    private, internal, or expected to be publicly discoverable.

### Deferred decisions

- **Shared API caching:** the edge nginx currently does not cache `/api`; browsers
  cache successful responses using backend headers. SQLite reads are cheap, so
  add `proxy_cache` only if measured traffic justifies it. If enabled, cache only
  successful GET/HEAD responses, use cache locking, and serve stale data during
  upstream failure.
- **Framework size:** Gin and its transitive dependency graph contribute to a
  21 MB stripped binary. Replacing it with `net/http` could reduce dependencies,
  but correctness, tests, and operations have much higher priority.
- **Single-container frontend/edge:** consolidation can remove a proxy hop and a
  roughly 62 MB image, but first clarify development and deployment requirements.

### Standard verification commands

Run the relevant subset for each task; CI should eventually run all of them:

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

# Containers and configuration
cd ..
docker compose config
docker build --target production -t kantinfo-backend-audit backend
docker build --target production -t kantinfo-frontend-audit frontend
docker build -t kantinfo-lb-audit lb
docker run --rm kantinfo-frontend-audit nginx -T
docker run --rm kantinfo-lb-audit nginx -T
```

For frontend changes, render with realistic menu data and verify desktop, mobile,
tablet breakpoint, dark theme, error/empty states, and wallboard dimensions. For
cache changes, inspect actual response headers with `Accept-Encoding: gzip` or
`br`; Vite's printed gzip estimate alone does not prove nginx compression.
