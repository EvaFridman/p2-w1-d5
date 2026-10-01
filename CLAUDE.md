# Project

Real-estate catalog. Monorepo: `api` (NestJS backend) and `web` (Next.js frontend).
Root holds shared Prettier, ESLint and commitlint config.
The site is in Russian: UI text and user-facing error messages are written in Russian.

## Stack

- Node 24 (same as CI and the `node:24.x` base image in the Dockerfiles; bump them together)
- api: NestJS 12, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL 18, Redis 8 (ioredis),
  RabbitMQ 4 (amqplib), Temporal (SDK 1.x), pino via `nestjs-pino`
- web: Next 16, React 19, TanStack Query 5, Zustand 5
- The app runs in Docker (`docker compose up -d`, see "Docker" below); Temporal stays native.
  Working data lives in the volumes `realty_pgdata` and `realty_uploads`. Postgres.app on the
  machine is a stale pre-Docker copy: never point the api at it (`DATABASE_URL` in `api/.env`) or
  run `npm run start:dev` natively, or the data splits between two databases again.

## Structure

- In both `api` and `web`, imports go only downward through the layers.
- `api/src/<module>/`: controller (thin) → service (logic) → Prisma. Request bodies are
  DTO classes with `class-validator` decorators.
- `api/src/common/`: global interceptor, exception filter, pipes.
- `api/src/errors/app.exception.ts`: error hierarchy (`NotFoundError`, `ForbiddenError`, ...).
- `api/prisma/schema.prisma`: schema. `api/src/generated/`: generated Prisma client, never edit by hand.
- `web/src/`: FSD layers, top to bottom: `_app` → `_pages` → `widgets` → `features` → `entities` → `shared`.
- `server*`, `admin-client*` in root are legacy. Don't read or edit them unless explicitly asked.

## Conventions: api

- ESM package: relative imports end in `.js`.
- `TransformInterceptor` wraps every response in `{ data, error, meta }`. Controllers return
  raw data; for pagination the service returns `{ items, meta }`.
- Throw errors from `errors/app.exception.ts`, not Nest's built-in exceptions.
- Log through injected `PinoLogger`, never `console`.
- Tests sit next to the code (`*.spec.ts` / `*.test.ts`); e2e tests are in `api/test/`.

## Conventions: web

- Path alias `@/*` → `web/src/*`.
- Server data lives in TanStack Query hooks in `entities/*/api/`. The Zustand store
  (`shared/providers/app-store.ts`) holds UI state only.
- Query keys come only from functions in `entities/*/api/keys.ts`.
- Catalog filters live in URL search params (`features/listing-filter/catalog`). There is no filter store.
- HTTP calls go only through `shared/api/api-fetch.ts` and `shared/api/http.ts`.

## Processes

- API: `npm run start:dev` (in `api/`)
- Queue worker (RabbitMQ): `npm run start:worker` (in `api/`)
- Temporal worker: `npm run start:temporal-worker` (in `api/`)
- Web: `npm run dev` (in `web/`)
- In Docker the queue worker is the `worker` service: the `api` image with `["node", "dist/worker.js"]`.

## Docker

Being built in p3-w4-d4; files below may not exist yet. Check before referring to them.

- Images: `api/Dockerfile`, `web/Dockerfile`, multi-stage. Exact base-image versions, never `latest`;
  non-root user; exec-form `CMD` (`["node", "dist/main.js"]`, keep the `.js`); copy
  `package.json` + lockfile and install before copying sources, to keep the cache.
- The `api` runtime stage also needs `prisma/`, `fonts/` (PDF font), `public/` (`/static`) and
  `src/generated/` next to `dist`. Leaving one out breaks things only at runtime.
- `web` builds with `output: "standalone"`. `NEXT_PUBLIC_*` are baked in at build time (one image per
  environment); server-side vars (`API_URL`, secrets, Redis) are passed at run time.
- The `web` image build prerenders from a running `api` (`--build-arg API_URL=...`,
  `NEXT_BUILD_SECRET` via `--secret`, never `ARG`). Commands: `web/README.md`. With `cacheComponents`,
  `generateStaticParams` must not return `[]`: Next 16 fails the build.
