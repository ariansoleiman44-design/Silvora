"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Error boundary for the whole panel.
 *
 * Without one, a thrown read — a database blip, a PostgREST 400, a
 * failed write action — escaped to Next's default error screen, which
 * has none of the admin styling, no navigation, and no indication of
 * which panel broke. An operator's only route back was the browser's
 * back button.
 *
 * It reports to the console rather than to the screen for the detail:
 * an error message from PostgREST can name columns and constraints, and
 * that belongs in the server log, not in the UI.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] unhandled error", error);
  }, [error]);

  const notAuthorised = error.message === "Not authorised.";

  return (
    <div className="admin-card" style={{ maxWidth: 620, margin: "40px auto" }}>
      <h1 className="admin-h1">{notAuthorised ? "Signed out" : "Something broke"}</h1>

      {notAuthorised ? (
        <p className="admin-sub">
          Your session has expired or was not accepted. Nothing was saved.
        </p>
      ) : (
        <p className="admin-sub">
          This screen could not be loaded. If it was a save, assume it did{" "}
          <strong>not</strong> go through and check before retrying.
        </p>
      )}

      {error.digest && (
        <p className="admin-mono" style={{ color: "var(--ink-soft)", fontSize: 12 }}>
          Reference: {error.digest}
        </p>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        {notAuthorised ? (
          <Link className="admin-btn" href="/admin/login">
            Sign in again
          </Link>
        ) : (
          <button type="button" className="admin-btn" onClick={reset}>
            Try again
          </button>
        )}
        <Link className="admin-btn admin-btn-ghost" href="/admin">
          Back to overview
        </Link>
      </div>
    </div>
  );
}
