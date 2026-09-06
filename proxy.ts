import { NextResponse, type NextRequest } from "next/server";
import { activeLocales, defaultLocale } from "@/lib/i18n";

/**
 * LOCALE ROUTING (Next.js "proxy" convention — formerly middleware)
 * --------------------------------------------------------------------
 * One set of route files lives under `app/[locale]`. This rewrite maps
 * public URLs onto it:
 *
 *   /products      →  /en/products     (rewrite — the URL does not change)
 *   /ar/products   →  /ar/products     (already prefixed, passed through)
 *
 * English therefore keeps its existing unprefixed URLs — nothing that
 * was already indexed or shared breaks — while Arabic gets real,
 * shareable, indexable paths.
 *
 * The `matcher` below excludes API routes, Next internals and any path
 * with a file extension, so assets and /api/quote are untouched.
 */

const PREFIXED = activeLocales.filter((l) => l !== defaultLocale);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasPrefix = PREFIXED.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  // Already addressed with a locale — let it through untouched.
  if (hasPrefix) return NextResponse.next();

  // Rewrite the unprefixed (default-locale) path onto the same tree.
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;

  const response = NextResponse.rewrite(url);
  // Useful for logging and for any handler that needs the locale.
  response.headers.set("x-silvora-locale", defaultLocale);
  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *   /api/*        route handlers
     *   /_next/*      framework internals
     *   files with an extension (images, fonts, robots.txt, sitemap.xml…)
     */
    "/((?!api|_next|.*\\.[\\w]+$).*)",
  ],
};
