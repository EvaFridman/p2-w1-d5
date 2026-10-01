# 001 — Saved search

## Goal

A client saves the current set of catalog filters under a name and returns to it in one step.

## Context

Catalog filters live in the URL of `/listings` and are built in `web/src/features/listing-filter/catalog`:
`dealType`, `propertyType`, `districtId`, `rooms` (repeated), `priceMin`, `priceMax`, `areaMin`, `areaMax`,
`search`, `sortBy`, `sortOrder`, `page`. The API validates the same set in `ListListingsDto`.
A saved search stores this same query string; it does not introduce a second format.

## Scenarios

1. A client sets filters in the catalog, clicks «Сохранить поиск», optionally enters a name, and the
   search appears in their saved searches.
2. A client opens «Сохранённые поиски» in the account area, picks a search and lands on the catalog
   with its filters and sorting.
3. Anyone opens a saved search by its direct link and sees the same list as the catalog opened with
   those parameters.
4. A client deletes a saved search and it disappears from the list.
5. A guest clicks «Сохранить поиск» and is sent to the login page, returning to the catalog afterwards.
6. A client saves a search from a district page; it later opens on `/listings` with that `districtId`.
7. A saved search refers to a filter or value the catalog no longer supports; the client sees that the
   search is outdated and can delete it.

## Acceptance criteria

1. After picking a saved search, the catalog URL has the same filter and sort parameters as at saving
   time (no `page`), and the browser Back button returns to the previous page.
2. The direct link of a saved search, opened in a private window without logging in, shows the same
   listings as `/listings` opened with the saved parameters.
3. Saving a set of parameters already saved by this client (in any order, `rooms` in any order) creates
   no new record and shows an error message.
4. Saving under a name this client already uses creates no new record and shows an error message.
5. Saving without a name creates a search with a default numbered name.
6. With 10 saved searches, an 11th save creates no record and shows a message about the limit.
7. A search whose parameters the catalog no longer accepts is shown as «Поиск устарел» in the list and
   when opened by link, and the owner can delete it.
8. A deleted search disappears from the list without reloading the page; another client cannot delete it
   (the API answers 404).

## Out of scope

Notifications about new listings for a saved search; renaming; saved searches for agents and moderators.
