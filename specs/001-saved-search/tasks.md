# 001 — Saved search: tasks

Each task is done when its check passes. Order follows dependencies.

## T1. Table and migration

`SavedSearches` model in `api/prisma/schema.prisma` (fields and unique indexes from `plan.md`),
migration `add_saved_searches`.

Check: `npx prisma migrate dev --name add_saved_searches` applies without resetting data; the table and
both unique indexes exist; `npm run typecheck` passes.

## T2. Query normalization

Pure function in `api/src/saved-searches/` that turns a raw catalog query string into the normalized one
(steps 1–4 of `plan.md`) and validates it with `PublicListingsDto` (step 5).

Check: unit tests for dropping `page`/unknown keys, empty values, default sort, `rooms` order and repeats,
key order, and an invalid value reported as invalid.

## T3. Service

`SavedSearchesService`: create (limit 10, default name «Поиск N» with the smallest free N, duplicate query,
duplicate name ignoring case and spaces), list with `isOutdated`, delete own, resolve by token.

Check: service spec covers each rule with a success and a refusal case; `npm run test:api` passes.

## T4. API routes

DTO `CreateSavedSearchDto`; four routes in `public/public.controller.ts` with Swagger metadata;
module wiring.

Check, with requests to the running API as a client:
create → 201; same query → 409 `SAVED_SEARCH_DUPLICATE_QUERY`; same name in another case → 409
`SAVED_SEARCH_DUPLICATE_NAME`; 11th → 422 `SAVED_SEARCH_LIMIT`; list shows `isOutdated`; delete own → 200,
someone else's → 404; `by-token` without a token in the header → only `query` and `isOutdated`; agent → 403.

## T5. Web data layer

`entities/saved-search`: types, `api/keys.ts`, server fetch, server actions (create, delete), query and
delete hooks; route handler `app/api/saved-searches` → `_app/api-routes/saved-searches`.

Check: `npm run lint:web`, `npm run typecheck`.

## T6. Save form

`features/saved-search-save/SaveSearchForm.tsx` + `.module.scss`, rendered by `_pages/listings/ListingsPage.tsx`
next to the filter panel.

Check in the browser: save with and without a name; duplicate query, duplicate name and limit show Russian
messages; a guest goes to login and back; saving on a district page stores `districtId`; light and dark
theme; phone width.

## T7. Account list

`_pages/saved-searches/SavedSearchesList.tsx` + `.module.scss`, tab «Сохранённые поиски» in
`AccountTabs`, page `app/account/searches/page.tsx`. Styling matches `AccountTabs` / `ViewingsList`.

Check in the browser: picking a search opens `/listings` with the saved parameters and Back returns to the
list (criterion 1); an outdated search shows «Поиск устарел» (criterion 7); delete removes it without reload
(criterion 8).

## T8. Public link page

`app/searches/[token]/page.tsx`: redirect to `/listings?<query>`, «Поиск устарел» for an outdated search,
404 for an unknown token.

Check in a private window: the link shows the same listings as `/listings` with those parameters
(criterion 2); outdated and unknown tokens behave as described.

## T9. Final checks

`npm run format:check`, `npm run lint:api`, `npm run lint:web`, `npm --prefix web run lint:css`,
`npm run typecheck`, `npm run test:api`; all eight acceptance criteria by hand. Differences from the spec go
into the PR description.
