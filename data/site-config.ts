/**
 * SITE CONFIGURATION
 * --------------------------------------------------------------------
 * The single place to rename the business, change contact details,
 * social links, service areas and the default language.
 *
 * Every component reads from here — nothing brand-specific is
 * hard-coded in the UI.
 */

// The canonical locale table lives in data/locales.ts (also import-free).
export type LocaleCode = "en" | "ar" | "ckb" | "kmr";

/**
 * How quote submissions are handled.
 *   "api"  — POST to `quoteEndpoint`. The only mode that actually
 *            delivers an enquiry to a human.
 *   "mock" — development only. Stores the payload in localStorage and
 *            resolves successfully so the flow can be tested. NEVER
 *            reports success in a production build: see
 *            lib/quote-service.ts `resolveMode()`.
 */
export type QuoteServiceMode = "api" | "mock";

/**
 * A place the business actually serves. Nothing is assumed: an empty
 * `serviceAreas` array means coverage is confirmed per order, and the
 * UI says exactly that rather than implying national delivery.
 */
export interface ServiceArea {
  /** Display label, e.g. "Erbil Governorate". */
  name: string;
  country?: string;
  region?: string;
  city?: string;
  /** Delivery to this area is offered. */
  deliveryAvailable?: boolean;
  /** Collection from the farm/depot is offered for this area. */
  pickupAvailable?: boolean;
  /** Only served for commercial / full-load volumes. */
  commercialOnly?: boolean;
  /** Free text shown beside the name. */
  note?: string;
}

/**
 * Registered company identity. Kept deliberately separate from the
 * brand: SILVORA is what customers read, the legal entity is what
 * belongs on documents.
 *
 * `legalName` should appear ONLY in:
 *   • Organization structured data
 *   • legal pages (privacy / terms / cookies)
 *   • the footer copyright line
 *   • printed quote documents, and invoices later
 *
 * It must not replace the brand name in navigation, headings or copy.
 */
export interface LegalIdentity {
  /** Registered entity name. Placeholder until the company is formed. */
  name: string;
  /** Name used in the copyright line; falls back to the brand. */
  copyrightName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  /** e.g. "Limited liability company". Free text. */
  businessType?: string;
  /** Registered address, if different from the office address. */
  registeredAddress?: string;
}

