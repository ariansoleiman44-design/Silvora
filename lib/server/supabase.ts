import { reportError } from "@/lib/observability";

/**
 * SUPABASE OVER REST — NO SDK
 * --------------------------------------------------------------------
 * Supabase exposes every table through PostgREST, which is plain HTTP
 * with JSON. So this is `fetch` and nothing else: the project has held
 * at exactly five runtime dependencies since V1 and an admin panel is
 * not a good reason to break that.
 *
 * WHAT YOU GIVE UP by not using @supabase/supabase-js: realtime
 * subscriptions, auth helpers and storage. The admin panel needs none
 * of them — it reads and writes rows.
 *
 * KEYS. `SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security and is
 * therefore a full-database credential. It is read here, in a module
 * that only ever runs on the server, and must never be given a
 * NEXT_PUBLIC_ name. If you ever need browser access, add a separate
 * anon key and real RLS policies — do not reach for this one.
 *
 * FAILURE. Every call throws `SupabaseError` on a non-2xx response with
 * the status and PostgREST's message. Callers decide what a failure
 * means: for the quote store it means the submission failed and the
 * buyer must be told, which is the rule the whole RFQ path is built on.
 */

const REQUEST_TIMEOUT_MS = 8_000;

export class SupabaseError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: string,
  ) {
    super(message);
    this.name = "SupabaseError";
  }
}

const env = (key: string): string => (process.env[key] ?? "").trim();

function credentials(): { url: string; key: string } | null {
  const url = env("SUPABASE_URL").replace(/\/+$/, "");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return { url, key };
}

/**
 * True when a database is actually reachable-in-principle. Used by the
 * launch audit and by the admin panel, which refuses to pretend it has
 * storage it does not have.
 */
export function isSupabaseConfigured(): boolean {
  return credentials() !== null;
}

/* ------------------------------------------------------------------ */
/* Query shape                                                         */
/* ------------------------------------------------------------------ */

export type FilterValue = string | number | boolean | null;

