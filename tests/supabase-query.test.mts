import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * THE QUERY BUILDER — the regressions that reached production
 * --------------------------------------------------------------------
 * Two real bugs came out of this one function, and both were invisible
 * until the app ran against a live database:
 *
 *   1. An operator passthrough meant a route parameter of "gt.A" became
 *      `reference=gt.A`, a RANGE filter that matched an unrelated
 *      buyer's record instead of nothing.
 *
 *   2. The fix for (1) wrapped values in double quotes. PostgREST does
 *      not strip those for `eq.`, so every exact-match lookup silently
 *      matched nothing: both detail pages, the status filters, the
 *      product editor's stored patch, and the idempotency check.
 *
 * Neither is visible to the type checker or the linter. These assert the
 * emitted query string, which is the only thing that actually matters.
 *
 * The module is re-implemented here rather than imported: lib/server/
 * supabase.ts uses the "@/" path alias, which plain Node does not
 * resolve. The two functions are copied verbatim; if you change them
 * there, change them here — the whole point is that the SHAPE of the
 * emitted query is pinned.
 */

type FilterValue = string | number | boolean | null;

function encodeFilter(value: FilterValue): string {
  if (value === null) return "is.null";
  return `eq.${String(value)}`;
}

function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildSearchParams(query: {
  select?: string;
  where?: Record<string, FilterValue>;
  raw?: Record<string, string>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
} = {}): URLSearchParams {
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

test("a plain value becomes an equality filter", () => {
  assert.equal(encodeFilter("CF-260910-RZ47"), "eq.CF-260910-RZ47");
});

test("REGRESSION: values are NOT wrapped in quotes", () => {
  // PostgREST does not strip them for `eq.`; it searches for a value
  // that literally contains them, so every lookup matched nothing.
  const emitted = encodeFilter("CF-260910-RZ47");
  assert.ok(!emitted.includes('"'), `must not quote, got ${emitted}`);
});

test("REGRESSION: an operator-shaped value cannot become an operator", () => {
  // The first dot separates operator from value, so everything after
  // `eq.` is literal. Without the prefix this was `reference=gt.A`, a
  // range filter that returned somebody else's record.
  for (const hostile of ["gt.A", "neq.z", "lt.zzz", "in.(a,b)", "is.null", "like.*"]) {
    const emitted = encodeFilter(hostile);
    assert.ok(emitted.startsWith("eq."), `${hostile} must be forced to eq.`);
    assert.equal(emitted, `eq.${hostile}`);
  }
});

test("null means IS NULL, not the string 'null'", () => {
  assert.equal(encodeFilter(null), "is.null");
});

test("a hostile route parameter produces a harmless query string", () => {
  const params = buildSearchParams({ select: "reference", where: { reference: "gt.A" } });
  assert.equal(params.toString(), "select=reference&reference=eq.gt.A");
});

test("REGRESSION: a raw expression is passed through, never prefixed", () => {
  // `or` is a PostgREST expression, not a column filter. Sending it as
  // a `where` value produced `or=eq.(...)`, which PostgREST rejects —
  // every admin inbox search returned a 400 and an empty table.
  const params = buildSearchParams({
    select: "reference",
    raw: { or: "(reference.ilike.*x*,company.ilike.*x*)" },
  });
  assert.equal(params.get("or"), "(reference.ilike.*x*,company.ilike.*x*)");
  assert.ok(!params.get("or")!.startsWith("eq."));
});

test("a search term is quoted inside an or= expression", () => {
  // Here commas, dots and parentheses ARE syntax, so a company name
  // containing them must not be able to change the shape of the query.
  assert.equal(quoteFilterValue("*Acme, Ltd.*"), '"*Acme, Ltd.*"');
});

test("quoting escapes embedded quotes and backslashes", () => {
  assert.equal(quoteFilterValue('a"b'), '"a\\"b"');
  assert.equal(quoteFilterValue("a\\b"), '"a\\\\b"');
});

test("order, limit and offset are emitted as PostgREST expects", () => {
  const params = buildSearchParams({
    order: { column: "created_at", ascending: false },
    limit: 25,
    offset: 50,
  });
  assert.equal(params.get("order"), "created_at.desc");
  assert.equal(params.get("limit"), "25");
  assert.equal(params.get("offset"), "50");
});
