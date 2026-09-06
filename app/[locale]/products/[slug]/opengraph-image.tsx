import { ImageResponse } from "next/og";
import { getProduct, products } from "@/data/products";
import { formatLabels } from "@/data/product-labels";
import { siteConfig } from "@/data/site-config";

/**
 * Product share card.
 *
 * Built with next/og — no extra dependency, no headless browser, no
 * bundled font file. Brand colours only (forest ground, cream type, gold
 * rule) and only facts we can stand behind: name, format, one line.
 * Never a price, never a rating.
 */

export const alt = "Corn Fodder corn silage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);

  const name = product?.name ?? siteConfig.brandName;
  const format = product ? `${formatLabels[product.format]} · Corn silage` : siteConfig.descriptor;
  const line = product?.tagline ?? siteConfig.statement;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b1f17",
          padding: 72,
          color: "#f5f1e7",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#c9a45c" }} />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 10,
              textTransform: "uppercase",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {siteConfig.brandName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#c9a45c",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {format}
          </div>
          <div style={{ fontSize: 82, lineHeight: 1.05, marginTop: 20, maxWidth: 960 }}>{name}</div>
          <div style={{ width: 120, height: 2, background: "#c9a45c", marginTop: 32 }} />
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              marginTop: 28,
              maxWidth: 900,
              color: "rgba(245,241,231,0.75)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {line}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
