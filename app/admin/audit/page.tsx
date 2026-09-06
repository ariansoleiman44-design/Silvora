import type { Metadata } from "next";
import { listAudit } from "@/lib/server/admin-data";
import { isSupabaseConfigured, SupabaseError } from "@/lib/server/supabase";
import { Empty, NoDatabase, ReadFailed, When } from "../ui";

export const metadata: Metadata = { title: "Audit" };

/** Compact one-line summary of a before/after pair. */
function summarise(before: unknown, after: unknown): string {
  const parts: string[] = [];
  const b = before as Record<string, unknown> | null;
  const a = after as Record<string, unknown> | null;
  if (b && typeof b === "object") parts.push(`from ${JSON.stringify(b)}`);
  if (a && typeof a === "object") parts.push(`to ${JSON.stringify(a)}`);
  return parts.join(" ") || "—";
}

export default async function AuditPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <h1 className="admin-h1">Audit</h1>
        <NoDatabase what="The audit log" />
      </>
    );
  }

  let rows: Awaited<ReturnType<typeof listAudit>> = [];
  let failure: string | null = null;
  try {
    rows = await listAudit();
  } catch (error) {
    failure = error instanceof SupabaseError ? `${error.message} (${error.status})` : String(error);
  }

  return (
    <>
      <h1 className="admin-h1">Audit</h1>
      <p className="admin-sub">
        Every write the panel has made, newest first. The last 200 entries.
      </p>

      {/*
        Worth being honest about on the screen itself rather than only
        in a commit message: with one shared password there is no way
        to attribute an action to a person.
      */}
      <div className="notice notice-warn">
        <p>
          The panel uses one shared password, so every entry is recorded as{" "}
          <code>admin</code> rather than a named person.
        </p>
      </div>

      {failure && <ReadFailed detail={failure} />}

      {!failure && rows.length === 0 && <Empty>Nothing recorded yet.</Empty>}

      {rows.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <When value={row.at} />
                  </td>
                  <td>{row.actor}</td>
                  <td className="admin-mono">{row.action}</td>
                  <td className="admin-mono">{row.target}</td>
                  <td className="wrap admin-mono" style={{ fontSize: 11 }}>
                    {summarise(row.before, row.after)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
