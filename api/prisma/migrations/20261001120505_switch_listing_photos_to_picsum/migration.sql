-- loremflickr answers non-browser requests (the Next image optimizer) with a bot check (401).
-- Same lock value -> same picsum seed, so each photo stays stable across requests.
UPDATE "ListingPhotos"
SET "externalUrl" = regexp_replace(
    "externalUrl",
    '^https://loremflickr\.com/([0-9]+)/([0-9]+)/[a-z]+\?lock=([0-9]+)$',
    'https://picsum.photos/seed/\3/\1/\2'
)
WHERE "externalUrl" ~ '^https://loremflickr\.com/[0-9]+/[0-9]+/[a-z]+\?lock=[0-9]+$';
