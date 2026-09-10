import type { QuoteRequest } from "@/types/quote";
import {
  countRows,
  deleteRows,
  insertRows,
  selectOne,
  selectPage,
  selectRows,
  updateRows,
} from "@/lib/server/supabase";

/**
 * ADMIN READS AND WRITES
 * --------------------------------------------------------------------
 * Every database call the panel makes goes through here, so the table
 * names and the row shapes live in one file.
 *
 * SERVER ONLY. Everything under lib/server/ runs with the service-role
 * key and must never be imported from a client component — the same
 * rule the existing quote-sinks and validate-quote modules follow. The
 * `server-only` package would enforce it at build time, but it would be
 * a sixth runtime dependency, so the convention is the directory name
 * and this notice.
 */

export const QUOTE_STATUSES = ["new", "reviewing", "quoted", "won", "lost", "spam"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const CONTACT_STATUSES = ["new", "replied", "closed", "spam"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export function isQuoteStatus(value: unknown): value is QuoteStatus {
  return typeof value === "string" && (QUOTE_STATUSES as readonly string[]).includes(value);
}

/** A row of `quote_requests`. `payload` is the submitted RFQ, untouched. */
export interface QuoteRow {
  reference: string;
  created_at: string;
  received_at: string;
  status: QuoteStatus;
  order_type: string | null;
  company: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  country: string | null;
  line_count: number;
  payload: QuoteRequest;
  internal_note: string;
  updated_at: string;
}

export interface ContactRow {
  id: string;
  created_at: string;
  status: ContactStatus;
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  subject: string | null;
  payload: Record<string, unknown>;
  internal_note: string;
}

export interface AuditRow {
  id: number;
  at: string;
  actor: string;
  action: string;
  target: string;
  before: unknown;
  after: unknown;
}

/* ------------------------------------------------------------------ */
/* Quote requests                                                      */
/* ------------------------------------------------------------------ */

export interface InboxFilter {
  status?: QuoteStatus | "all";
  orderType?: string;
  /** Matched against reference, company, buyer name, email and phone. */
  search?: string;
  page?: number;
  perPage?: number;
}

export const INBOX_PAGE_SIZE = 25;

/**
 * One page of the inbox plus the unpaged total.
 *
 * The list view never selects `payload`: a page of 25 RFQs would other-
 * wise transfer every line item, note and calculator estimate just to
 * render a table of names and dates. The detail view reads it.
 */
export async function listQuotes(filter: InboxFilter = {}): Promise<{
  rows: QuoteRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const perPage = filter.perPage ?? INBOX_PAGE_SIZE;
  const page = Math.max(1, filter.page ?? 1);

  const where: Record<string, string> = {};
  if (filter.status && filter.status !== "all") where.status = filter.status;
  if (filter.orderType) where.order_type = filter.orderType;

  const search = filter.search?.trim();
  if (search) {
    // PostgREST `or=` with ilike on the columns a person would actually
    // type. `*` is the wildcard; commas and parens are stripped from the
    // term because they are the syntax separators of this expression.
    const term = search.replace(/[(),*]/g, "").slice(0, 80);
    if (term) {
      where.or = `(reference.ilike.*${term}*,company.ilike.*${term}*,buyer_name.ilike.*${term}*,buyer_email.ilike.*${term}*,buyer_phone.ilike.*${term}*)`;
    }
  }

  const { rows, total } = await selectPage<QuoteRow>("quote_requests", {
    select:
      "reference,created_at,received_at,status,order_type,company,buyer_name,buyer_email,buyer_phone,country,line_count,internal_note,updated_at",
    where,
    order: { column: "created_at", ascending: false },
    limit: perPage,
    offset: (page - 1) * perPage,
  });

  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getQuote(reference: string): Promise<QuoteRow | null> {
  return selectOne<QuoteRow>("quote_requests", { where: { reference } });
}

export async function setQuoteStatus(reference: string, status: QuoteStatus): Promise<void> {
  await updateRows("quote_requests", { status }, { reference });
}

export async function setQuoteNote(reference: string, note: string): Promise<void> {
  // Capped so a paste accident cannot write an unbounded value.
  await updateRows("quote_requests", { internal_note: note.slice(0, 4_000) }, { reference });
}

/** Counts per status for the dashboard, in one round trip per status. */
export async function quoteCounts(): Promise<Record<QuoteStatus | "total", number>> {
  const entries = await Promise.all(
    QUOTE_STATUSES.map(async (status) => [status, await countRows("quote_requests", { status })] as const),
  );
  const counts = Object.fromEntries(entries) as Record<QuoteStatus, number>;
  return { ...counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}

/**
 * Every quote matching a filter, for CSV export. Capped: an export is a
 * convenience, not a backup, and an unbounded query against a growing
 * table is how an admin page starts timing out.
 */
export const EXPORT_LIMIT = 2_000;

export async function quotesForExport(filter: InboxFilter = {}): Promise<QuoteRow[]> {
  const where: Record<string, string> = {};
  if (filter.status && filter.status !== "all") where.status = filter.status;

  return selectRows<QuoteRow>("quote_requests", {
    select:
      "reference,created_at,status,order_type,company,buyer_name,buyer_email,buyer_phone,country,line_count,internal_note",
    where,
    order: { column: "created_at", ascending: false },
    limit: EXPORT_LIMIT,
  });
}

/* ------------------------------------------------------------------ */
/* Contact requests                                                    */
/* ------------------------------------------------------------------ */

export const CONTACT_PAGE_SIZE = 25;

export function isContactStatus(value: unknown): value is ContactStatus {
  return typeof value === "string" && (CONTACT_STATUSES as readonly string[]).includes(value);
}

/**
 * One page of enquiries plus the unpaged total. Like the quote inbox,
 * `payload` is left out of the list query — the detail view reads it.
 */
export async function listContacts(filter: {
  status?: ContactStatus | "all";
  page?: number;
  perPage?: number;
} = {}): Promise<{ rows: ContactRow[]; total: number; page: number; pageCount: number }> {
  const perPage = filter.perPage ?? CONTACT_PAGE_SIZE;
  const page = Math.max(1, filter.page ?? 1);

  const where: Record<string, string> = {};
  if (filter.status && filter.status !== "all") where.status = filter.status;

  const { rows, total } = await selectPage<ContactRow>("contact_requests", {
    select: "id,created_at,status,name,company,email,phone,subject,internal_note",
    where,
    order: { column: "created_at", ascending: false },
    limit: perPage,
    offset: (page - 1) * perPage,
  });

  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getContact(id: string): Promise<ContactRow | null> {
  return selectOne<ContactRow>("contact_requests", { where: { id } });
}

export async function setContactStatus(id: string, status: ContactStatus): Promise<void> {
  await updateRows("contact_requests", { status }, { id });
}

export async function setContactNote(id: string, note: string): Promise<void> {
  await updateRows("contact_requests", { internal_note: note.slice(0, 4_000) }, { id });
}

/** New-enquiry count for the dashboard. */
export async function contactCounts(): Promise<Record<ContactStatus | "total", number>> {
  const entries = await Promise.all(
    CONTACT_STATUSES.map(async (status) => [status, await countRows("contact_requests", { status })] as const),
  );
  const counts = Object.fromEntries(entries) as Record<ContactStatus, number>;
  return { ...counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

/**
 * Record a change. Deliberately never throws: an audit write that fails
 * must not roll back or block the action the user actually asked for.
 * A missing audit line is a smaller problem than a status change that
 * appears to fail after it has already been applied.
 */
export async function recordAudit(entry: {
  action: string;
  target: string;
  before?: unknown;
  after?: unknown;
  actor?: string;
}): Promise<void> {
  try {
    await insertRows("audit_log", [
      {
        actor: entry.actor ?? "admin",
        action: entry.action,
        target: entry.target,
        before: entry.before ?? null,
        after: entry.after ?? null,
      },
    ]);
  } catch {
    /* Non-fatal by design — see above. */
  }
}

export async function listAudit(limit = 200): Promise<AuditRow[]> {
  return selectRows<AuditRow>("audit_log", {
    order: { column: "at", ascending: false },
    limit,
  });
}

/* ------------------------------------------------------------------ */
/* Product overrides                                                   */
/* ------------------------------------------------------------------ */

export interface OverrideRow {
  slug: string;
  locale: string;
  patch: Record<string, unknown>;
  updated_at: string;
  updated_by: string;
}

export async function listOverrides(): Promise<OverrideRow[]> {
  return selectRows<OverrideRow>("product_overrides", { order: { column: "slug", ascending: true } });
}

export async function getOverride(slug: string, locale: string): Promise<OverrideRow | null> {
  return selectOne<OverrideRow>("product_overrides", { where: { slug, locale } });
}

export async function deleteOverride(slug: string, locale: string): Promise<void> {
  await deleteRows("product_overrides", { slug, locale });
}
