import type { Dictionary } from "@/data/dictionaries";

/** ڕێبەری — کوردیا بادینی. DRAFT. hrefs stay canonical and unprefixed. */
export const navigationKmr: Dictionary["nav"] = {
  main: [
    { label: "بەرهەم", href: "/products", hint: "شێوە و تایبەتمەندیێن بالەیان" },
    { label: "کوالیتی", href: "/quality", hint: "ژ بەرهەمی هەتا پشکنینێ" },
    { label: "پرۆسێسا مە", href: "/process", hint: "ژ زەڤییێ بۆ خوارنێ ب هەشت گاڤان" },
    { label: "لۆجستیک", href: "/logistics", hint: "داخوازێن پلانگەهێ، بازرگانی و هەناردەکرنێ" },
    { label: "دەربارە", href: "/about", hint: "بۆچی ئەم ڤی کاری دکەین" },
    { label: "پەیوەندی", href: "/contact", hint: "دگەل فرۆتنێ باخڤە" },
  ],
  footer: [
    {
      title: "بەرهەم",
      links: [
        { label: "هەمی بالە", href: "/products" },
        { label: "بالێن خڕ", href: "/products?format=round" },
        { label: "بالێن چوارگۆشە", href: "/products?format=square" },
        { label: "بالێن بچویک", href: "/products?format=compact" },
        { label: "بکومی و داخوازا تایبەت", href: "/products/bulk-custom-order" },
      ],
    },
    {
      title: "کۆمپانیا",
      links: [
        { label: "دەربارە", href: "/about" },
        { label: "کوالیتی", href: "/quality" },
        { label: "پرۆسێسا مە", href: "/process" },
        { label: "لۆجستیک", href: "/logistics" },
        { label: "پەیوەندی", href: "/contact" },
      ],
    },
    {
      title: "ئامیر",
      links: [
        { label: "بالەیا خۆ بدۆزە", href: "/#finder" },
        { label: "ژمێرەرا سایلێجی", href: "/quote#calculator" },
        { label: "بەراوردکرنا شێوان", href: "/quality#compare" },
        { label: "پرسیارێن دووبارە", href: "/#faq" },
        { label: "داخوازا بهایێ بکە", href: "/quote" },
      ],
    },
  ],
  legal: [
    { label: "تایبەتمەندی", href: "/privacy" },
    { label: "مەرج", href: "/terms" },
    { label: "کوکی", href: "/cookies" },
  ],
};
