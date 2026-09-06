import type { NextConfig } from "next";

/**
 * EXTERNAL ORIGINS
 * --------------------------------------------------------------------
 * Every host this site talks to, in one list, so the CSP below and the
 * image config below cannot drift apart.
 *
 * `images.unsplash.com` is TEMPORARY — prototype photography. When owned
 * photography replaces it (see data/media.ts and PRE-LAUNCH.md §4),
 * delete the entry here and the remotePattern below, and the CSP tightens
 * automatically.
 */
const IMAGE_ORIGINS = ["https://images.unsplash.com"];

/**
 * Content-Security-Policy.
 *
 * Deliberately not maximal. Next.js needs `'unsafe-inline'` for its
 * injected styles, and the App Router needs `'unsafe-eval'` in
 * development for React Refresh. A CSP that breaks the framework gets
 * switched off by the next developer, which is worse than a moderate one
 * that survives.
 *
 * What this does buy: no plugins, no framing, no base-tag hijack, no
 * form posts to third parties, and a closed list of image origins.
 */
function contentSecurityPolicy(isDev: boolean): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", isDev ? "'unsafe-eval'" : ""]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${IMAGE_ORIGINS.join(" ")}`,
    "font-src 'self' data:",
    // The RFQ posts to this origin. Add an external endpoint here if
    // NEXT_PUBLIC_FORMS_ENDPOINT points somewhere else.
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /*
   * Testing the dev server from a phone on the same network is blocked
   * by default. Set NEXT_DEV_ORIGIN to your machine's LAN address to
   * allow it — e.g. NEXT_DEV_ORIGIN=192.168.100.206 npm run dev.
   * Development only; it has no effect on a production build.
   */
  allowedDevOrigins: process.env.NEXT_DEV_ORIGIN ? [process.env.NEXT_DEV_ORIGIN] : [],
  images: {
    // Prototype photography is served from Unsplash. When you replace the
    // imagery (see data/media.ts) remove this pattern and the matching
    // entry in IMAGE_ORIGINS above, or swap in your own CDN.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [60, 70, 75, 85],
    deviceSizes: [360, 430, 640, 768, 1024, 1280, 1536, 1920, 2560],
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy(isDev) },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing on this site needs a camera, a microphone or a
          // location. Denying them costs nothing and closes the door.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        /*
         * The admin panel: never indexed, never cached. The proxy sets
         * X-Robots-Tag too; this covers the route handlers under /admin
         * (sign-out, CSV export) whichever layer answers first, and the
         * no-store keeps a CDN from holding a page of buyer data.
         */
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        // The RFQ endpoint must never be cached by a CDN or a browser.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
