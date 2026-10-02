-- picsum.photos answers 403 to Russian IPs, so the server's image optimizer cannot fetch listing
-- photos. Points them at the 40 demo photos in api/public/demo (served at /static/demo through web).
-- Each listing gets its own mix by id and position. Only picsum URLs change; uploaded photos stay.
-- One-off, production only (deploy/README.md); the local stack keeps picsum, the originals are in
-- the database copy taken before the move.
\set ON_ERROR_STOP on
begin;

update "ListingPhotos"
set "externalUrl" = '/static/demo/'
  || lpad((("listingId" * 7 + coalesce("position", 0)) % 40 + 1)::text, 2, '0') || '.jpg'
where "externalUrl" like 'https://picsum.photos/%';

select count(*) filter (where "externalUrl" like '/static/demo/%') as demo,
       count(*) filter (where "externalUrl" like 'https://picsum.photos/%') as picsum_left
from "ListingPhotos";

commit;
