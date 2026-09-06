import Link from "next/link";
import type { Metadata } from "next";
import { products } from "@/data/products";
import { activeLocales } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n";
import { readOverridesUncached } from "@/lib/server/product-overrides";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { safeRead } from "@/lib/server/supabase";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const configured = isSupabaseConfigured();
  const overrides = configured
    ? await safeRead(readOverridesUncached, [], "admin/products")
    : [];

  const edited = new Set(overrides.map((o) => `${o.slug}:${o.locale}`));

  return (
    <>
      <h1 className="admin-h1">Products</h1>
      <p className="admin-sub">
        {products.length} products from <code>data/products.ts</code>.
        {edited.size > 0 && ` ${edited.size} edited record(s).`}
      </p>

      {/*
        The single most important thing to understand about this screen,
        so it is stated on the screen and not only in the documentation.
      */}
      <div className="notice notice-warn">
        <p>
          <strong>Edits are layered over the code, not stored in place of it.</strong> The
          catalogue in <code>data/products.ts</code> stays the source of truth; the panel saves
          only the fields you change. Resetting a record deletes the edit and the committed
          version reappears.
        </p>
      </div>

      {!configured && (
        <div className="notice notice-error">
          <p>
            <strong>No database connected.</strong> You can read the catalogue below but not save
            changes.
          </p>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Format</th>
              <th>Availability</th>
              {activeLocales.map((locale) => (
                <th key={locale}>{getLocale(locale).label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.slug}>
                <td className="wrap">
                  <Link href={`/admin/products/${product.slug}`}>{product.name}</Link>
                  <br />
                  <span className="admin-mono" style={{ color: "var(--ink-soft)" }}>
                    {product.slug}
                  </span>
                </td>
                <td>{product.format}</td>
                <td>{product.availability}</td>
                {activeLocales.map((locale) => (
                  <td key={locale}>
                    {edited.has(`${product.slug}:${locale}`) ? (
                      <Link href={`/admin/products/${product.slug}?locale=${locale}`}>edited</Link>
                    ) : (
                      <span style={{ color: "var(--ink-soft)" }}>—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
