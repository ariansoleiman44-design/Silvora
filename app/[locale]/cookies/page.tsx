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
  const meta = getCopy(active).pageMeta.cookies;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/cookies",
    locale: active,
  });
}

export default async function CookiesPage({
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
      title="Cookies"
      path="/cookies"
      updated="Replace with the date of your last revision"
      sections={[
        {
          title: "What this site stores",
          paragraphs: [
            "Out of the box this site sets no tracking cookies. It uses browser local storage to remember the products in your quote request between visits. Nothing in local storage is sent anywhere until you submit a form.",
          ],
        },
        {
          title: "Analytics",
          paragraphs: [
            "If you add analytics or marketing scripts, describe them here and provide a way to opt out where the law requires it.",
          ],
        },
      ]}
    />
  );
}
