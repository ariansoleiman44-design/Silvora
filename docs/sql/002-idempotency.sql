-- Corn Fodder — durable idempotency
-- ---------------------------------------------------------------------
-- Run this AFTER 001-init.sql on an existing database. A fresh install
-- gets these columns from 001 directly.
--
-- WHY: idempotency used to live in a Map in the server process, keyed by
-- client IP, and was written only after every notifier had finished. On
-- more than one instance each held its own copy; behind a shared office
-- IP two different buyers collided; and because the browser aborts at
-- 20s while the server can still be sending mail at 32s, the retry
-- arrived BEFORE the key was ever recorded. The guarantee could not
-- hold. A unique column in the database is the only place it can.

alter table public.quote_requests
  add column if not exists idempotency_key text;

alter table public.contact_requests
  add column if not exists idempotency_key text;

-- Partial, so the many rows without a key do not collide with each other.
create unique index if not exists quote_requests_idempotency_idx
  on public.quote_requests (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists contact_requests_idempotency_idx
  on public.contact_requests (idempotency_key)
  where idempotency_key is not null;
