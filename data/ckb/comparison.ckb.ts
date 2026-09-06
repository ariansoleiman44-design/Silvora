import type { Dictionary } from "@/data/dictionaries";

/**
 * بەراوردی شێوەکان — کوردیی سۆرانی.
 * `key` and `productSlug` are structural and stay in English.
 * Values are positioning statements, not measured performance claims.
 */
export const comparisonCkb: Dictionary["comparison"] = {
  columns: [
    { key: "round", label: "خڕ", productSlug: "premium-round-bale" },
    { key: "square", label: "چوارگۆشە", productSlug: "square-silage-bale" },
    { key: "high-density", label: "چڕی بەرز", productSlug: "high-density-square-bale" },
    { key: "compact", label: "چڕ", productSlug: "compact-mini-bale" },
  ],
  rows: [
    {
      label: "دەستکاری",
      values: {
        round: "هەڵگری بالەی ئاسایی",
        square: "هەڵگری ئاسایی یان چەتاڵ",
        "high-density": "هەڵگری بە توانایی بەرزتر",
        compact: "لۆدەری بچووک یان بە دەست بە پشتێن",
      },
    },
    {
      label: "هەڵگرتن",
      values: {
        round: "لە دەرەوە، لەسەر ڕووە تەختەکە، دوو چین",
        square: "ڕیزکراو، لە ناوەوە یان دەرەوە",
        "high-density": "ڕیزکراو بۆ هەڵگرتنی درێژخایەن",
        compact: "لە دەرەوە یان ژێر داپۆشین، ڕیزی نزم",
      },
    },
    {
      label: "جۆری داواکاریی باو",
      values: {
        round: "لە کێڵگەی بچووکەوە تا بازرگانی",
        square: "لە کێڵگەی بچووکەوە تا بازرگانی",
        "high-density": "بازرگانی، کۆمەڵ، هەناردە",
        compact: "کێڵگەی بچووک",
      },
    },
    {
      label: "کارایی گواستنەوە",
      values: {
        round: "باش",
        square: "زۆر باش",
        "high-density": "باشترین لە کۆمەڵەکەدا",
        compact: "باش بۆ باری بچووک",
      },
    },
    {
      label: "قەبارەی کێڵگە",
      values: {
        round: "هەر مێگەلێک ڕۆژانە بالەیەک بەکاردەهێنێت",
        square: "حەوشەی بە شوێنی سنووردار",
        "high-density": "یەکەی گەورە، گواستنەوەی دوور",
        compact: "مێگەلی مەڕ و موڵکی بچووک",
      },
    },
    {
      label: "نەرمیی خۆراکدان",
      values: {
        round: "خۆراکدان بە بالەی تەواو",
        square: "ئاسان بۆ بەشکردن",
        "high-density": "بالەی تەواو، بە ڕێژەی بەرز",
        compact: "خێرا دەکرێتەوە و تەواو دەبێت",
      },
    },
  ],
};
