import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ArrowUp } from "lucide-react";
import { Logo, LogoSymbol } from "@/components/ui/Logo";
import { SocialIcon } from "@/components/ui/SocialIcon";

import { copyrightName, siteConfig } from "@/data/site-config";
import { isEmailConfigured, isPhoneConfigured, isWhatsappConfigured, mailtoHref, telHref, whatsappHref } from "@/lib/contact";
import { getCopy, getDictionary } from "@/lib/dictionary";
import { locales } from "@/lib/i18n";

export function Footer() {
  const copy = getCopy();
  const { footer: footerNav, legal: legalNav } = getDictionary().nav;
  const year = new Date().getFullYear();
  const c = siteConfig.contact;

  return (
    <footer className="cv-auto grain relative overflow-hidden bg-ink text-cream">
      <div className="pointer-events-none absolute inset-0 field-rows text-cream opacity-30" aria-hidden />

      <div className="container-x relative z-10">
        {/* Top: statement + columns */}
        <div className="grid gap-12 border-b border-cream/10 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-5 lg:col-span-4">
            <Logo variant="horizontal" tone="light" ribColor="#0d100e" className="text-[1.25rem]" />
            <p className="mt-6 max-w-sm text-cream/65 body-lg">{copy.footer.statement}</p>
            <p className="mt-6 font-display text-xl italic text-wheat/80">{siteConfig.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-10 md:col-span-7 md:grid-cols-4 lg:col-span-8">
            {footerNav.map((group) => (
              <div key={group.title}>
                <h3 className="eyebrow mb-5 text-cream/65">{group.title}</h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="link-line text-[0.9375rem] text-cream/80 transition-colors hover:text-cream"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="eyebrow mb-5 text-cream/65">{copy.footer.contact}</h3>
              <ul className="space-y-3 text-[0.9375rem] text-cream/80">
                {/* Placeholder contact details are shown as plain text —
                    a tel:/wa.me/mailto link built from a placeholder is a
                    dead action, so it is never rendered as a link. */}
                <li>
                  {isPhoneConfigured() ? (
                    <a href={telHref()} className="link-line hover:text-cream">
                      {c.phone}
                    </a>
                  ) : (
                    <span className="text-cream/60">{c.phone}</span>
                  )}
                </li>
                {isWhatsappConfigured() && (
                  <li>
                    <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="link-line hover:text-cream">
                      {copy.common.whatsapp}
                    </a>
                  </li>
                )}
                <li>
                  {isEmailConfigured() ? (
                    <a href={mailtoHref()} className="link-line break-all hover:text-cream">
                      {c.email}
                    </a>
                  ) : (
                    <span className="break-all text-cream/60">{c.email}</span>
                  )}
                </li>
                <li className="text-cream/65">{c.businessHours}</li>
              </ul>
              <div className="mt-6 flex items-center gap-2">
                {siteConfig.socials.filter((s) => s.href && s.href !== "#").map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 text-cream/70 transition-colors hover:border-cream/50 hover:text-cream"
                  >
                    <SocialIcon name={s.icon} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: giant wordmark + closing line */}
        <div className="relative py-10 md:py-14">
          <p className="display-sm max-w-xl uppercase text-cream/85">
            {siteConfig.footerLine.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </p>
          <div className="mt-10 flex items-end justify-between gap-6">
            <Logo
              variant="wordmark"
              tone="light"
              className="text-[clamp(3.5rem,17vw,19rem)] tracking-[0.06em] text-cream/95 -ms-[0.03em]"
            />
            <LogoSymbol tone="gold" ribColor="#0d100e" className="mb-2 hidden h-16 w-16 md:block lg:h-24 lg:w-24" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-cream/10 py-6 text-xs text-cream/65 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {copyrightName()}. {copy.footer.rights}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalNav.map((l) => (
              <Link key={l.href} href={l.href} className="link-line hover:text-cream">
                {l.label}
              </Link>
            ))}
            <span className="inline-flex items-center gap-2" aria-label={copy.footer.language}>
              <span className="text-cream/60">{copy.footer.language}:</span>
              {siteConfig.languages.map((code) => (
                <span key={code} dir={locales[code].dir} className={code === siteConfig.defaultLanguage ? "text-cream" : "text-cream/60"}>
                  {locales[code].nativeLabel}
                </span>
              ))}
            </span>
            <a href="#top" className="inline-flex items-center gap-1.5 hover:text-cream">
              {copy.footer.backToTop}
              <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
