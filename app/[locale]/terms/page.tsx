import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { isActiveLocale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { getCopy } from "@/lib/dictionary";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const active = isActiveLocale(locale) ? locale : "en";
  const meta = getCopy(active).pageMeta.terms;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/terms",
    locale: active,
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Publishes the locale for every server component below this
  // point. Next renders route segments independently, so the
  // layout setting it is not enough — each page must too.
  setRequestLocale(locale);
  return (
    <LegalPage
      title="Terms"
      path="/terms"
      updated="Replace with the date of your last revision"
      sections={[
        {
          title: "Quotes",
          paragraphs: [
            "State how long a quotation remains valid, what it includes (product, quantity, delivery) and when it becomes a binding order.",
          ],
        },
        {
          title: "Specifications",
          paragraphs: [
            "Explain that silage is an agricultural product with natural variation, how specifications are confirmed per batch, and what happens if a batch differs from the quoted specification.",
          ],
        },
        {
          title: "Delivery and risk",
          paragraphs: [
            "Set out when risk passes to the buyer, how deliveries are scheduled, and the buyer's responsibilities for access and unloading.",
          ],
        },
        {
          title: "Payment",
          paragraphs: ["Describe payment terms, currency and accepted methods."],
        },
      ]}
    />
  );
}
