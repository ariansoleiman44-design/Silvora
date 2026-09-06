import type { Dictionary } from "@/data/dictionaries";

/**
 * Machine-key label maps — کوردیی سۆرانی.
 * Keys are structural and never translated. Availability wording stays
 * a supply *state*, never a stock count, as in every other locale.
 */
export const labelsCkb: Dictionary["labels"] = {
  format: {
    round: "خڕ",
    square: "چوارگۆشە",
    compact: "چڕ",
    custom: "بەپێی داواکاری",
  },
  application: {
    dairy: "مانگای شیردەر",
    beef: "مانگای گۆشت",
    "sheep-goats": "مەڕ و بزن",
    general: "ئاژەڵی گشتی",
  },
  orderType: {
    "small-farm": "کێڵگەی بچووک",
    commercial: "بازرگانی",
    bulk: "کۆمەڵ",
    export: "هەناردە",
  },
  faqCategory: {
    buying: "کڕینی کێڵگە",
    commercial: "دابینکردنی بازرگانی",
    delivery: "گەیاندن",
    storage: "هەڵگرتن",
    "product-data": "داتای بەرهەم",
    terms: "پارەدان و مەرجەکان",
  },
  availability: {
    available: "دروێنەی ئێستا بەردەستە",
    limited: "دابینکردنی سنووردار",
    preorder: "بەپێی داواکاری دروست دەکرێت",
    seasonal: "وەرزی — دەربارەی بڕینی داهاتوو بپرسە",
    contact: "بۆ دابینکردنی ئێستا پەیوەندی بکە",
    unavailable: "لە ئێستادا بەردەست نییە",
  },
};
