import Link from "next/link";
import type { QuoteStatus } from "@/lib/server/admin-data";

/**
 * Small shared pieces for the admin screens. Server components, no
 * client JavaScript — the panel is tables and forms.
 */

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill pill-${status}`}>{status}</span>;
}

/**
 * Dates are rendered in a fixed, unambiguous format rather than the
 * viewer's locale: staff compare timestamps against each other and
 * against the buyer's email, and "06/09" meaning two different days to
 * two people is a real hazard in a logistics business.
 */
export function When({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="admin-mono">—</span>;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span className="admin-mono">—</span>;
  const iso = date.toISOString();
  return (
    <time dateTime={iso} className="admin-mono" title={iso}>
      {iso.slice(0, 10)} {iso.slice(11, 16)}
    </time>
  );
}

/** Shown wherever a screen needs the database and there isn't one. */
export function NoDatabase({ what }: { what: string }) {
  return (
    <div className="notice notice-warn">
      <p>
        <strong>No database connected.</strong> {what} cannot be shown.
      </p>
      <p>
        Run <code>docs/sql/001-init.sql</code> in Supabase, then set <code>SUPABASE_URL</code> and{" "}
        <code>SUPABASE_SERVICE_ROLE_KEY</code>.
      </p>
    </div>
  );
}

export function ReadFailed({ detail }: { detail: string }) {
  return (
    <div className="notice notice-error">
      <p>
        <strong>Could not read from the database.</strong>
      </p>
      <p className="admin-mono">{detail}</p>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-card" style={{ textAlign: "center", color: "var(--ink-soft)" }}>
      {children}
    </div>
  );
}

export function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <span className="admin-stat">
      <b>{value}</b>
      <span>{label}</span>
    </span>
  );
  return (
    <div className="admin-card">
      {href ? (
        <Link href={href} style={{ textDecoration: "none" }}>
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

/** The order statuses move through, for the detail-view control. */
export const STATUS_FLOW: QuoteStatus[] = ["new", "reviewing", "quoted", "won", "lost", "spam"];
