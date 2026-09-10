import Link from "next/link";
import type { Metadata } from "next";
import { CONTACT_STATUSES, isContactStatus, listContacts } from "@/lib/server/admin-data";
import { isSupabaseConfigured, SupabaseError } from "@/lib/server/supabase";
import { Empty, NoDatabase, ReadFailed, StatusPill, When } from "../ui";

export const metadata: Metadata = { title: "Enquiries" };

interface Search {
  status?: string;
  page?: string;
}

function pageHref(current: Search, page: number): string {
  const params = new URLSearchParams();
  if (current.status) params.set("status", current.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/contacts?${query}` : "/admin/contacts";
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <>
        <h1 className="admin-h1">Enquiries</h1>
        <NoDatabase what="Contact enquiries" />
      </>
    );
  }

  const status = isContactStatus(params.status) ? params.status : "all";
  const page = Number(params.page) || 1;

  let result: Awaited<ReturnType<typeof listContacts>> | null = null;
  let failure: string | null = null;
  try {
    result = await listContacts({ status, page });
  } catch (error) {
    failure = error instanceof SupabaseError ? `${error.message} (${error.status})` : String(error);
  }

  return (
    <>
      <h1 className="admin-h1">Enquiries</h1>
      <p className="admin-sub">
        {result ? `${result.total} matching` : "Messages from the contact form"} — these are
        general enquiries, not quote requests.
      </p>

      <form className="admin-toolbar" method="get">
        <label className="admin-field">
          <span>Status</span>
          <select name="status" defaultValue={status}>
            <option value="all">All</option>
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="admin-btn">
          Filter
        </button>
        {status !== "all" && (
          <Link href="/admin/contacts" className="admin-btn admin-btn-ghost">
            Clear
          </Link>
        )}
      </form>

      {failure && <ReadFailed detail={failure} />}

      {result && result.rows.length === 0 && (
        <Empty>
          {status !== "all"
            ? "No enquiries with that status."
            : "Nothing yet. Messages from the contact form appear here."}
        </Empty>
      )}

      {result && result.rows.length > 0 && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/admin/contacts/${row.id}`}>
                        <When value={row.created_at} />
                      </Link>
                    </td>
                    <td className="wrap">
                      <Link href={`/admin/contacts/${row.id}`}>{row.name || "—"}</Link>
                    </td>
                    <td className="wrap">{row.company || "—"}</td>
                    <td className="wrap">{row.phone || row.email || "—"}</td>
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
