-- Corn Fodder — admin panel schema
-- ---------------------------------------------------------------------
-- Paste this into the Supabase SQL editor once, then set SUPABASE_URL
-- and SUPABASE_SERVICE_ROLE_KEY in the deployment environment.
--
-- ROW LEVEL SECURITY IS ON AND NO POLICIES ARE CREATED. That is
-- deliberate: with RLS enabled and no policy, the anon key can read and
-- write nothing at all. Every access in this app goes through the
-- service-role key on the server, which bypasses RLS. If you later add
-- browser access, write real policies then — do not disable RLS.

-- =====================================================================
-- Quote requests — the RFQ inbox
-- =====================================================================

create table if not exists public.quote_requests (
  -- The human-facing reference, e.g. "CF-260906-4KX2". It is the
  -- primary key so a retried submission with the same reference cannot
  -- create a duplicate row: the store uses ON CONFLICT DO NOTHING.
  reference     text primary key,
  created_at    timestamptz not null default now(),
  received_at   timestamptz not null default now(),
  status        text not null default 'new'
                  check (status in ('new','reviewing','quoted','won','lost','spam')),
  order_type    text,
  company       text,
  buyer_name    text,
  buyer_email   text,
  buyer_phone   text,
  country       text,
  -- Line-item count, denormalised so the inbox list does not have to
  -- open the payload of every row to show it.
  line_count    integer not null default 0,
  -- The complete validated QuoteRequest exactly as submitted. The
  -- columns above are extracted copies for filtering and sorting; this
  -- is the record of truth and must never be edited by the panel.
  payload       jsonb not null,
  -- Staff-only. Never shown to the buyer, never leaves the panel.
  internal_note text not null default '',
  -- Deduplicates a retried submission. Unique where present, so the
  -- same key can never produce two rows; see 002-idempotency.sql for
  -- why this cannot live in server memory.
  idempotency_key text,
  updated_at    timestamptz not null default now()
);

create unique index if not exists quote_requests_idempotency_idx
  on public.quote_requests (idempotency_key)
  where idempotency_key is not null;

create index if not exists quote_requests_created_idx on public.quote_requests (created_at desc);
create index if not exists quote_requests_status_idx  on public.quote_requests (status, created_at desc);
create index if not exists quote_requests_company_idx on public.quote_requests (lower(company));

alter table public.quote_requests enable row level security;

-- =====================================================================
-- Contact requests — the general enquiry form
-- =====================================================================

create table if not exists public.contact_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  status        text not null default 'new'
                  check (status in ('new','replied','closed','spam')),
  name          text,
  company       text,
  email         text,
  phone         text,
  subject       text,
  payload       jsonb not null,
  internal_note text not null default '',
  idempotency_key text,
  updated_at    timestamptz not null default now()
);

create unique index if not exists contact_requests_idempotency_idx
  on public.contact_requests (idempotency_key)
  where idempotency_key is not null;

create index if not exists contact_requests_created_idx on public.contact_requests (created_at desc);

alter table public.contact_requests enable row level security;

-- =====================================================================
-- Product overrides — admin edits layered over the code catalogue
-- =====================================================================
--
-- This table does NOT hold products. data/products.ts is still the
-- source of truth and an empty table means the site renders exactly
-- what is committed to git. A row is a PATCH: only the fields an editor
-- actually changed. Deleting a row reverts that product, in that
-- locale, to the code default.
--
-- `locale` is 'en' for the base catalogue, or one of the translation
-- locales. The (slug, locale) pair is unique so the panel can upsert.

create table if not exists public.product_overrides (
  slug        text not null,
  locale      text not null check (locale in ('en','ar','ckb','kmr')),
  -- Only the changed fields, e.g. {"availability":"limited","tagline":"…"}.
  -- Measurements and `demo` flags are stripped before write — see
  -- lib/server/product-overrides.ts.
  patch       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text not null default 'admin',
  primary key (slug, locale)
);

alter table public.product_overrides enable row level security;

-- =====================================================================
-- Audit log — every write the panel makes
-- =====================================================================

create table if not exists public.audit_log (
  id        bigserial primary key,
  at        timestamptz not null default now(),
  -- Who acted. With a shared admin password this is always 'admin';
  -- it becomes meaningful if per-person accounts are added later.
  actor     text not null default 'admin',
  action    text not null,           -- 'quote.status', 'product.publish', 'product.reset', 'auth.login'…
  target    text not null,           -- reference, slug:locale, or '-'
  -- Enough to reconstruct what changed, never the full buyer payload.
  before    jsonb,
  after     jsonb
);

create index if not exists audit_log_at_idx on public.audit_log (at desc);

alter table public.audit_log enable row level security;

-- =====================================================================
-- Keep updated_at honest
-- =====================================================================

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quote_requests_touch on public.quote_requests;
create trigger quote_requests_touch before update on public.quote_requests
  for each row execute function public.touch_updated_at();

drop trigger if exists contact_requests_touch on public.contact_requests;
create trigger contact_requests_touch before update on public.contact_requests
  for each row execute function public.touch_updated_at();

drop trigger if exists product_overrides_touch on public.product_overrides;
create trigger product_overrides_touch before update on public.product_overrides
  for each row execute function public.touch_updated_at();
