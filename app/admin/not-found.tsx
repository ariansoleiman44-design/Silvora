import Link from "next/link";

/**
 * A missing record inside the panel.
 *
 * Without this, notFound() rendered the PUBLIC 404 page — marketing
 * navigation, marketing fonts, no way back into the admin — which is a
 * disorienting place to land after mistyping a reference.
 */
export default function AdminNotFound() {
  return (
    <div className="admin-card" style={{ maxWidth: 620, margin: "40px auto" }}>
      <h1 className="admin-h1">Not found</h1>
      <p className="admin-sub">
        That record does not exist. It may have been deleted, or the reference may be mistyped.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <Link className="admin-btn" href="/admin/requests">
          All requests
        </Link>
        <Link className="admin-btn admin-btn-ghost" href="/admin">
          Overview
        </Link>
      </div>
    </div>
  );
}
