import Link from "next/link";
import type { Metadata } from "next";
import { listQuotes, quoteCounts } from "@/lib/server/admin-data";
import { isSupabaseConfigured, SupabaseError } from "@/lib/server/supabase";
import { isQuoteDeliveryConfigured } from "@/lib/server/quote-sinks";
import { Empty, NoDatabase, ReadFailed, StatusPill, Stat, When } from "./ui";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminHome() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <h1 className="admin-h1">Overview</h1>
        <NoDatabase what="Quote requests" />
      </>
    );
  }

  let counts: Awaited<ReturnType<typeof quoteCounts>> | null = null;
  let recent: Awaited<ReturnType<typeof listQuotes>> | null = null;
  let failure: string | null = null;

  try {
    [counts, recent] = await Promise.all([quoteCounts(), listQuotes({ perPage: 8 })]);
  } catch (error) {
    failure = error instanceof SupabaseError ? `${error.message} (${error.status})` : String(error);
  }

  if (failure || !counts || !recent) {
    return (
      <>
        <h1 className="admin-h1">Overview</h1>
        <ReadFailed detail={failure ?? "Unknown error"} />
      </>
    );
  }

  return (
    <>
      <h1 className="admin-h1">Overview</h1>
      <p className="admin-sub">{counts.total} quote requests stored.</p>

      {/*
        The store is what makes a submission succeed. If it is not
        configured the public form is refusing to submit at all, which
        is a far more urgent thing to know than any number below.
      */}
      {!isQuoteDeliveryConfigured() && (
        <div className="notice notice-error">
          <p>
            <strong>The public quote form is not accepting submissions.</strong> No store or
            notifier is configured, so the site refuses to report success it cannot back up.
          </p>
        </div>
      )}

      <div className="admin-grid admin-grid-4">
        <Stat label="New" value={counts.new} href="/admin/requests?status=new" />
        <Stat label="Reviewing" value={counts.reviewing} href="/admin/requests?status=reviewing" />
        <Stat label="Quoted" value={counts.quoted} href="/admin/requests?status=quoted" />
        <Stat label="Won" value={counts.won} href="/admin/requests?status=won" />
      </div>

      <h2 className="admin-h2">Latest requests</h2>
      {recent.rows.length === 0 ? (
        <Empty>
          Nothing yet. Requests appear here the moment the public form is submitted.
        </Empty>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Received</th>
                <th>Company</th>
                <th>Buyer</th>
                <th>Lines</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.rows.map((row) => (
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
                  <td>{row.line_count}</td>
                  <td>
                    <StatusPill status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="admin-foot">
        <Link href="/admin/requests">All requests →</Link>
      </p>
    </>
  );
}
