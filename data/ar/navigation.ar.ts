import type { Dictionary } from "@/data/dictionaries";

/**
 * التنقّل — العربية.
 *
 * `href` values are canonical, unprefixed paths. The locale prefix is
 * added at render time by `localePath()` / `useLocalePath()`, so a link
 * here never has to know which language it is being rendered in.
 */
export const navigationAr: Dictionary["nav"] = {
  main: [
    { label: "المنتجات", href: "/products", hint: "صيغ البالات ومواصفاتها" },
    { label: "الجودة", href: "/quality", hint: "من المحصول إلى المعاينة" },
    { label: "عمليتنا", href: "/process", hint: "من الحقل إلى العلف في ثماني خطوات" },
    { label: "اللوجستيات", href: "/logistics", hint: "طلبات المزارع والتجارة والتصدير" },
    { label: "من نحن", href: "/about", hint: "لماذا نعمل هذا" },
    { label: "تواصل", href: "/contact", hint: "تحدّث إلى المبيعات" },
  ],
  footer: [
    {
      title: "المنتجات",
      links: [
        { label: "كل البالات", href: "/products" },
        { label: "بالات دائرية", href: "/products?format=round" },
        { label: "بالات مربّعة", href: "/products?format=square" },
        { label: "بالات مدمجة", href: "/products?format=compact" },
        { label: "الجملة والطلبات الخاصة", href: "/products/bulk-custom-order" },
      ],
    },
    {
      title: "الشركة",
      links: [
        { label: "من نحن", href: "/about" },
        { label: "الجودة", href: "/quality" },
        { label: "عمليتنا", href: "/process" },
        { label: "اللوجستيات", href: "/logistics" },
        { label: "تواصل", href: "/contact" },
      ],
    },
    {
      title: "أدوات",
      links: [
        { label: "اعثر على بالتك", href: "/#finder" },
        { label: "حاسبة السيلاج", href: "/quote#calculator" },
        { label: "قارن الصيغ", href: "/quality#compare" },
        { label: "الأسئلة الشائعة", href: "/#faq" },
        { label: "اطلب عرض سعر", href: "/quote" },
      ],
    },
  ],
  legal: [
    { label: "الخصوصية", href: "/privacy" },
    { label: "الشروط", href: "/terms" },
    { label: "ملفات الارتباط", href: "/cookies" },
  ],
};
