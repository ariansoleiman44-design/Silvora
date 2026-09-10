import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CONTACT_STATUSES, getContact } from "@/lib/server/admin-data";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { NoDatabase, StatusPill, When } from "../../ui";
import { updateContactNote, updateContactStatus } from "../actions";

export const metadata: Metadata = { title: "Enquiry" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="diff-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default async function ContactDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <>
        <h1 className="admin-h1">Enquiry</h1>
        <NoDatabase what="This enquiry" />
      </>
    );
  }

  const row = await getContact(id);
  if (!row) notFound();

  const payload = (row.payload ?? {}) as Record<string, unknown>;
  const message = typeof payload.message === "string" ? payload.message : "";
  const country = typeof payload.country === "string" ? payload.country : "";
  const city = typeof payload.city === "string" ? payload.city : "";
  const reference = typeof payload.reference === "string" ? payload.reference : "";

  return (
    <>
      <p className="admin-foot" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
        <Link href="/admin/contacts">← Enquiries</Link>
      </p>

      <h1 className="admin-h1">{row.name || "Enquiry"}</h1>
      <p className="admin-sub">
        <StatusPill status={row.status} /> · received <When value={row.created_at} />
        {reference && <span className="admin-mono"> · {reference}</span>}
      </p>

      <div className="admin-split">
        <div>
          <div className="admin-card">
            <h2 className="admin-h2" style={{ marginTop: 0 }}>
              Sender
            </h2>
            <Row label="Name" value={row.name} />
            <Row label="Company" value={row.company} />
            <Row
              label="Phone"
              value={row.phone ? <a href={`tel:${row.phone}`}>{row.phone}</a> : null}
            />
            <Row
              label="Email"
              value={
                row.email ? (
                  <a href={`mailto:${row.email}?subject=${encodeURIComponent(row.subject ?? "Your enquiry")}`}>
                    {row.email}
                  </a>
                ) : null
              }
            />
            <Row label="Location" value={[city, country].filter(Boolean).join(", ")} />
          </div>

          <div className="admin-card" style={{ marginTop: 20 }}>
            <h2 className="admin-h2" style={{ marginTop: 0 }}>
              Message
            </h2>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message || "—"}</p>
          </div>
        </div>

        <aside>
          <div className="admin-card">
            <h2 className="admin-h2" style={{ marginTop: 0 }}>
              Status
            </h2>
            <form action={updateContactStatus}>
              <input type="hidden" name="id" value={row.id} />
              <label className="admin-field">
                <span>Move to</span>
                <select name="status" defaultValue={row.status}>
                  {CONTACT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="admin-btn" style={{ width: "100%" }}>
                Save status
              </button>
            </form>
          </div>

          <div className="admin-card" style={{ marginTop: 16 }}>
            <h2 className="admin-h2" style={{ marginTop: 0 }}>
              Internal note
            </h2>
            <form action={updateContactNote}>
              <input type="hidden" name="id" value={row.id} />
              <label className="admin-field">
                <span>Staff only — the sender never sees this</span>
                <textarea name="note" defaultValue={row.internal_note} maxLength={4000} />
              </label>
              <button type="submit" className="admin-btn admin-btn-ghost" style={{ width: "100%" }}>
                Save note
              </button>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}
