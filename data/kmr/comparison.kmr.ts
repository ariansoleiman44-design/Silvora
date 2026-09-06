import type { Dictionary } from "@/data/dictionaries";

/** بەراوردکرنا شێوان — کوردیا بادینی. DRAFT. */
export const comparisonKmr: Dictionary["comparison"] = {
  columns: [
    { key: "round", label: "خڕ", productSlug: "premium-round-bale" },
    { key: "square", label: "چوارگۆشە", productSlug: "square-silage-bale" },
    { key: "high-density", label: "چڕیا بلند", productSlug: "high-density-square-bale" },
    { key: "compact", label: "بچویک", productSlug: "compact-mini-bale" },
  ],
  rows: [
    {
      label: "دەستێدان",
      values: {
        round: "هەلگرێ بالەیان یێ ئاسایی",
        square: "هەلگرێ ئاسایی یان چەتال",
        "high-density": "هەلگرێ ب شیانا بلندتر",
        compact: "لۆدەرێ بچویک یان ب دەست ب قایشان",
      },
    },
    {
      label: "هەلگرتن",
      values: {
        round: "ل دەرڤە، ل سەر ڕویێ تەخت، دو چین",
        square: "ڕێزبار، د ناڤ یان دەرڤە",
        "high-density": "ڕێزبار بۆ هەلگرتنا درێژ",
        compact: "ل دەرڤە یان بن نڤێنێ، ڕێزێن نزم",
      },
    },
    {
      label: "جورێ داخوازێ یێ باو",
      values: {
        round: "ژ پلانگەها بچویک هەتا بازرگانی",
        square: "ژ پلانگەها بچویک هەتا بازرگانی",
        "high-density": "بازرگانی، بکومی، هەناردەکرن",
        compact: "پلانگەها بچویک",
      },
    },
    {
      label: "کارایا گوهاستنێ",
      values: {
        round: "باش",
        square: "پر باش",
        "high-density": "باشترین د کۆمەلێ دا",
        compact: "باش بۆ بارێن بچویک",
      },
    },
    {
      label: "قەبارەیا پلانگەهێ",
      values: {
        round: "هەر کەرییەک ڕۆژانە بالەیەکێ بکار دئینیت",
        square: "حەوشێن ب جهێ سنووردار",
        "high-density": "یەکێن مەزن، گوهاستنا دویر",
        compact: "کەریێن پەزی و مولکێن بچویک",
      },
    },
    {
      label: "نەرمیا خوارندانێ",
      values: {
        round: "خوارندان ب بالەیا تەمام",
        square: "ئاسان بۆ پارڤەکرنێ",
        "high-density": "بالەیا تەمام، ب ڕێژەیا بلند",
        compact: "زوی دئێتە ڤەکرن و تەمام دبیت",
      },
    },
  ],
};
