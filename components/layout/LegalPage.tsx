import { PageHero } from "@/components/layout/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/data/site-config";
import { breadcrumbJsonLd } from "@/lib/seo";

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

/**
 * Simple long-form page for legal texts. The content shipped here is a
 * clearly-marked placeholder — replace it with text from your lawyer.
 */
export function LegalPage({
  title,
  updated,
  path,
  sections,
}: {
  title: string;
  updated: string;
  /** Route of this page, used for breadcrumb structured data. */
  path?: string;
  sections: LegalSection[];
}) {
  return (
    <>
      {path && (
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: title, path },
          ])}
        />
      )}
      <PageHero eyebrow="Legal" lines={[title]} size="sm" />
      <section className="bg-cream py-14 text-ink md:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <p className="eyebrow text-ink/60">Last updated</p>
            <p className="mt-2 text-sm">{updated}</p>
            <p className="mt-6 border-s-2 border-gold ps-4 text-xs leading-relaxed text-ink/60">
              Placeholder text. Replace with the legal wording that applies to {siteConfig.legal.name} before
              publishing.
            </p>
          </aside>
          <div className="lg:col-span-8 lg:col-start-5">
            {sections.map((s) => (
              <section key={s.title} className="border-t border-ink/12 py-8 first:border-t-0 first:pt-0">
                <h2 className="display-sm">{s.title}</h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="body-lg mt-4 max-w-2xl text-ink/70">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
