# 001 — Saved search: clarifications

Answers are recorded as given by the project owner.

## Answered

1. **Storage: query string or separate fields?**
   Query string: the catalog's own URL format in one text column. Agreed.
2. **What goes into the saved set?**
   Filters and `sortBy`/`sortOrder`: yes. `page`: no.
3. **What counts as a duplicate, and what happens?**
   Both: the same parameter set (regardless of parameter order and `rooms` order) and the same name.
   On a duplicate: an error message.
4. **Saves per client?** 10.
5. **A saved search uses a filter or value the catalog no longer supports?**
   Show «Поиск устарел» and let the client delete it.
6. **Migration for a new table?**
   Yes.
7. **Name: required, length, same names?**
   Not required: if not given, a default name with an auto-incremented number. Up to 100 characters.
   No two searches of one client with the same name.
8. **Direct link: format and who can open it?**
   Anyone who has the link.
9. **Saving from a district page?**
   Allowed; opens later on `/listings?districtId=…`.
10. **Where in the UI?**
    A «Сохранить поиск» button in the catalog filter panel, and a «Сохранённые поиски» page in the
    account area next to «Избранное» and «Заявки».

11. **Link identifier.** Answer 8 makes the link public; with numeric ids anyone could walk
    `/searches/1`, `/searches/2`, … through every client's searches.
    A random token in the link instead of the id; the public endpoint returns only the parameters,
    not the name. Agreed.
12. **Name comparison: ignore case and surrounding spaces («Двушки» = « двушки »)?**
    Yes.
13. **Default name.**
    «Поиск N» with the smallest free N (with «Поиск 1» and «Поиск 3» taken, the next is «Поиск 2»). Agreed.

14. **Explicit sort: always store it, using the catalog defaults (`publishedAt`, `desc`) when the URL has
    none?** The catalog and the API have different defaults (`publishedAt` vs `createdAt`), so without this
    a URL with no sort and one with `sortBy=publishedAt&sortOrder=desc` would count as different searches.
    Yes.
