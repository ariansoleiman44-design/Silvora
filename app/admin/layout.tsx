import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./admin.css";

/**
 * ADMIN SHELL
 * --------------------------------------------------------------------
 * A separate root layout from the public site, on purpose.
 *
 * `app/[locale]/layout.tsx` mounts LocaleProvider, QuoteProvider and
 * MotionProvider and loads four font families. None of that belongs in
 * a staff tool: the panel is English-only, has no quote basket and does
 * not animate. Keeping it out of this tree means the admin JavaScript
 * never reaches the public bundles, and the public providers never load
 * here — a page of dense tables should be instant.
 *
 * styles/globals.css is deliberately NOT imported either: it is ~98 KB
 * of marketing design tokens, Arabic typography and scroll treatments
 * that no admin screen uses. admin.css is a few kilobytes of plain CSS
 * with no Tailwind build behind it.
 *
 * The panel is guarded in proxy.ts, not here. A layout is the wrong
 * place for an auth gate: it does not run for route handlers, so
 * anything under /admin that is not a page would be unprotected.
 */

export const metadata: Metadata = {
  title: { default: "Corn Fodder Admin", template: "%s · Corn Fodder Admin" },
  robots: { index: false, follow: false, nocache: true },
};

/** Nothing here is ever prerendered — every screen reads live data. */
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/audit", label: "Audit" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="admin">
        <header className="admin-bar">
          <Link href="/admin" className="admin-brand">
            {/*
              32px. The mark is a fine-line design and starts to break up
              below roughly 36px (see components/ui/Logo.tsx), so here it
              works as a recognisable colour cue beside the name rather
              than as legible artwork. The name carries the identity.
            */}
            <Image
              src="/logo/symbol.png"
              alt=""
              width={512}
              height={512}
              sizes="64px"
              className="admin-mark"
              priority
            />
            Corn Fodder<span>admin</span>
          </Link>
          <nav className="admin-nav">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <form action="/admin/logout" method="post" className="admin-bar-end">
            <Link href="/" target="_blank" rel="noreferrer" className="admin-quiet">
              View site
            </Link>
            <button type="submit" className="admin-btn admin-btn-quiet">
              Sign out
            </button>
          </form>
        </header>
        <main className="admin-main">{children}</main>
      </body>
    </html>
  );
}
