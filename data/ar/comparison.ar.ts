import type { Dictionary } from "@/data/dictionaries";

/**
 * مقارنة الصيغ — العربية.
 * `key` and `productSlug` are structural and stay in English.
 * Values are positioning statements, not measured performance claims.
 */
export const comparisonAr: Dictionary["comparison"] = {
  columns: [
    { key: "round", label: "دائرية", productSlug: "premium-round-bale" },
    { key: "square", label: "مربّعة", productSlug: "square-silage-bale" },
    { key: "high-density", label: "عالية الكثافة", productSlug: "high-density-square-bale" },
    { key: "compact", label: "مدمجة", productSlug: "compact-mini-bale" },
  ],
  rows: [
    {
      label: "المناولة",
      values: {
        round: "مناوِل بالات اعتيادي",
        square: "مناوِل اعتيادي أو شوكات",
        "high-density": "مناوِل بتحمّل أعلى",
        compact: "لودر صغير أو يدويًا بأحزمة",
      },
    },
    {
      label: "التخزين",
      values: {
        round: "في الخارج، على الوجه المستوي، طبقتان",
        square: "قابلة للرصف، داخل الحظيرة أو خارجها",
        "high-density": "قابلة للرصف لتخزين ممتد",
        compact: "في الخارج أو تحت غطاء، رصّات منخفضة",
      },
    },
    {
      label: "نوع الطلب المعتاد",
      values: {
        round: "من المزرعة الصغيرة إلى التجاري",
        square: "من المزرعة الصغيرة إلى التجاري",
        "high-density": "تجاري، بالجملة، تصدير",
        compact: "مزرعة صغيرة",
      },
    },
    {
      label: "كفاءة النقل",
      values: {
        round: "جيدة",
        square: "جيدة جدًا",
        "high-density": "الأفضل في المجموعة",
        compact: "جيدة للحمولات الصغيرة",
      },
    },
    {
      label: "حجم المزرعة",
      values: {
        round: "أي قطيع يستهلك بالة يوميًا",
        square: "ساحات محدودة المساحة",
        "high-density": "وحدات كبيرة، ومسافات نقل طويلة",
        compact: "قطعان الأغنام والحيازات الصغيرة",
      },
    },
    {
      label: "مرونة التغذية",
      values: {
        round: "تغذية بالبالة كاملة",
        square: "سهلة التقسيم",
        "high-density": "بالة كاملة، بمعدّل تصريف عالٍ",
        compact: "تُفتح وتُستهلك سريعًا",
      },
    },
  ],
};