export interface Query {
  /** Columns to return, PostgREST syntax. Defaults to "*". */
  select?: string;
  /**
   * Column filters. ALWAYS equality, always escaped. A value here can
   * never be interpreted as a PostgREST operator, however it is spelt.
   */
  where?: Record<string, FilterValue>;
  /**
   * Raw PostgREST filter expressions, passed through verbatim —
   * `{ or: "(a.ilike.*x*,b.ilike.*x*)" }`.
   *
   * NEVER BUILD ONE OF THESE FROM USER INPUT without escaping the
   * values first (see `quoteFilterValue`). This escape hatch exists
   * only for expressions this codebase constructs itself.
   */
  raw?: Record<string, string>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

/**
 * Every `where` value is emitted as an equality match.
 *
 * It used to pass a value through untouched when it looked like an
 * operator (`^(eq|neq|gt|gte|lt|lte|…)\.`). That turned any externally
 * supplied identifier into a query operator: a request reference of
 * "gt.A" produced `reference=gt.A`, a range filter that matched the
 * first row in the table rather than nothing, so an admin detail page
 * would render an unrelated buyer's record. Route parameters reach this
 * function directly, so the passthrough was an injection point and is
 * gone. Internally-built expressions use `raw` instead.
 */
function encodeFilter(value: FilterValue): string {
  if (value === null) return "is.null";
  /*
   * The `eq.` prefix is the whole defence, and it is sufficient.
   * PostgREST splits `column=operator.value` on the FIRST dot, so
   * everything after `eq.` is read as a literal: `reference=eq.gt.A`
   * matches the string "gt.A" and nothing else. Verified against the
   * live database, along with the old behaviour it replaces —
   * `reference=gt.A` really did return an unrelated row.
   *
   * Do NOT wrap this in double quotes. PostgREST does not strip them
   * for `eq.`; it searches for a value that literally contains them, so
   * quoting here silently breaks every exact-match lookup. (It IS
   * required inside `or=` — see quoteFilterValue.)
   */
  return `eq.${String(value)}`;
}

/**
 * Wrap a value as a PostgREST quoted literal, for use INSIDE a logical
 * expression such as `or=(a.ilike."…",b.ilike."…")`, where commas,
 * dots and parentheses are syntax rather than content.
 *
 * Not for `where` values — see encodeFilter above.
 */
export function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildSearchParams(query: Query = {}): URLSearchParams {
  const params = new URLSearchParams();
  params.set("select", query.select ?? "*");
  for (const [column, value] of Object.entries(query.where ?? {})) {
    params.append(column, encodeFilter(value));
  }
  for (const [column, expression] of Object.entries(query.raw ?? {})) {
    params.append(column, expression);
  }
  if (query.order) {
    params.set("order", `${query.order.column}.${query.order.ascending ? "asc" : "desc"}`);
  }
  if (typeof query.limit === "number") params.set("limit", String(query.limit));
  if (typeof query.offset === "number") params.set("offset", String(query.offset));
  return params;
}

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

interface RequestOptions {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  table: string;
  query?: Query;
  body?: unknown;
  /** Extra PostgREST `Prefer` directives. */
  prefer?: string[];
  /** Upsert conflict target, e.g. "slug,locale". */
  onConflict?: string;
}

async function request<T>(options: RequestOptions): Promise<{ rows: T[]; total: number | null }> {
  const creds = credentials();
  if (!creds) {
    throw new SupabaseError("Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)", 0);
  }

  const params = buildSearchParams(options.query);
  if (options.onConflict) params.set("on_conflict", options.onConflict);

  const prefer = [...(options.prefer ?? [])];
  if (options.onConflict) prefer.push("resolution=merge-duplicates");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${creds.url}/rest/v1/${options.table}?${params}`, {
      method: options.method,
      headers: {
        apikey: creds.key,
        Authorization: `Bearer ${creds.key}`,
        "Content-Type": "application/json",
        ...(prefer.length ? { Prefer: prefer.join(",") } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      // Admin data is never cached: a stale RFQ list is worse than a slow one.
      cache: "no-store",
    });
  } catch (error) {
    clearTimeout(timer);
    const aborted = error instanceof Error && error.name === "AbortError";
    throw new SupabaseError(
      aborted ? `Supabase request timed out after ${REQUEST_TIMEOUT_MS}ms` : "Supabase request failed",
      0,
      error instanceof Error ? error.message : undefined,
    );
  }
  clearTimeout(timer);

  if (!response.ok) {
    // PostgREST returns { message, details, hint, code }.
    let message = `Supabase returned ${response.status}`;
    let details: string | undefined;
    try {
      const problem = (await response.json()) as { message?: string; details?: string };
      if (problem.message) message = problem.message;
      details = problem.details;
    } catch {
      /* Non-JSON error body — keep the status line. */
    }
    throw new SupabaseError(message, response.status, details);
  }

  // `count=exact` puts the total after the slash in Content-Range: "0-24/391".
  const range = response.headers.get("content-range");
  const total = range?.includes("/") ? Number(range.split("/")[1]) : null;

  if (response.status === 204) return { rows: [], total };
  const text = await response.text();
  if (!text) return { rows: [], total };

  const parsed = JSON.parse(text) as T | T[];
  return { rows: Array.isArray(parsed) ? parsed : [parsed], total: Number.isFinite(total) ? total : null };
}

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

/** Read rows. */
export async function selectRows<T>(table: string, query: Query = {}): Promise<T[]> {
  const { rows } = await request<T>({ method: "GET", table, query });
  return rows;
}

/** Read one row, or null when nothing matches. */
export async function selectOne<T>(table: string, query: Query = {}): Promise<T | null> {
  const rows = await selectRows<T>(table, { ...query, limit: 1 });
  return rows[0] ?? null;
}

/** Read a page of rows together with the unpaged total, for pagination. */
export async function selectPage<T>(
  table: string,
  query: Query = {},
): Promise<{ rows: T[]; total: number }> {
  const { rows, total } = await request<T>({
    method: "GET",
    table,
    query,
    prefer: ["count=exact"],
  });
  return { rows, total: total ?? rows.length };
}

/** Count matching rows without transferring them. */
export async function countRows(table: string, where: Query["where"] = {}): Promise<number> {
  const { total } = await request<unknown>({
    method: "GET",
    table,
    // Only the Content-Range header is read. `limit: 1` keeps the body
    // to a single row; naming a column here instead would break on any
    // table that does not have it.
    query: { where, limit: 1 },
    prefer: ["count=exact"],
  });
  return total ?? 0;
}

/** Insert rows and return them. */
export async function insertRows<T>(table: string, rows: unknown[]): Promise<T[]> {
  const result = await request<T>({
    method: "POST",
    table,
    body: rows,
    prefer: ["return=representation"],
  });
  return result.rows;
}

/**
 * Insert or update on a conflict target, e.g. `onConflict: "slug,locale"`.
 * The target must have a unique index or PostgREST rejects the request.
 */
export async function upsertRows<T>(table: string, rows: unknown[], onConflict: string): Promise<T[]> {
  const result = await request<T>({
    method: "POST",
    table,
    body: rows,
    onConflict,
    prefer: ["return=representation"],
  });
  return result.rows;
}

/** Patch every row matching `where`. */
export async function updateRows<T>(
  table: string,
  patch: Record<string, unknown>,
  where: Query["where"],
): Promise<T[]> {
  const result = await request<T>({
    method: "PATCH",
    table,
    query: { where },
    body: patch,
    prefer: ["return=representation"],
  });
  return result.rows;
}

/** Delete every row matching `where`. */
export async function deleteRows(table: string, where: Query["where"]): Promise<void> {
  await request<unknown>({ method: "DELETE", table, query: { where } });
}

/**
 * Run a read and fall back to a default instead of throwing. For admin
 * screens where one broken panel should not take down the whole page —
 * never for writes, and never on the RFQ submission path.
 */
export async function safeRead<T>(operation: () => Promise<T>, fallback: T, scope: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    reportError(error, { scope, category: "supabase-read" });
    return fallback;
  }
}
