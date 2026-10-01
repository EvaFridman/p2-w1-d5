# Principles for feature specs

Code rules, stack, layers and check commands live in `CLAUDE.md`. This file holds only what matters
when designing a feature.

- Every feature goes through: spec → clarifications → plan → tasks → implementation. No code before the plan.
- Decisions that change behavior are made by a human in `clarifications.md`. The model asks; it does not pick.
- An acceptance criterion is observable behavior, checkable by hand in the UI or with a request to the API.
- One data format per concept: a new feature builds on the existing format instead of introducing a second one.
- Server data lives in the database (schema changes go through a migration) and in TanStack Query on the
  client, never in Zustand or localStorage.
- Forbidden: editing `api/src/generated` by hand, `prisma migrate reset`, `prisma db push`, touching legacy
  folders, adding a filter store.
- UI text and user-facing error messages are in Russian; spec files are in English.
- Any difference between the implementation and the spec is listed in the PR description.
