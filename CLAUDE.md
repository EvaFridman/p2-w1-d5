# Project

Real-estate catalog. Monorepo: `api` (NestJS backend) and `web` (Next.js frontend).
Root holds shared Prettier, ESLint and commitlint config.
The site is in Russian: UI text and user-facing error messages are written in Russian.

## Stack

- Node 24 (same as CI)
- api: NestJS 12, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL 18, Redis 8 (ioredis),
  RabbitMQ 4 (amqplib), Temporal (SDK 1.x), pino via `nestjs-pino`
- web: Next 16, React 19, TanStack Query 5, Zustand 5
- Local services run natively, no Docker: Postgres via Postgres.app,
  Redis / RabbitMQ / Temporal via Homebrew.

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

## Before calling work done (from root)

CI (`.github/workflows/ci.yml`, on PRs to `main`) runs the same list except Prettier.

- `npm run format:check`
- `npm run lint:api`, `npm run lint:web`
- `npm --prefix web run lint:css`
- `npm run typecheck`
- `npm run test:api` (it sets the ESM flag Jest needs)

## Dependencies

- `api` installs with `--legacy-peer-deps` (e.g. `npm ci --prefix api --legacy-peer-deps`).

## Database

- New migration (in `api/`): `npx prisma migrate dev --name <name>`.
- There is one local DB and it holds data; schema changes go through a migration.

## Git

- Commits: `type(scope): subject`. Types: feat, fix, refactor, chore, docs, test, ci.
  Scope required, one of: api, web, docs, deps. Subject lower-case.
- Pre-commit hook runs Prettier on staged files (lint-staged) and commitlint on the message.
- Branches: `pX-wY-dZ/release-N/<short-desc>`; changes go through pull requests.
