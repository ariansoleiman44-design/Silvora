"use client";

import NextLink from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { useLocalePath } from "@/lib/locale-client";

/**
 * LOCALE-AWARE LINK
 * --------------------------------------------------------------------
 * A drop-in replacement for `next/link` that keeps the reader in the
 * language they are reading.
 *
 *   English page → /products
 *   Arabic page  → /ar/products
 *
 * Every `href` in the codebase stays a canonical, unprefixed path, so no
 * component has to know which locale it is being rendered in — and a
 * translated navigation file cannot drift out of sync with the routes.
 *
 * Untouched: absolute URLs, `mailto:`, `tel:`, `wa.me` and anything that
 * is not a site-relative path.
 */
type LocaleLinkProps = ComponentPropsWithoutRef<typeof NextLink>;

export function LocaleLink({ href, ...rest }: LocaleLinkProps) {
  const withLocale = useLocalePath();
  const localized = typeof href === "string" ? withLocale(href) : href;
  return <NextLink href={localized} {...rest} />;
}

export default LocaleLink;
