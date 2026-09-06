/**
 * SITE COPY (English)
 * --------------------------------------------------------------------
 * Every piece of interface and section copy lives here so it can be
 * translated later (see lib/i18n.ts). Product and FAQ content lives in
 * their own data files.
 *
 * Headline arrays render one item per line so line breaks are
 * deliberate on every screen size.
 */

export const copy = {
  /** Locale-specific site metadata. Per-page metadata lives with the page. */
  seo: {
    defaultTitle: "Corn Fodder — Wrapped Corn Silage Bales & Bulk Maize Silage Supply",
    defaultDescription:
      "Premium wrapped corn silage bales for dairy and beef herds — round, square and compact formats. Farm orders, commercial supply and export enquiries, with delivery planned around your operation. Pricing quoted per order.",
  },

  /** Per-route metadata. Product pages build theirs from product data. */
  pageMeta: {
    /**
     * Product page metadata. Tokens: {name} {format} {applications}
     * {short}. Kept as templates so each language can order the parts
     * the way its grammar wants.
     */
    product: {
      title: "{name} — Wrapped Corn Silage {format} Bale",
      description:
        "{short} {format} format maize silage for {applications}. Request a quote for {format} bale supply and delivery.",
    },
    products: {
      title: "Products — Corn Silage Bale Formats",
      description:
        "Round, square, high-density and compact corn silage bales, plus export-ready and custom formats. Filter by livestock and order type and request a quote.",
    },
    quality: {
      title: "Quality — From Crop to Inspection",
      description:
        "How Corn Fodder corn silage is grown, harvested, chopped, compacted, wrapped, fermented, stored, inspected and transported — and how to read a batch analysis.",
    },
    process: {
      title: "Our Process — From Field to Feed",
      description:
        "Grow, harvest, chop, compact, wrap, ferment, deliver, feed. The eight steps every Corn Fodder corn silage bale goes through.",
    },
    logistics: {
      title: "Logistics — Farm, Commercial & Export Orders",
      description:
        "Farm pickup, regional delivery, full truck loads and export preparation for corn silage bales. Loads planned around your equipment and schedule.",
    },
    about: {
      title: "About — Respect for the Crop, the Herd and the Farmer",
      description:
        "Corn Fodder exists to make premium corn silage the standard rather than the exception. Our mission, approach, quality philosophy and future vision.",
    },
    contact: {
      title: "Contact Sales",
      description:
        "Sales, samples, inspections and logistics — reach the Corn Fodder team by phone, WhatsApp, email or the contact form.",
    },
    quote: {
      title: "Request a Quote — Corn Silage Bales",
      description:
        "Build a corn silage request: bale formats, quantities, supply frequency and delivery. Farm, commercial, distributor and export enquiries. Pricing quoted per order.",
    },
    results: {
      title: "Results — Corn Silage in Working Herds",
      description:
        "How operations feed Corn Fodder corn silage: herd, challenge, supply plan and the measured outcome.",
    },
    privacy: { title: "Privacy Policy", description: "How we handle the details you share with us." },
    terms: { title: "Terms of Sale", description: "The terms that apply to quotes, orders and deliveries." },
    cookies: { title: "Cookies", description: "What this site stores in your browser." },
  },

  common: {
    requestQuote: "Request a Quote",
    requestQuoteShort: "Quote",
    addToQuote: "Add to Quote",
    addedToQuote: "Added",
    exploreProducts: "Explore Products",
    exploreSilage: "Explore Silage",
    buildMyOrder: "Build My Order",
    talkToSales: "Talk to Sales",
    whatsapp: "WhatsApp",
    callSales: "Call Sales",
    viewProduct: "View product",
    learnMore: "Learn more",
    demoLabel: "Demo",
    demoNote: "Demo figure — replace with measured product data.",
    estimateNote:
      "Figures are estimates for planning only. Confirm feeding requirements with a qualified livestock nutrition professional.",
    skipToContent: "Skip to content",
    menu: "Menu",
    close: "Close",
    language: "Language",
    languageSoon: "More languages coming",
    back: "Back",
    next: "Next",
    startOver: "Start over",
    quantity: "Quantity",
    bales: "bales",
    remove: "Remove",
    /** Joins list items in prose. Arabic uses the Arabic comma. */
    listSeparator: ", ",
    scroll: "Scroll",
  },

  header: {
    quoteAria: "Open your quote",
    search: "Search products",
  },

  search: {
    title: "Search products",
    placeholder: "Bale format, livestock, order type…",
    results: "Results",
    empty: "No bales match that. Try a format, a livestock type, or \"export\".",
    hint: "Press / to search, Esc to close.",
  },

  /* Homepage chapter seams — the ruled line between two movements. */
  chapters: {
    belief: "The belief",
    collection: "The collection",
    signature: "The signature bale",
    process: "Process & principles",
    finder: "Find your bale",
    logistics: "Delivery & logistics",
    questions: "Before you order",
  },

  hero: {
    badge: "Premium Harvest • Baled for Performance",
    headline: ["Corn Silage,", "Redefined."],
    sub: "Premium corn silage bales engineered around freshness, consistency, storage protection and dependable livestock feeding.",
    primary: "Explore Silage",
    secondary: "Request a Quote",
    caption: "Fresh-cut maize. Densely packed. Sealed against air.",
    index: "01 / Harvest",
  },

  trust: {
    items: [
      { title: "Carefully Harvested", text: "Cut inside the target window, not when the calendar says so." },
      { title: "Securely Wrapped", text: "Sealed layer on layer so the crop preserves itself." },
      { title: "Consistent Supply", text: "Planned loads and repeat schedules through the season." },
      { title: "Farm-to-Feed Quality", text: "One standard from the field to the feed passage." },
    ],
  },

  statement: {
    eyebrow: "Our belief",
    headline: ["Quality starts", "before the harvest."],
    paragraphs: [
      "Excellent livestock feeding begins long before a bale reaches the farm. It begins with the crop — the variety, the soil, the day it is cut.",
      "Everything after that is about protecting what the field produced: chopping it evenly, packing it tight and sealing it fast.",
    ],
    cta: "How we work",
    caption: "Field, not factory.",
  },

  collection: {
    eyebrow: "The collection",
    headline: ["Built by the field.", "Finished by precision."],
    intro: "Round, square, high-density and compact formats — each one chopped, compacted and wrapped to the same standard.",
    cta: "View all products",
  },

  signature: {
    eyebrow: "The Signature Bale",
    headline: ["Premium Wrapped", "Corn Silage"],
    intro:
      "One bale, made the way every bale should be. Select a specification to read how it is built.",
    specsTitle: "Specifications",
    cta: "Add to Quote",
    secondary: "View the bale",
  },

  process: {
    eyebrow: "From field to feed",
    headline: ["Eight steps.", "One standard."],
    intro: "Every bale passes through the same sequence. Nothing is skipped, nothing is rushed.",
    stepLabel: "Step",
    of: "of",
    dragHint: "Scroll or drag to explore",
  },

  /* The merged homepage chapter: the sequence, then the decisions. */
  sequence: {
    chapterOne: "The sequence",
    chapterOneNote: "Eight steps, in order, every time.",
    chapterTwo: "The decisions",
    chapterTwoNote: "What we choose to do at each of them.",
    cta: "Read the full process",
    caption: "Inside the crop, weeks before the cut.",
  },

  perfectBale: {
    eyebrow: "The perfect bale",
    headline: ["Better feed", "begins with", "a better bale."],
    callouts: [
      { title: "Densely Compacted", text: "Air out, feed value in. Density is the first line of defence." },
      { title: "Protective Wrapping", text: "Multiple layers of film keep oxygen and water on the outside." },
      { title: "Consistent Chop", text: "Short, even material packs tighter and rations evenly." },
      { title: "Careful Fermentation", text: "Sealed and undisturbed, the crop preserves itself." },
      { title: "Storage Ready", text: "Built to sit on a clean base for the season and open as fresh as it was sealed." },
    ],
  },

  why: {
    eyebrow: "Why Corn Fodder",
    headline: ["The difference is", "in the details."],
    intro: "No slogans about being the best. Just the decisions that make a better bale, one after another.",
    items: [
      { title: "Crop selection", text: "Maize chosen for silage, not for grain — plant and cob together." },
      { title: "Harvest timing", text: "Cut in the window where starch and moisture meet, not when it is convenient." },
      { title: "Controlled processing", text: "Chop length checked and kept uniform through the day." },
      { title: "Dense compaction", text: "Every bale packed to push out air before it is sealed." },
      { title: "Protective wrapping", text: "Layered stretch film applied without gaps." },
      { title: "Storage protection", text: "Guidance with every order so the bale arrives and stays in condition." },
      { title: "Dependable logistics", text: "Loads planned around your equipment and your feeding schedule." },
    ],
  },

  finder: {
    eyebrow: "Interactive",
    headline: ["Find your bale"],
    intro: "Four quick questions. We match you to the format that fits your operation.",
    questions: [
      {
        key: "livestock",
        question: "What are you feeding?",
        options: [
          { value: "dairy", label: "Dairy cattle" },
          { value: "beef", label: "Beef cattle" },
          { value: "sheep", label: "Sheep" },
          { value: "goats", label: "Goats" },
          { value: "mixed", label: "Mixed livestock" },
          { value: "other", label: "Other" },
        ],
      },
      {
        key: "size",
        question: "How large is your operation?",
        options: [
          { value: "small", label: "Small", hint: "Up to ~50 head" },
          { value: "medium", label: "Medium", hint: "~50 – 300 head" },
          { value: "large", label: "Large", hint: "300+ head" },
          { value: "trader", label: "Trader / importer" },
        ],
      },
      {
        key: "frequency",
        question: "How often do you need deliveries?",
        options: [
          { value: "once", label: "One-off order" },
          { value: "seasonal", label: "Seasonal", hint: "A few loads a year" },
          { value: "monthly", label: "Monthly" },
          { value: "weekly", label: "Weekly or more" },
        ],
      },
      {
        key: "format",
        question: "Preferred format?",
        options: [
          { value: "round", label: "Round" },
          { value: "square", label: "Square" },
          { value: "compact", label: "Compact" },
          { value: "unsure", label: "Not sure" },
        ],
      },
    ],
    resultEyebrow: "Our recommendation",
    resultCta: "Request pricing for this setup",
    resultSecondary: "View product",
    restart: "Start over",
  },

  calculator: {
    eyebrow: "Plan your season",
    headline: ["How much silage", "do you need?"],
    intro: "Enter your herd and feeding plan. We estimate total silage and approximate bale count.",
    fields: {
      animals: { label: "Number of animals", hint: "Head to be fed" },
      perDay: { label: "Silage per animal per day", hint: "kg fresh weight" },
      days: { label: "Feeding period", hint: "days" },
      perBale: { label: "Usable material per bale", hint: "kg — see product specs" },
      waste: { label: "Waste allowance", hint: "%" },
      reserve: { label: "Reserve", hint: "% extra to keep on hand" },
    },
    results: {
      total: "Estimated total silage",
      bales: "Approximate bales",
      reserve: "Reserve bales",
      withReserve: "Total incl. reserve",
      weekly: "Approx. weekly consumption",
      monthly: "Approx. monthly consumption",
    },
    /** Herd presets. Keys match `animalPresets` in lib/calculator.ts. */
    animalTypes: {
      dairy: "Dairy cows (lactating)",
      "dairy-dry": "Dairy cows (dry)",
      beef: "Beef cattle (finishing)",
      "beef-store": "Beef cattle (store)",
      heifers: "Heifers / youngstock",
      "sheep-goats": "Sheep & goats",
    },
    modeQuick: "Quick estimate",
    modeHerd: "Herd planner",
    modeQuickHint: "Three numbers, one answer",
    modeHerdHint: "Animal type and full working",
    animalType: "Animal type",
    animalTypeHint: "Sets a starting daily intake — adjust it below.",
    addToQuote: "Add estimate to request",
    addedToQuote: "Estimate added",
    cta: "Request this quantity",
    disclaimer:
      "Estimates only. Intake varies with animal type, body weight, production stage, ration design and dry matter. Confirm your feeding plan with a qualified livestock nutrition professional.",
  },

  quality: {
    eyebrow: "Quality",
    headline: ["You can see quality.", "You can feel consistency."],
    intro: "Before you buy any silage — ours included — inspect it. Here is what to look for.",
    checks: [
      { title: "Smell", text: "Clean, pleasantly sour and slightly sweet. Never musty, burnt or ammonia-sharp." },
      { title: "Appearance", text: "Uniform colour with visible kernel fragments. No dark, slimy or white patches." },
      { title: "Wrapping integrity", text: "Layers intact, no tears, no punctures, film tight against the bale." },
      { title: "Compaction", text: "Firm under the hand. A dense bale resists pressure and keeps its shape." },
      { title: "Storage condition", text: "Clean base, no standing water, no bird or rodent damage." },
      { title: "Consistency", text: "Open two bales. They should look, smell and feel the same." },
    ],
    cta: "Our quality process",
  },

  comparison: {
    eyebrow: "Compare formats",
    headline: ["Which bale", "fits your farm?"],
    intro: "Four formats, six decisions. Swipe on mobile.",
    rowLabel: "Criteria",
    cta: "View",
  },

  logistics: {
    eyebrow: "Logistics",
    headline: ["Ordered like a commodity.", "Delivered like a promise."],
    intro: "From a single pickup to full truck loads, orders are planned around your equipment, access and feeding schedule.",
    services: [
      { title: "Farm Pickup", text: "Collect from our site with your own transport. Loading assistance included." },
      { title: "Regional Delivery", text: "Scheduled deliveries within our service area, planned around your unloading." },
      { title: "Full Truck Loads", text: "Volume orders loaded for stability and delivered on agreed dates." },
      { title: "Custom Commercial Orders", text: "Season-long agreements, mixed loads and export preparation." },
    ],
    areasTitle: "Service areas",
    areasEmpty: "Delivery coverage is confirmed per order. Tell us where you are and we will plan the route.",
    cta: "Plan your delivery",
  },

  quoteCta: {
    headline: ["Ready for", "your next load?"],
    sub: "Tell us what you feed and how much. We reply with a plan, not a brochure.",
    primary: "Build My Order",
    secondary: "Talk to Sales",
  },

  faq: {
    eyebrow: "Questions",
    headline: ["Before you order"],
    intro: "Straight answers about silage, formats, storage and pricing.",
    more: "Still have a question?",
    moreCta: "Contact sales",
  },

  footer: {
    statement: "Premium corn silage bales — chopped, compacted and wrapped to one standard.",
    products: "Products",
    company: "Company",
    resources: "Resources",
    contact: "Contact",
    language: "Language",
    rights: "All rights reserved.",
    backToTop: "Back to top",
  },

  quote: {
    /* Drawer ("your request" basket). The full RFQ copy lives in `rfq`. */
    drawerTitle: "Your quote",
    drawerEmpty: ["Nothing here yet.", "Add bales from any product page or the collection."],
    drawerEmptyCta: "Browse products",
    drawerSummary: "Estimated bales",
    drawerCta: "Complete quote request",
    drawerContinue: "Continue browsing",
    form: {
      livestockOptions: ["Dairy cattle", "Beef cattle", "Sheep", "Goats", "Mixed livestock", "Other"],
      required: "Required",
      privacy: "We use these details only to reply to your request.",
    },
    success: {
      secondary: "Send another request",
    },
    error: {
      headline: "Something went wrong",
      text: "Your request could not be sent. Please try again or contact us directly.",
      retry: "Try again",
    },
  },

  /* ------------------------------------------------------ Delivery plan */
  deliveryPlanner: {
    eyebrow: "Plan delivery",
    headline: ["The right bale.", "The right volume.", "The right delivery plan."],
    intro:
      "Tell us where the load is going and what you can unload. Delivery feasibility and transport cost are confirmed during quotation.",
    orderType: "Order type",
    quantity: "Estimated bale quantity",
    result:
      "Delivery feasibility and transport cost will be confirmed during quotation. Nothing here is priced or scheduled automatically.",
    cta: "Add delivery requirements to request",
    added: "Added to your request",
  },

  /* --------------------------------------------------- Commercial block */
  commercial: {
    eyebrow: "Regular supply",
    headline: ["Planning regular supply?"],
    intro: "From one farm to full-scale supply. Buy less often, plan more precisely.",
    audience: ["Dairy farms", "Feedlots", "Dealers and distributors", "Commercial livestock operations"],
    cta: "Discuss supply",
  },

  /* ---------------------------------------------------------------- RFQ */
  rfq: {
    eyebrow: "Build your order",
    headline: ["Plan the load.", "We'll handle the details."],
    intro: "Tell us what you need. Availability and logistics are confirmed during quotation.",

    /** Order-track labels, also used in the plain-text summary. */
    orderKinds: {
      farm: "Farm order",
      commercial: "Commercial supply",
      distributor: "Distributor / reseller",
      export: "Export enquiry",
    },
    frequencies: {
      weekly: "Weekly",
      biweekly: "Every 2 weeks",
      monthly: "Monthly",
      custom: "Custom schedule",
    },
    steps: {
      products: "Products",
      requirements: "Requirements",
      delivery: "Delivery",
      contact: "Contact",
      review: "Review",
    },
    stepLabel: "Step",
    of: "of",
    continueCta: "Continue",
    back: "Back",
    edit: "Edit",
    optional: "Optional",

    saved: {
      notice: "Your request is saved on this device",
      dismiss: "Dismiss",
      clear: "Clear request",
      confirmTitle: "Clear this request?",
      confirmText:
        "Products, requirements and contact details will be removed from this device. This cannot be undone.",
      confirmCancel: "Keep it",
      confirmCta: "Clear request",
    },

    products: {
      title: "What do you need?",
      intro: "Add bale formats and quantities. You can also describe your requirement in the next step.",
      empty: "No products selected yet — that is fine. Add one, or continue and describe what you need.",
      browse: "Browse the collection",
      duplicate: "Duplicate line",
      remove: "Remove line",
      notes: "Line notes",
      notesPlaceholder: "Anything specific about this line.",
      lineFrequency: "Delivery cadence for this line",
      totalBales: "Estimated bales",
      supplyTitle: "Supply type",
      oneTime: "One-time order",
      oneTimeHint: "A single delivery",
      recurring: "Recurring supply",
      recurringHint: "A standing schedule",
      frequency: "Frequency",
      frequencyCustom: "Describe your schedule",
      frequencyCustomPlaceholder: "e.g. two loads before winter, then monthly.",
      pricingTitle: "Pricing",
      pricingText: "Quoted on quantity, destination, season and logistics.",
    },

    orderType: {
      title: "How are you buying?",
      intro: "This decides which details we need from you. Nothing here commits you to anything.",
      farm: "Farm order",
      farmHint: "Feeding your own livestock",
      commercial: "Commercial supply",
      commercialHint: "Regular volume for an operation",
      distributor: "Distributor / reseller",
      distributorHint: "Buying to resell",
      export: "Export enquiry",
      exportHint: "Shipping outside the region",
    },

    fields: {
      livestock: "Livestock type",
      animalCount: "Number of animals",
      estimatedQuantity: "Estimated bale quantity",
      deliveryRequired: "Delivery required?",
      deliveryYes: "Yes, deliver to me",
      deliveryNo: "No, I will collect",
      monthlyVolume: "Estimated monthly volume",
      monthlyVolumeHint: "Bales or tonnes — whichever you plan in.",
      preferredFormat: "Preferred bale format",
      contractLength: "Contract length",
      contractHint: "e.g. one season, twelve months, open.",
      resaleTerritory: "Resale territory",
      packagingRequirements: "Packaging requirements",
      packagingHint: "Wrap colour, labelling, pallet or load configuration.",
      privateLabel: "Private label interest?",
      yes: "Yes",
      no: "No",
      destinationCountry: "Destination country",
      destinationPort: "Destination port",
      loadPreference: "Container / truck preference",
      incoterm: "Incoterm preference",
      incotermHint: "EXW, FCA, CPT, CIF — or leave blank and we will advise.",
      labData: "I need laboratory / batch specifications",
      anyFormat: "No preference — advise me",
    },

    delivery: {
      title: "Where is it going?",
      intro: "Delivery feasibility and transport cost are confirmed during quotation.",
      country: "Country",
      region: "Region / city",
      preferredDate: "Preferred delivery date",
      preferredDateHint: "A preference, not a commitment.",
      unload: "Unloading equipment on site?",
      unloadYes: "Yes",
      unloadNo: "No",
      notes: "Access notes",
      notesPlaceholder: "Track width, gate height, turning space, timing restrictions.",
    },

    contact: {
      title: "Who should we reply to?",
      intro: "One contact method is enough. We use these details only to answer this request.",
      name: "Name",
      company: "Company / farm",
      phone: "Phone",
      whatsapp: "WhatsApp",
      email: "Email",
      notes: "Anything else",
      notesPlaceholder: "Feeding plan, timing, or anything that helps us quote accurately.",
      consent: "Send me occasional supply and harvest updates.",
      required: "Required",
      needContact: "Add at least one way to reach you — phone, WhatsApp or email.",
      badEmail: "Check the email address.",
    },

    review: {
      title: "Review your request",
      intro: "Check the details, then send. Nothing is priced automatically.",
      products: "Products",
      order: "Order",
      requirements: "Requirements",
      delivery: "Delivery",
      buyer: "Buyer",
      estimate: "Planning estimate",
      notes: "Notes",
      none: "Not specified",
      noProducts: "No products selected",
      submit: "Submit request",
      submitting: "Sending…",
      reference: "Reference",
    },

    actions: {
      copy: "Copy request summary",
      copied: "Copied",
      copyFailed: "Copy failed — select the text and copy manually.",
      whatsapp: "Continue on WhatsApp",
      print: "Print request",
    },

    failure: {
      headline: "We couldn't send your request.",
      text: "Something went wrong on the way to us. Nothing has been lost.",
      offline: "You appear to be offline. Your request is saved on this device.",
      preserved: "Everything you entered is still here. Try again, or send it to us another way:",
      retry: "Try again",
    },

    confirmation: {
      eyebrow: "Request received",
      headline: ["Request received."],
      text: "Our team will review your requirements and confirm availability, specifications and logistics.",
      reference: "Reference",
      keepCta: "Back to products",
      newCta: "Start another request",
      mockNote:
        "Development mode — this request was stored locally and NOT sent. Connect a backend in lib/quote-service.ts.",
    },

    unconfigured: {
      headline: "Online submission is not connected yet",
      text: "Your request has not been sent. Please copy the summary below and send it to us directly, or reach the team using the contact details on the site.",
      contactCta: "Contact details",
    },
  },

  contact: {
    eyebrow: "Contact",
    headline: ["Talk to", "a person."],
    intro: "Sales, samples, inspections, logistics — one message reaches the right people.",
    detailsTitle: "Reach us",
    phone: "Phone",
    whatsapp: "WhatsApp",
    email: "Email",
    office: "Office",
    farm: "Farm",
    hours: "Business hours",
    mapPlaceholder: "Map — add your location in data/site-config.ts (contact.mapEmbedUrl)",
    form: {
      name: "Name",
      company: "Farm / Company",
      phone: "Phone",
      email: "Email",
      country: "Country",
      city: "City",
      message: "Message",
      submit: "Send message",
      sending: "Sending…",
    },
    success: {
      headline: "Message sent.",
      text: "Thank you — we will be in touch shortly.",
      demoNote: "Demo mode — no backend is connected yet. Connect one in lib/quote-service.ts.",
    },
  },

  products: {
    eyebrow: "Products",
    headline: ["The collection"],
    intro: "Every format we bale, filtered by how you feed and how you order.",
    filters: "Filters",
    clear: "Clear all",
    apply: "Show results",
    sort: "Sort",
    sortOptions: [
      { value: "recommended", label: "Recommended" },
      { value: "size-desc", label: "Bale size: large to small" },
      { value: "size-asc", label: "Bale size: small to large" },
      { value: "order-type", label: "Order type" },
    ],
    groups: {
      format: "Format",
      application: "Application",
      orderType: "Order type",
    },
    results: "results",
    result: "result",
    empty: ["No bales match these filters.", "Try clearing a filter — or ask us for a custom format."],
    emptyCta: "Clear filters",
    emptySecondary: "Request custom format",
  },

  product: {
    breadcrumbHome: "Home",
    breadcrumbProducts: "Products",
    availability: "Availability",
    format: "Format",
    application: "Application",
    orderType: "Order type",
    sections: {
      overview: "Overview",
      specifications: "Specifications",
      bestFor: "Best for",
      storage: "Storage",
      handling: "Handling",
      delivery: "Delivery",
      faq: "FAQ",
      nutrition: "Nutrition",
    },
    nutritionNote: "Lab data available per batch. Request the analysis with your quote.",
    related: "You may also consider",
    stickyQuote: "Request Quote",
    stickyAdd: "Add to Order",
    gallery: "Image",
    viewCta: "View bale",
    addToRequest: "Add to request",
    inRequest: "In your request",
    viewSpec: "View full specification",
    specTitle: "Full specification",
    specIntro: "Everything we can state about this bale today. Figures marked DEMO are placeholders until measured data replaces them.",
    downloadSpec: "Download spec sheet",
    downloadLab: "Download lab report",
    requestLab: "Request lab data",
    requestBatch: "Request batch data",
    requestBatchNote: "Adds this bale to your request and flags that you need laboratory / batch specifications.",
    save: "Save bale",
    saved: "Saved",
    savedTitle: "Saved bales",
    savedEmpty: "Nothing saved yet. Save a bale from any product page to shortlist it here.",
    savedAddAll: "Add to request",
    batchTitle: "Batch information",
    batchIntro: "Harvest and packing records for this product.",
    batchCode: "Batch",
    batchNutrition: "Measured analysis — this batch",
    viewLabReport: "View lab report",
    noBatch: "Batch records are issued per delivery. Ask for them with your quote.",
  },

  about: {
    eyebrow: "About",
    headline: ["Respect for the crop.", "Respect for the herd."],
    intro: "Corn Fodder exists to make premium corn silage the standard rather than the exception.",
    manifesto: [
      { title: "Respect for the crop", text: "The plant did the hard work. Our job is not to waste a gram of it." },
      { title: "Respect for livestock", text: "Animals eat what we make every day. Consistency is a duty, not a feature." },
      { title: "Respect for the farmer", text: "Clear specifications, honest answers and deliveries that arrive when promised." },
      { title: "Precision from harvest to delivery", text: "Every step measured, every bale sealed, every load planned." },
    ],
    chapters: [
      {
        eyebrow: "Mission",
        title: "Make the bale you can rely on.",
        text: "To supply corn silage that opens the same way every time — dense, clean and sealed — so that feeding decisions can be made once, not every morning.",
      },
      {
        eyebrow: "Approach",
        title: "Fewer variables. Better outcomes.",
        text: "We control what can be controlled: crop, timing, chop, density, wrap and handling. Where we cannot control something, we measure it and tell you.",
      },
      {
        eyebrow: "Quality philosophy",
        title: "Inspect before you trust.",
        text: "We would rather you open a bale and check it than take our word for it. Per-batch analysis is available for anyone building a ration on numbers.",
      },
      {
        eyebrow: "Future vision",
        title: "Premium silage as the norm.",
        text: "Wrapped corn silage deserves the same care as any premium agricultural product. That is the standard we are building toward — season by season.",
      },
    ],
    factsTitle: "Company details",
    factsNote: "Add your real company details in data/about.ts — nothing is invented here.",
    cta: "Work with us",
  },

  qualityPage: {
    eyebrow: "Quality",
    headline: ["Nine places", "quality is decided."],
    intro: "From the seed in the ground to the truck at your gate. This is where a bale is made or lost.",
    chapters: [
      { title: "Crop", text: "Silage-specific maize varieties, planted for whole-plant yield and starch, not just grain." },
      { title: "Harvest", text: "Cut inside the target moisture and maturity window. Timing is checked in the field, not assumed." },
      { title: "Chopping", text: "Short, uniform chop length maintained through the day for tight packing and even rations." },
      { title: "Compaction", text: "High density to remove oxygen quickly, so fermentation starts before spoilage can." },
      { title: "Wrapping", text: "Multiple layers of stretch film, applied without gaps, sealed against air and water." },
      { title: "Fermentation", text: "Bales rest undisturbed while natural fermentation lowers the pH and preserves the crop." },
      { title: "Storage", text: "Clean, firm, well-drained bases and regular wrap inspection until the bale ships." },
      { title: "Inspection", text: "Smell, appearance, wrap and density checked before any bale is released." },
      { title: "Transportation", text: "Loaded for stability, handled with soft-grip equipment, delivered on schedule." },
    ],
    labEyebrow: "Laboratory analysis",
    labHeadline: ["Numbers,", "per batch."],
    labIntro:
      "Measured values are provided per batch on request. The parameters below are the ones we report; values appear here once real analyses are uploaded.",
    labParameter: "Parameter",
    labValue: "Value",
    labBatch: "Batch",
    labCta: "Request batch analysis",
  },

  logisticsPage: {
    eyebrow: "Logistics",
    headline: ["Commercial supply,", "planned properly."],
    intro: "Whether you collect one load or contract a season, we plan the movement around your equipment, access and timing.",
    sections: [
      { title: "Farm orders", text: "Smaller and mixed loads for individual farms, with loading help on site." },
      { title: "Commercial orders", text: "Repeat deliveries scheduled around your feeding plan across the season." },
      { title: "Full truck loads", text: "Volume orders loaded for stability and delivered on agreed dates." },
      { title: "Regional transport", text: "Delivery within our service area with routes planned for access and unloading." },
      { title: "Export preparation", text: "Reinforced wrapping, container-optimised formats and documentation prepared per shipment." },
      { title: "Delivery planning", text: "Tell us your unloading equipment and access; we plan the load to match." },
    ],
    planEyebrow: "Plan your delivery",
    planHeadline: ["Tell us where", "the bales are going."],
    planText: "Share location, access and unloading equipment in your quote request and we will propose loads and dates.",
    planCta: "Plan your delivery",
  },

  processPage: {
    eyebrow: "Our process",
    headline: ["From field", "to feed."],
    intro: "The eight steps every Corn Fodder bale goes through, in order, every time.",
  },

  notFound: {
    eyebrow: "404",
    headline: ["This field", "is empty."],
    text: "The page you are looking for has been moved, harvested or never existed.",
    cta: "Back to home",
    secondary: "Browse products",
  },
};

export type Copy = typeof copy;
