# 001 — Saved search: plan

Based on `spec.md` and `clarifications.md` (answers 1–14). Follows the favorites feature end to end.

## Data and migration

New Prisma model `SavedSearches`, migration `add_saved_searches` (`npx prisma migrate dev`):

| Field                    | Type                          | Notes                                              |
| ------------------------ | ----------------------------- | -------------------------------------------------- |
| `id`                     | Int, PK                       | internal only, never in URLs                       |
| `userId`                 | Int → `Users`, cascade delete | owner                                              |
| `token`                  | String, unique                | random, for the public link (answer 11)            |
| `name`                   | String(100)                   | shown to the owner                                 |
| `nameKey`                | String(100)                   | `name` trimmed and lower-cased (answer 12)         |
| `query`                  | String                        | normalized catalog query string (answers 1, 2, 14) |
| `createdAt`, `updatedAt` | Timestamptz                   | as in other models                                 |

Unique indexes `(userId, nameKey)` and `(userId, query)` back the duplicate rule (answer 3) at the database level.

## Query normalization (single place: api service)

The client sends the current catalog query string as is. The service:

1. keeps only catalog parameters (`dealType`, `propertyType`, `districtId`, `rooms`, `priceMin`, `priceMax`,
   `areaMin`, `areaMax`, `search`, `sortBy`, `sortOrder`), dropping `page`, `limit` and anything else;
2. drops empty values, trims `search`;
3. fills `sortBy=publishedAt`, `sortOrder=desc` when missing (answer 14);
4. sorts `rooms` numerically and removes repeats, sorts keys alphabetically;
5. validates the result with the catalog's own `PublicListingsDto` (one format, answer 1).

The same validation, run when a search is read, decides whether it is outdated (answer 5).

## api (`api/src`)

- `saved-searches/saved-searches.service.ts` (+ module, exported): normalize, validate, create with limit 10
  (answer 4), default name «Поиск N» with the smallest free N (answer 13), duplicate checks, list, delete,
  resolve by token. Errors from `errors/app.exception.ts` with codes `SAVED_SEARCH_DUPLICATE_QUERY`,
  `SAVED_SEARCH_DUPLICATE_NAME` (409), `SAVED_SEARCH_LIMIT` (422); `NotFoundError` for a missing or foreign id.
- `saved-searches/dto/create-saved-search.dto.ts`: `query` (string, required), `name` (optional, ≤ 100).
- Routes in `public/public.controller.ts` (skill step 1: client routes live there), logic in the new service:

| Route                                        | Access             | Returns                                                    |
| -------------------------------------------- | ------------------ | ---------------------------------------------------------- |
| `GET /public/saved-searches`                 | `@Roles('client')` | own searches: `id`, `name`, `token`, `query`, `isOutdated` |
| `POST /public/saved-searches`                | `@Roles('client')` | created search, 201                                        |
| `DELETE /public/saved-searches/:id`          | `@Roles('client')` | 404 for a foreign or missing id (criterion 8)              |
| `GET /public/saved-searches/by-token/:token` | `@Public()`        | only `query` and `isOutdated`, no name (answer 11)         |

- Tests: service spec (normalization, both duplicates, limit, default name, outdated) and refusal cases.

## web (`web/src`, `web/app`)

| Layer    | File                                                                                                                                                                                    | Purpose                                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| entities | `saved-search/types.ts`, `api/keys.ts`, `api/index.ts` (server fetch), `api/actions.ts` (server actions: create, delete), `api/use-saved-searches.ts`, `api/use-delete-saved-search.ts` | data access, same pattern as `entities/favorites`                                                                                                            |
| features | `saved-search-save/SaveSearchForm.tsx` + `.module.scss`                                                                                                                                 | «Сохранить поиск» button with an optional name field; sends the current URL query; shows the API's error in Russian; a guest is sent to `/login?returnUrl=…` |
| _pages   | `listings/ListingsPage.tsx`                                                                                                                                                             | renders `SaveSearchForm` next to `ListingFilterPanel`; composing on the page avoids a feature-to-feature import                                              |
| _pages   | `saved-searches/SavedSearchesList.tsx` + `.module.scss`, `account/AccountTabs.tsx`                                                                                                      | list with links, «Поиск устарел» badge, delete; new tab «Сохранённые поиски»                                                                                 |
| app      | `account/searches/page.tsx`, `searches/[token]/page.tsx`, `api/saved-searches/route.ts` → `_app/api-routes/saved-searches/`                                                             | account page; public link page; client refetch                                                                                                               |

Navigation behavior:

- From the account list, each search is a `Link` to `/listings?<query>`: a normal navigation, so Back returns
  to the list (criterion 1).
- `/searches/<token>` resolves the token on the server and `redirect`s to `/listings?<query>`; for an outdated
  search it renders «Поиск устарел» instead (criterion 7). An unknown token shows the 404 page.
- A search saved on `/districts/[slug]` includes its `districtId` and opens on `/listings` (answer 9).
- The query key comes from `entities/saved-search/api/keys.ts`; after delete, the list is invalidated, no
  page reload (criterion 8).

## Styles

- New components get `.module.scss` (the format the d2 SCSS release moved to), not `.module.css`.
- Colors, spacing, radii and font sizes only through the CSS variables in `web/app/globals.scss`
  (`--space-*`, `--color-*`, `--radius-*`, `--font-size-*`), so light and dark themes work without extra code.
  No hard-coded colors.
- Responsive rules through `@use "@/shared/styles" as s` (`s.from(tablet)`, `s.upto(tablet)`); long names
  through `s.line-clamp()`.
- Look and spacing follow the current site, not the landing design artifact (owner's decision): `SaveSearchForm` matches the filter panel
  (`ListingsFilter.module.scss`); the list and badge match `ViewingsList` and `AccountTabs`.
- Layout must work at phone width: the name field and button stack below `tablet`.
- `npm --prefix web run lint:css` (Stylelint, `standard-scss` + `clean-order`) passes on the new files.

## Checks

`npm run format:check`, `npm run lint:api`, `npm run lint:web`, `npm --prefix web run lint:css`,
`npm run typecheck`, `npm run test:api`; then each acceptance criterion by hand in the browser (light and dark
theme, desktop and phone width) and with requests to the API.