export const siteConfig = {
  /* ---------------------------------------------------------- Brand */
  brandName: "SILVORA",
  /** Used in sentences, e.g. "Silvora bales". */
  brandNameDisplay: "Silvora",
  descriptor: "Premium Corn Silage",
  tagline: "Harvested for Performance.",
  /** Short statement used in the footer and Open Graph description. */
  statement:
    "Premium corn silage bales built around freshness, consistency, storage protection and dependable livestock feeding.",
  /** Closing line in the footer. */
  footerLine: ["The field does the first half.", "We perfect the rest."],

  /* -------------------------------------------------- Legal entity */
  /**
   * PLACEHOLDER until the company is registered. Do not invent a name,
   * a registration number or a tax number — an incorrect legal identity
   * in structured data and on quote documents is a real problem, not a
   * cosmetic one. See PRE-LAUNCH.md section 2.
   */
  legal: {
    name: "Silvora", // ← registered entity name goes here
    copyrightName: "", // empty → falls back to the brand name
    registrationNumber: "",
    taxNumber: "",
    businessType: "",
    registeredAddress: "",
  } as LegalIdentity,

  /* ------------------------------------------------------------ URL */
  /**
   * Canonical origin. Read through lib/site-url.ts, which normalises it
   * and refuses example.com / localhost / http in production builds.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com",

  /* -------------------------------------------------------- Contact */
  contact: {
    email: "sales@example.com",
    /** Displayed as-is. */
    phone: "+00 000 000 0000",
    /**
     * Digits only, full international format WITHOUT a leading "+"
     * (e.g. "9647510000000"). No country code is ever guessed — see
     * lib/contact.ts.
     */
    whatsapp: "0000000000",
    /** Leave empty strings to hide a line. */
    office: "Office address — add in data/site-config.ts",
    farm: "Farm / production site — add in data/site-config.ts",
    businessHours: "Mon – Sat · 08:00 – 17:00",
    /** Optional Google Maps embed URL. Leave empty for the placeholder. */
    mapEmbedUrl: "",
  },

  /* ---------------------------------------------------------- Social */
  socials: [
    { label: "Instagram", href: "#", icon: "instagram" },
    { label: "Facebook", href: "#", icon: "facebook" },
    { label: "LinkedIn", href: "#", icon: "linkedin" },
    { label: "YouTube", href: "#", icon: "youtube" },
  ] as const,

  /* ------------------------------------------------------ Commercial */
  currency: "USD",
  /**
   * Service areas shown on the logistics section / page.
   * Leave the array empty until you are ready to publish coverage;
   * the UI then shows "coverage confirmed per order".
   *
   * Example:
   *   { name: "Erbil Governorate", note: "Delivery available" },
   */
  serviceAreas: [] as ServiceArea[],

  /* ------------------------------------------------------- Features */
  /**
   * Every optional capability is flagged here — never scattered through
   * components. A `false` flag removes the UI entirely rather than
   * showing a disabled control.
   */
  features: {
    /** See QuoteServiceMode. Overridden to "api" when an endpoint exists. */
    quoteServiceMode: "mock" as QuoteServiceMode,
    /**
     * Optional EXTERNAL endpoint. Leave empty to use this app's own
     * /api/quote route, which is the normal setup.
     */
    quoteEndpoint: process.env.NEXT_PUBLIC_FORMS_ENDPOINT ?? "",
    /** Master switch for the whole RFQ flow. */
    quoteEnabled: true,
    /**
     * Channel switches. Each one ALSO requires a real, non-placeholder
     * value in `contact` above — the flag can only turn a channel off,
     * never force a placeholder on. See lib/contact.ts.
     */
    whatsappEnabled: true,
    phoneEnabled: true,
    emailEnabled: true,
    /** No provider is wired — see lib/analytics.ts. */
    analyticsEnabled: false,
    marketingEnabled: false,
    searchEnabled: true,
    savedProductsEnabled: true,
    specSheetsEnabled: true,
    availabilityEnabled: true,
    batchDataEnabled: true,
    /**
     * Show unverified (`demo: true`) technical figures — weights,
     * dimensions, nutrition, moisture — to visitors.
     *
     * Forced OFF in production regardless of this value: see
     * lib/demo-policy.ts. A buyer must never mistake a placeholder for a
     * measured specification.
     */
    showDemoValues: true,
  },

  /* ------------------------------------------------------- Language */
  defaultLanguage: "en" as LocaleCode,
  /** Languages the site is prepared for. See lib/i18n.ts. */
  languages: ["en", "ar", "ckb", "kmr"] as LocaleCode[],

  /* ------------------------------------------------------------ SEO */
  seo: {
    titleTemplate: "%s — SILVORA",
    defaultTitle: "SILVORA — Wrapped Corn Silage Bales & Bulk Maize Silage Supply",
    defaultDescription:
      "Premium wrapped corn silage bales for dairy and beef herds — round, square and compact formats. Farm orders, commercial supply and export enquiries, with delivery planned around your operation. Pricing quoted per order.",
    /** Path under /public. Replace with your own 1200×630 image. */
    ogImage: "/og.jpg",
    twitterHandle: "",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Contact helpers (isPhoneConfigured, whatsappHref, …) live in
 * lib/contact.ts. They are NOT re-exported here on purpose: this file is
 * pure data with no imports, which is what lets `npm run validate:data`
 * and `npm run launch:audit` read it directly under plain Node.
 */

/** True when a consent banner would have something to consent to. */
export const needsConsentUi = (): boolean =>
  siteConfig.features.analyticsEnabled || siteConfig.features.marketingEnabled;

/** Name for the footer copyright line: legal entity if set, else brand. */
export const copyrightName = (): string =>
  siteConfig.legal.copyrightName?.trim() || siteConfig.legal.name.trim() || siteConfig.brandName;
