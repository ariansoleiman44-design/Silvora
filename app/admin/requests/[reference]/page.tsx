import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getQuote, QUOTE_STATUSES } from "@/lib/server/admin-data";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { NoDatabase, StatusPill, When } from "../../ui";
import { updateNote, updateStatus } from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  return { title: reference };
}

/** A labelled row, rendered only when there is something to show. */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "" ) return null;
  return (
    <div className="diff-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default async function RequestDetail({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <>
        <h1 className="admin-h1">{reference}</h1>
        <NoDatabase what="This request" />
      </>
    );
  }

  const row = await getQuote(reference);
  if (!row) notFound();

  const q = row.payload;
  const buyer = q?.buyer;

  return (
    <>
      <p className="admin-foot" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
        <Link href="/admin/requests">← Requests</Link>
      </p>

      <h1 className="admin-h1 admin-mono">{row.reference}</h1>
      <p className="admin-sub">
        <StatusPill status={row.status} /> · received <When value={row.created_at} />
      </p>

      <div className="admin-split">
        <div>
          <div className="admin-card">
            <h2 className="admin-h2" style={{ marginTop: 0 }}>
              Buyer
            </h2>
            <Row label="Name" value={buyer?.name} />
            <Row label="Company" value={row.company || buyer?.company} />
            <Row
              label="Phone"
              value={buyer?.phone ? <a href={`tel:${buyer.phone}`}>{buyer.phone}</a> : null}
            />
            <Row
              label="WhatsApp"
              value={
                buyer?.whatsapp ? (
                  <a
                    href={`https://wa.me/${buyer.whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {buyer.whatsapp}
                  </a>
                ) : null
              }
            />
            <Row
              label="Email"
              value={
                buyer?.email ? (
                  <a href={`mailto:${buyer.email}?subject=${encodeURIComponent(`Quote ${row.reference}`)}`}>
                    {buyer.email}
                  </a>
                ) : null
              }
            />
            <Row label="Order type" value={q?.orderType} />
            <Row label="Supply" value={q?.supplyMode} />
            <Row label="Frequency" value={q?.frequency ?? q?.frequencyNote} />
            <Row label="Marketing consent" value={q?.marketingConsent ? "yes" : "no"} />
            <Row label="Source" value={q?.source} />
          </div>

          <h2 className="admin-h2">Products ({q?.products?.length ?? 0})</h2>
          {q?.products?.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Format</th>
                    <th>Quantity</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {q.products.map((item) => (
                    <tr key={item.uid}>
                      <td className="wrap">
                        <Link href={`/products/${item.slug}`} target="_blank" rel="noreferrer">
                          {item.name}
                        </Link>
                      </td>
                      <td>{item.format}</td>
                      <td>{item.quantity}</td>
                      <td className="wrap">{item.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-sub">No product lines — this was a general enquiry.</p>
          )}

          <div className="admin-card" style={{ marginTop: 20 }}>
            <h2 className="admin-h2" style={{ marginTop: 0 }}>
              Delivery
            </h2>
            <Row label="Country" value={q?.delivery?.country} />
            <Row label="Region" value={q?.delivery?.region} />
            <Row label="Preferred date" value={q?.delivery?.preferredDate} />
            <Row label="Unload equipment" value={q?.delivery?.unloadEquipment} />
            <Row label="Notes" value={q?.delivery?.notes} />
          </div>

          {q?.notes && (
            <div className="admin-card" style={{ marginTop: 20 }}>
              <h2 className="admin-h2" style={{ marginTop: 0 }}>
                Buyer notes
              </h2>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{q.notes}</p>
            </div>
          )}
        </div>

        <aside>
          <div className="admin-card">
            <h2 className="admin-h2" style={{ marginTop: 0 }}>
              Status
            </h2>
            <form action={updateStatus}>
              <input type="hidden" name="reference" value={row.reference} />
              <label className="admin-field">
                <span>Move to</span>
                <select name="status" defaultValue={row.status}>
                  {QUOTE_STATUSES.map((s) => (
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
            <form action={updateNote}>
              <input type="hidden" name="reference" value={row.reference} />
              <label className="admin-field">
                <span>Staff only — the buyer never sees this</span>
                <textarea name="note" defaultValue={row.internal_note} maxLength={4000} />
              </label>
              <button type="submit" className="admin-btn admin-btn-ghost" style={{ width: "100%" }}>
                Save note
              </button>
            </form>
          </div>

          <details className="admin-card" style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>Raw submission</summary>
            <pre
              className="admin-mono"
              style={{ overflowX: "auto", marginBottom: 0, fontSize: 11, lineHeight: 1.45 }}
            >
              {JSON.stringify(q, null, 2)}
            </pre>
          </details>
        </aside>
      </div>
    </>
  );
}
