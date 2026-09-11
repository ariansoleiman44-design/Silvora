import { test } from "node:test";
import assert from "node:assert/strict";
import { foldSearchText, searchProducts } from "../lib/search.ts";
import { products } from "../data/products.ts";
import { productsAr } from "../data/ar/products.ar.ts";

/**
 * SEARCH ACROSS FOUR LOCALES
 * --------------------------------------------------------------------
 * The catalogue is written in proper Arabic — hamza seats, taa marbuta,
 * sometimes vowel marks. Buyers on phones type none of that. Before the
 * folding below, an Arabic or Kurdish buyer searching for the square
 * bale got zero results, on a site built for Arabic and Kurdish buyers.
 */

/** The Arabic catalogue as searchProducts receives it: base + overlay. */
const arabicCatalogue = products.map((p) => ({ ...p, ...(productsAr[p.slug] ?? {}) }));

const labels = {
  format: { round: "دائرية", square: "مربعة", compact: "مدمجة", custom: "مخصصة" },
  application: { dairy: "ألبان", beef: "لحوم", "sheep-goats": "أغنام", general: "عام" },
  orderType: { "small-farm": "مزرعة", commercial: "تجاري", bulk: "بالجملة", export: "تصدير" },
};

/* ---------------------------------------------------------- folding */

test("tashkeel and tatweel are ignored", () => {
  assert.equal(foldSearchText("مربّعة"), foldSearchText("مربعة"));
  assert.equal(foldSearchText("سـيلاج"), foldSearchText("سيلاج"));
});

test("hamza seats fold to plain alif", () => {
  for (const variant of ["أعلاف", "إعلاف", "آعلاف"]) {
    assert.equal(foldSearchText(variant), foldSearchText("اعلاف"), variant);
  }
});

test("taa marbuta and alif maqsura fold to their common spellings", () => {
  assert.equal(foldSearchText("مربعة"), foldSearchText("مربعه"));
  assert.equal(foldSearchText("على"), foldSearchText("علي"));
});

test("Arabic-Indic digits fold to ASCII", () => {
  assert.equal(foldSearchText("٤٠"), "40");
  assert.equal(foldSearchText("۴۰"), "40");
});

test("Latin text is left alone apart from case", () => {
  assert.equal(foldSearchText("Round Bale"), "round bale");
});

/* ----------------------------------------------------------- search */

test("English search still works", () => {
  const hits = searchProducts("round", { products });
  assert.ok(hits.length > 0);
});

test("REGRESSION: an Arabic buyer's spelling finds the product", () => {
  // The catalogue writes «مربّعة»; a phone keyboard produces «مربعة».
  const hits = searchProducts("مربعة", { products: arabicCatalogue, labels });
  assert.ok(hits.length > 0, "searching the square bale in Arabic returned nothing");
});

test("REGRESSION: the simplified spelling with ه also finds it", () => {
  const hits = searchProducts("مربعه", { products: arabicCatalogue, labels });
  assert.ok(hits.length > 0);
});

test("an Arabic term matching nothing returns nothing, not everything", () => {
  assert.equal(searchProducts("زززز", { products: arabicCatalogue, labels }).length, 0);
});

test("every term must match — search narrows rather than widens", () => {
  const one = searchProducts("bale", { products });
  const two = searchProducts("bale export", { products });
  assert.ok(two.length <= one.length);
});

test("an empty query returns nothing rather than the whole catalogue", () => {
  assert.equal(searchProducts("   ", { products }).length, 0);
});
