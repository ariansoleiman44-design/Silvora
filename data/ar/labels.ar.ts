import type { Dictionary } from "@/data/dictionaries";

/**
 * Machine-key label maps — العربية.
 * Keys are structural and never translated; only the human-readable
 * label changes. Availability wording stays a supply *state*, never a
 * stock count, exactly as in English.
 */
export const labelsAr: Dictionary["labels"] = {
  format: {
    round: "دائرية",
    square: "مربّعة",
    compact: "مدمجة",
    custom: "حسب الطلب",
  },
  application: {
    dairy: "أبقار حلوب",
    beef: "أبقار لحم",
    "sheep-goats": "أغنام وماعز",
    general: "ماشية عامة",
  },
  orderType: {
    "small-farm": "مزرعة صغيرة",
    commercial: "تجاري",
    bulk: "بالجملة",
    export: "تصدير",
  },
  faqCategory: {
    buying: "الشراء للمزرعة",
    commercial: "التوريد التجاري",
    delivery: "التوصيل",
    storage: "التخزين",
    "product-data": "بيانات المنتج",
    terms: "الدفع والشروط",
  },
  availability: {
    available: "حصاد الموسم متوفّر",
    limited: "توريد محدود",
    preorder: "يُصنع حسب الطلب",
    seasonal: "موسمي — استفسر عن الحشّة القادمة",
    contact: "تواصل لمعرفة التوريد الحالي",
    unavailable: "غير متوفّر حاليًا",
  },
};
