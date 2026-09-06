import Link from "next/link";
import type { Metadata } from "next";
import { listQuotes, QUOTE_STATUSES, isQuoteStatus } from "@/lib/server/admin-data";
import { isSupabaseConfigured, SupabaseError } from "@/lib/server/supabase";
import { Empty, NoDatabase, ReadFailed, StatusPill, When } from "../ui";

export const metadata: Metadata = { title: "Requests" };

interface Search {
  status?: string;
  q?: string;
  page?: string;
}

/** Keep the current filters when moving between pages. */
function pageHref(current: Search, page: number): string {
  const params = new URLSearchParams();
  if (current.status) params.set("status", current.status);
  if (current.q) params.set("q", current.q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/requests?${query}` : "/admin/requests";
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <>
        <h1 className="admin-h1">Requests</h1>
        <NoDatabase what="Quote requests" />
      </>
    );
  }

  const status = isQuoteStatus(params.status) ? params.status : "all";
  const search = params.q ?? "";
  const page = Number(params.page) || 1;

  let result: Awaited<ReturnType<typeof listQuotes>> | null = null;
  let failure: string | null = null;
  try {
    result = await listQuotes({ status, search, page });
  } catch (error) {
    failure = error instanceof SupabaseError ? `${error.message} (${error.status})` : String(error);
  }

  return (
    <>
      <h1 className="admin-h1">Requests</h1>
      <p className="admin-sub">{result ? `${result.total} matching` : "Quote requests"}</p>

      {/*
        A plain GET form: the filters end up in the URL, so a filtered
        inbox can be bookmarked, shared with a colleague and reloaded
        without re-typing. No client JavaScript involved.
      */}
      <form className="admin-toolbar" method="get">
        <label className="admin-field">
          <span>Search</span>
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Reference, company, name, email, phone"
            style={{ minWidth: 280 }}
          />
        </label>
        <label className="admin-field">
          <span>Status</span>
          <select name="status" defaultValue={status}>
            <option value="all">All</option>
            {QUOTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="admin-btn">
          Filter
        </button>
        {(search || status !== "all") && (
          <Link href="/admin/requests" className="admin-btn admin-btn-ghost">
            Clear
          </Link>
        )}
        <span style={{ flex: 1 }} />
        <a
          className="admin-btn admin-btn-ghost"
          href={`/admin/export${status !== "all" ? `?status=${status}` : ""}`}
        >
          Export CSV
        </a>
      </form>

      {failure && <ReadFailed detail={failure} />}

      {result && result.rows.length === 0 && (
        <Empty>
          {search || status !== "all"
            ? "No requests match those filters."
            : "Nothing yet. Requests appear here the moment the public form is submitted."}
        </Empty>
      )}

      {result && result.rows.length > 0 && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Received</th>
                  <th>Company</th>
                  <th>Buyer</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Lines</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.reference}>
                    <td>
                      <Link href={`/admin/requests/${row.reference}`} className="admin-mono">
                        {row.reference}
                      </Link>
                    </td>
                    <td>
                      <When value={row.created_at} />
                    </td>
                    <td className="wrap">{row.company || "—"}</td>
                    <td className="wrap">{row.buyer_name || "—"}</td>
                    <td className="wrap">{row.buyer_phone || row.buyer_email || "—"}</td>
                    <td>{row.order_type || "—"}</td>
                    <td>{row.line_count}</td>
                    <td>
                      <StatusPill status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.pageCount > 1 && (
            <p className="admin-foot">
              {result.page > 1 && <Link href={pageHref(params, result.page - 1)}>← Previous</Link>}
              <span style={{ margin: "0 12px" }}>
                Page {result.page} of {result.pageCount}
              </span>
              {result.page < result.pageCount && (
                <Link href={pageHref(params, result.page + 1)}>Next →</Link>
              )}
            </p>
          )}
        </>
      )}
    </>
  );
}
