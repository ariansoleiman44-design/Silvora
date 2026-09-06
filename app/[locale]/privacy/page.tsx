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
  const meta = getCopy(active).pageMeta.privacy;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/privacy",
    locale: active,
  });
}

export default async function PrivacyPage({
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
      title="Privacy"
      path="/privacy"
      updated="Replace with the date of your last revision"
      sections={[
        {
          title: "What we collect",
          paragraphs: [
            "When you request a quote or contact us we receive the details you type into the form: name, farm or company, phone, WhatsApp, email, location, livestock type, quantities and your message.",
          ],
        },
        {
          title: "How we use it",
          paragraphs: [
            "We use these details only to reply to your request, plan your order and, if you ask, keep you informed about supply for future seasons.",
          ],
        },
        {
          title: "Storage and sharing",
          paragraphs: [
            "Describe here where submissions are stored (for example your CRM or email provider), how long they are kept, and whether any third party — such as a transport partner — receives them.",
          ],
        },
        {
          title: "Your rights",
          paragraphs: [
            "Explain how a visitor can ask to see, correct or delete their details, and which authority they can contact.",
          ],
        },
      ]}
    />
  );
}