- `docker-compose.yml` (root) is the dev setup: `postgres`, `redis`, `rabbitmq`, `api`, `worker`,
  `web`. Sources are bind-mounted; `api`/`worker` build the `dev` stage (`nest start --watch`; it
  needs `ps`, hence `procps`), `web` builds the `deps` stage (`next dev`, no prerender). Ports are
  published on 127.0.0.1, with Postgres/Redis/AMQP/broker UI offset to 5433/6380/5673/15673.
  Values come from root `.env` (untracked; names in root `.env.example`; `scripts/init-env.sh`
  generates it).
- Every stage that runs the app runs as `node`, dev included. The `dev` stage must carry the same
  runtime files as `runtime` (`prisma/`, `prisma7.config.ts`, `fonts/`, `public/`): a missing one
  breaks migrations, mail PDFs or `/static` only in dev. After a Dockerfile change, re-run the
  fresh-clone steps from README, not just `up`.
- `docker-compose.prod.yml` overlays it: images `realty-{api,web}:${IMAGE_TAG}` (commit hash, required),
  no builds or bind mounts, `restart: unless-stopped`, only `web` publishes a port. Prod images are
  built with plain `docker build`; the `web` build needs an api on host port 3000. Commands: README.
- Containers reach each other by service name (`postgres`, `redis`, `rabbitmq`, `api`, `web`), never
  `localhost`. Addresses come from env vars, not code.
- In prod only `web` publishes a port; DB, Redis, broker UI and `api` are internal. Browser-facing
  api files go through web: `app/files/[...path]` and `app/static/[...path]` forward to `api` via
  `apiProxy` in `shared/api/api-fetch.ts`, so `PUBLIC_URL` points at the site, not at `api`.
- Startup order uses `healthcheck` + `depends_on: condition: service_healthy`, never sleeps in code.
  `api` checks `/health/live`; `worker` has no healthcheck.
- Named volumes: Postgres data, Redis data, `uploads` (mounted into both `api` and `worker`).
- Secrets come from untracked env files at run time; never `COPY`/`ARG`/`ENV` them into an image.
  Keep `api/.env.example` and `web/.env.example` complete when adding variables.
- Temporal server and `start:temporal-worker` are not in compose. Its address is `TEMPORAL_ADDRESS`;
  unset means the SDK default (localhost, port 7233), so never write that address in code.

## Before calling work done (from root)

CI (`.github/workflows/ci.yml`, on PRs to `main`) runs the same list except Prettier and the web build.

- `npm run format:check`
- `npm run lint:api`, `npm run lint:web`
- `npm --prefix web run lint:css`
- `npm run typecheck`
- `npm run test:api` (it sets the ESM flag Jest needs)
- After `web` changes: `npm --prefix web run build` with the API running (dev mode skips prerendering)

## Dependencies

- `api` installs with `--legacy-peer-deps` (e.g. `npm ci --prefix api --legacy-peer-deps`).

## Database

- The working DB is the Docker one (`realty_pgdata`) and it holds real data; schema changes go
  through a migration. New migration: `docker compose run --rm api npx prisma migrate dev --name <name>`
  (the dev image mounts `api/prisma`, so the migration file lands in the repo). If Prisma reports
  drift or offers a reset, stop and ask the owner.
- In Docker, migrations run in a one-off container from the `api` image (`prisma migrate deploy`),
  not inside the running app. That is why `prisma` is in `dependencies`, not `devDependencies`:
  keep it there.
- Seeds: `api/src/seed.ts` (built to `dist/seed.js`, run by `prisma db seed`). It skips a DB that
  already has users; users get the password from `SEED_PASSWORD`. Natively: `npm run build` first.
- `docker compose down -v` and `docker volume rm/prune` delete the DB and uploads; the Bash guard
  blocks them. Only the owner runs them, by hand.

## Git

- Commits: `type(scope): subject`. Types: feat, fix, refactor, chore, docs, test, ci.
  Scope required, one of: api, web, docs, deps. Subject lower-case.
- Pre-commit hook runs Prettier on staged files (lint-staged), then gitleaks on the staged diff;
  commitlint checks the message. CI also runs gitleaks over the full history.
- A gitleaks hit is a real secret until proven otherwise: unstage it, never weaken the scan. Only a
  value confirmed to be a placeholder goes into the `.gitleaks.toml` allowlist, with a description.
- Branches: `pX-wY-dZ/release-N/<short-desc>`; changes go through pull requests.

@CONTRIBUTING.md
