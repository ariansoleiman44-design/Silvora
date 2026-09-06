import type { Dictionary } from "@/data/dictionaries";

/**
 * ڕێنیشاندەر — کوردیی سۆرانی.
 * `href` values are canonical, unprefixed paths; the locale prefix is
 * added at render time by localePath() / useLocalePath().
 */
export const navigationCkb: Dictionary["nav"] = {
  main: [
    { label: "بەرهەمەکان", href: "/products", hint: "شێوە و تایبەتمەندیی بالەکان" },
    { label: "کوالیتی", href: "/quality", hint: "لە بەروبوومەوە بۆ پشکنین" },
    { label: "پرۆسەکەمان", href: "/process", hint: "لە کێڵگەوە بۆ خۆراک بە هەشت هەنگاو" },
    { label: "لۆجستیک", href: "/logistics", hint: "داواکاریی کێڵگە، بازرگانی و هەناردە" },
    { label: "دەربارە", href: "/about", hint: "بۆچی ئەم کارە دەکەین" },
    { label: "پەیوەندی", href: "/contact", hint: "قسە لەگەڵ فرۆشتن بکە" },
  ],
  footer: [
    {
      title: "بەرهەمەکان",
      links: [
        { label: "هەموو بالەکان", href: "/products" },
        { label: "بالەی خڕ", href: "/products?format=round" },
        { label: "بالەی چوارگۆشە", href: "/products?format=square" },
        { label: "بالەی چڕ", href: "/products?format=compact" },
        { label: "کۆمەڵ و داواکاریی تایبەت", href: "/products/bulk-custom-order" },
      ],
    },
    {
      title: "کۆمپانیا",
      links: [
        { label: "دەربارە", href: "/about" },
        { label: "کوالیتی", href: "/quality" },
        { label: "پرۆسەکەمان", href: "/process" },
        { label: "لۆجستیک", href: "/logistics" },
        { label: "پەیوەندی", href: "/contact" },
      ],
    },
    {
      title: "ئامرازەکان",
      links: [
        { label: "بالەکەت بدۆزەرەوە", href: "/#finder" },
        { label: "ژمێرەری سایلێج", href: "/quote#calculator" },
        { label: "بەراوردی شێوەکان", href: "/quality#compare" },
        { label: "پرسیارە دووبارەکان", href: "/#faq" },
        { label: "داوای نرخ بکە", href: "/quote" },
      ],
    },
  ],
  legal: [
    { label: "تایبەتمەندی", href: "/privacy" },
    { label: "مەرجەکان", href: "/terms" },
    { label: "کوکیەکان", href: "/cookies" },
  ],
};
