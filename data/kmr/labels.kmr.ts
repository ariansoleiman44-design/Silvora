import type { Dictionary } from "@/data/dictionaries";

/** Label maps — کوردیا بادینی. DRAFT: see data/kmr/copy.kmr.ts header. */
export const labelsKmr: Dictionary["labels"] = {
  format: {
    round: "خڕ",
    square: "چوارگۆشە",
    compact: "بچویک",
    custom: "ل دویڤ داخوازێ",
  },
  application: {
    dairy: "چێلەکێن شیری",
    beef: "چێلەکێن گۆشتی",
    "sheep-goats": "پەز و بزن",
    general: "تەریشێ گشتی",
  },
  orderType: {
    "small-farm": "پلانگەها بچویک",
    commercial: "بازرگانی",
    bulk: "بکومی",
    export: "هەناردەکرن",
  },
  faqCategory: {
    buying: "کڕینا پلانگەهێ",
    commercial: "دابینکرنا بازرگانی",
    delivery: "گەهاندن",
    storage: "هەلگرتن",
    "product-data": "داتایێن بەرهەمی",
    terms: "دراڤدان و مەرج",
  },
  availability: {
    available: "دروینا نوکە بەردەستە",
    limited: "دابینکرنا سنووردار",
    preorder: "ل دویڤ داخوازێ دئێتە چێکرن",
    seasonal: "وەرزی — دەربارەی بڕینا بهێ بپرسە",
    contact: "بۆ دابینکرنا نوکە پەیوەندییێ بکە",
    unavailable: "نوکە بەردەست نینە",
  },
};
