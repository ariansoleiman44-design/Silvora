import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone, Clock, Sprout } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { Reveal } from "@/components/ui/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/data/site-config";
import { isEmailConfigured, isPhoneConfigured, isWhatsappConfigured, mailtoHref, telHref, whatsappHref } from "@/lib/contact";
import { setRequestLocale } from "@/lib/locale-server";
import { getCopy } from "@/lib/dictionary";
import { isActiveLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const active = isActiveLocale(locale) ? locale : "en";
  const meta = getCopy(active).pageMeta.contact;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/contact",
    locale: active,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Publishes the locale for every server component below this
  // point. Next renders route segments independently, so the
  // layout setting it is not enough — each page must too.
  setRequestLocale(locale);
  const copy = getCopy();
  const t = copy.contact;
  const c = siteConfig.contact;

  // A row is only a link when the underlying detail is real: an unset
  // phone / WhatsApp / email still shows the placeholder text (so it is
  // visible to whoever configures the site) but never as a dead action.
  const rows = [
    { icon: Phone, label: t.phone, value: c.phone, href: isPhoneConfigured() ? telHref() : undefined },
    ...(isWhatsappConfigured()
      ? [
          {
            icon: MessageCircle,
            label: t.whatsapp,
            value: copy.common.whatsapp,
            href: whatsappHref(),
            external: true,
          },
        ]
      : []),
    { icon: Mail, label: t.email, value: c.email, href: isEmailConfigured() ? mailtoHref() : undefined },
    { icon: MapPin, label: t.office, value: c.office },
    { icon: Sprout, label: t.farm, value: c.farm },
    { icon: Clock, label: t.hours, value: c.businessHours },
  ].filter((r) => r.value);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <PageHero eyebrow={t.eyebrow} lines={t.headline} intro={t.intro} image="contactHero" size="md" italicLast />

      <section className="bg-cream py-14 text-ink md:py-24">
        <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-4">
            <h2 className="eyebrow text-ink/60">{t.detailsTitle}</h2>
            <ul className="mt-6 divide-y divide-ink/10 border-y border-ink/10">
              {rows.map((r) => {
                const Icon = r.icon;
                const inner = (
                  <>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-leaf" strokeWidth={1.5} aria-hidden />
                    <span className="min-w-0">
                      <span className="eyebrow block text-ink/60">{r.label}</span>
                      <span className="mt-1 block break-words text-[0.9375rem]">{r.value}</span>
                    </span>
                  </>
                );
                return (
                  <li key={r.label}>
                    {r.href ? (
                      <a
                        href={r.href}
                        target={r.external ? "_blank" : undefined}
                        rel={r.external ? "noopener noreferrer" : undefined}
                        className="flex gap-4 py-4 transition-colors hover:text-forest"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex gap-4 py-4">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Map */}
            <div className="mt-8 aspect-[4/3] overflow-hidden border border-ink/12 bg-cream-deep">
              {c.mapEmbedUrl ? (
                <iframe
                  src={c.mapEmbedUrl}
                  title="Map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="field-rows flex h-full flex-col items-center justify-center p-6 text-center text-ink">
                  <MapPin className="h-6 w-6 text-ink/30" strokeWidth={1.25} aria-hidden />
                  <p className="mt-3 max-w-xs text-xs text-ink/60">{t.mapPlaceholder}</p>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7 lg:col-start-6">
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
