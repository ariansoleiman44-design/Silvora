import { NextResponse, type NextRequest } from "next/server";
import { activeLocales, defaultLocale } from "@/lib/i18n";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/server/admin-auth";

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
 *
 * /admin is handled separately below: it is a single English-only tree
 * that must never be locale-rewritten (/admin would otherwise become
 * /en/admin and 404), and it is the one part of the site behind a
 * session check.
 */

const PREFIXED = activeLocales.filter((l) => l !== defaultLocale);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return guardAdmin(request, pathname);
  }

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
  response.headers.set("x-cornfodder-locale", defaultLocale);
  return response;
}

/**
 * The gate in front of the whole panel.
 *
 * Checking here rather than in each page means a new admin route is
 * protected the moment it exists — the failure mode of per-page checks
 * is the page someone forgets. The signature check is HMAC only, no
 * database round trip, so it costs nothing on the edge.
 *
 * The login page itself must stay reachable, and so must the login POST
 * handler, or there would be no way to obtain a session.
 */
function guardAdmin(request: NextRequest, pathname: string) {
  const isLoginRoute = pathname === "/admin/login";
  const authenticated = verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);

  // Already signed in and staring at the login form — send them inside.
  if (isLoginRoute && authenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!isLoginRoute && !authenticated) {
    const login = new URL("/admin/login", request.url);
    // Come back to the page they actually wanted after signing in.
    // Only a path is carried, never a full URL, so this cannot be used
    // as an open redirect to another site.
    if (pathname !== "/admin") login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const response = NextResponse.next();
  // Belt and braces with the header in next.config.ts: the admin panel
  // must never be indexed, whichever layer answers.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    /*
     * /admin is matched FIRST and unconditionally.
     *
     * The pattern below excludes anything whose last segment contains a
     * dot, so that static files are not rewritten. That exclusion also
     * silently removed /admin paths with a dotted parameter — a
     * reference like "gt.A" or an id like "neq.z" — from the matcher
     * entirely, which meant proxy() never ran and guardAdmin never
     * fired. /admin/requests/gt.A returned 200 with a buyer's name,
     * email, phone and internal notes to anyone, signed in or not.
     *
     * An authentication boundary must never be a side effect of a
     * file-extension heuristic. This entry has no exclusions, so every
     * /admin path reaches the guard no matter what it contains.
     */
    "/admin/:path*",
    /*
     * Everything else except:
     *   /api/*        route handlers
     *   /_next/*      framework internals
     *   files with an extension (images, fonts, robots.txt, sitemap.xml…)
     */
    "/((?!api|_next|.*\\.[\\w]+$).*)",
  ],
};
