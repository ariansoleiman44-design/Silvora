/**
 * MEDIA REGISTRY
 * --------------------------------------------------------------------
 * Every photograph used on the site is defined here and referenced by
 * key elsewhere. To replace the prototype photography:
 *
 *   1. Drop your files into /public/images/…
 *   2. Change the `src` below to "/images/your-file.jpg"
 *   3. Update the alt text (it is used for accessibility and SEO)
 *
 * Nothing else in the codebase needs to change. During the prototype
 * phase the imagery is served from Unsplash (free licence) through
 * Next.js image optimisation.
 *
 * REPLACING IMAGERY (see also PRE-LAUNCH.md §4 and README):
 *
 *   1. Master image → crop to the ratio this key uses
 *   2. Export ~2400px wide, quality 80 (Next re-encodes to AVIF/WebP)
 *   3. Save to public/media/<key>.jpg
 *   4. Change `src` to "/media/<key>.jpg", update `alt`, and set
 *      `owned: true` with `photographer` / `license`
 *
 * Do NOT bake colour grading into the source files. The `graded`
 * treatment in styles/globals.css is what makes mixed material read as
 * one Corn Fodder shoot, and it stays applied to owned photography too.
 *
 * CURATION RULE — every frame must be unmistakably *this* business:
 * wrapped silage bales, maize, forage machinery, the herds that eat it.
 * Dry hay, generic pasture and scenic landscape were deliberately
 * removed; several keys now share a source frame at different crops so
 * the site reads as one shoot rather than a stock search. Every image
 * is also colour-matched at render time by the `graded` treatment in
 * styles/globals.css.
 */

export interface MediaAsset {
  src: string;
  alt: string;
  /** Intrinsic aspect ratio hint for layout (width / height). */
  ratio?: number;
  /** Optional attribution kept for the prototype. */
  credit?: string;

  /* ---------------------------------------------------- Provenance */
  /**
   * Rights metadata. None of this is rendered — it exists so stock
   * photography can be replaced responsibly, and so the launch audit can
   * tell owned images from borrowed ones.
   */
  photographer?: string;
  /** e.g. "Unsplash", "Commissioned", "Client supplied". */
  source?: string;
  /** e.g. "Unsplash License", "All rights reserved". */
  license?: string;
  copyright?: string;
  /** True once this is Corn Fodder's own photography. */
  owned?: boolean;
  /** Focal point 0–1 for art-directed cropping, e.g. [0.5, 0.35]. */
  focalPoint?: [number, number];
}

interface UnsplashOptions {
  /** Requested width from the origin (Next.js resizes below this). */
  w?: number;
  /** Aspect ratio crop, e.g. "4:5". */
  ar?: string;
  /** Focal point 0–1 for the crop. */
  fp?: [number, number];
  /** Focal-point zoom (1 = no zoom). */
  zoom?: number;
}

/**
 * The one external origin the pages fetch from. The root layout
 * preconnects to it so the LCP image is not delayed by a cold DNS +
 * TLS handshake, and next.config.ts allows it in the CSP and in
 * `images.remotePatterns`.
 *
 * When owned photography replaces the prototype set, this export goes
 * away with it and the preconnect, the CSP entry and the remote pattern
 * all come out together.
 */
export const remoteImageOrigin = "https://images.unsplash.com";

function unsplash(id: string, opts: UnsplashOptions = {}): string {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    q: "80",
    w: String(opts.w ?? 1800),
  });
  if (opts.ar) params.set("ar", opts.ar);
  if (opts.fp) {
    params.set("crop", "focalpoint");
    params.set("fp-x", opts.fp[0].toString());
    params.set("fp-y", opts.fp[1].toString());
    if (opts.zoom) params.set("fp-z", opts.zoom.toString());
  }
  return `${remoteImageOrigin}/photo-${id}?${params.toString()}`;
}

export const media = {
  /* ---------------------------------------------------------------- Heroes */
  /*
   * The homepage hero still. This one is a local file, not Unsplash: it
   * is a frame taken from public/media/hero-bales.mp4, so the still and
   * the video are the same shot and there is no visible change of scene
   * when the video fades in over it.
   *
   * It is the LCP element on the homepage. The video never is — see
   * components/home/HeroVideo.tsx.
   */
  homeHeroPoster: {
    src: "/media/hero-bales-poster.jpg",
    alt: "Wrapped corn silage bales across a mown field under a heavy sky",
    ratio: 16 / 9,
  },
  homeHero: {
    // The hero should show the product, not the crop: a wrapped silage
    // bale is what the business sells. Cropped low and wide so the bales
    // sit in the lower third, clear of the headline.
    src: unsplash("1641449156668-5b5214c4c966", { w: 2400, ar: "16:9", fp: [0.5, 0.62], zoom: 1.1 }),
    alt: "Wrapped corn silage bales across a field under a dramatic sky",
    ratio: 16 / 9,
  },
  productsHero: {
    src: unsplash("1641449156668-5b5214c4c966", { w: 2400 }),
    alt: "Rows of white wrapped silage bales on a green field under a dramatic sky",
    ratio: 4 / 5,
  },
  qualityHero: {
    src: unsplash("1571342574841-80ba1dfc8d4f", { w: 2400 }),
    alt: "Ripe ear of corn in low warm light against a dark husk",
    ratio: 3 / 2,
  },
  logisticsHero: {
    src: unsplash("1761618525947-746cb6d3f17a", { w: 2400 }),
    alt: "Wrapped silage bales lined up on a dry field with hills behind",
    ratio: 3 / 2,
  },
  aboutHero: {
    src: unsplash("1629797716077-4688ef7aa935", { w: 2400 }),
    alt: "Sunrise over a young crop field with a lone tree on the horizon",
    ratio: 3 / 2,
  },
  contactHero: {
    src: unsplash("1706164161497-ef2e3e58c7ad", { w: 2400 }),
    alt: "Mature corn field under a soft evening sky",
    ratio: 3 / 2,
  },
  quoteHero: {
    src: unsplash("1656048198183-15696196d852", { w: 2000 }),
    alt: "A neat stack of white wrapped silage bales at the edge of a field",
    ratio: 4 / 5,
  },
  processHero: {
    src: unsplash("1759560655908-27ece13f8a5c", { w: 2400 }),
    alt: "Forage harvester chopping maize and loading a trailer",
    ratio: 3 / 2,
  },

  /* ----------------------------------------------------- Brand statement */
  cornPlant: {
    src: unsplash("1511817354854-e361703ac368", { w: 1600 }),
    alt: "Golden ear of corn opening on the plant",
    ratio: 3 / 2,
  },
  seedling: {
    src: unsplash("1598961948358-df15791f5395", { w: 1200 }),
    alt: "Corn seedling emerging from dark soil",
    ratio: 3 / 2,
  },
  youngRows: {
    src: unsplash("1625246333195-78d9c38ad449", { w: 1600 }),
    alt: "Young corn plants in straight rows on dark soil",
    ratio: 3 / 2,
  },

  /* ------------------------------------------------------------ Bales */
  balesField: {
    src: unsplash("1641449156668-5b5214c4c966", { w: 1800 }),
    alt: "White wrapped silage bales scattered across a green field",
    ratio: 4 / 5,
  },
  balesStack: {
    src: unsplash("1656048198183-15696196d852", { w: 1800 }),
    alt: "Stacked white wrapped silage bales beside a tree line",
    ratio: 4 / 5,
  },
  baleClose: {
    src: unsplash("1682202930196-520693bbbe8b", { w: 1800 }),
    alt: "Close view of tightly wrapped white silage bales",
    ratio: 4 / 5,
  },
  baleEnd: {
    src: unsplash("1641449156668-5b5214c4c966", { w: 1400, ar: "1:1", fp: [0.28, 0.78], zoom: 1.6 }),
    alt: "A single white wrapped silage bale standing on a green field",
    ratio: 1,
  },
  baleGolden: {
    src: unsplash("1761618525947-746cb6d3f17a", { w: 1800, ar: "3:2" }),
    alt: "Wrapped silage bales lined up on a field in low evening light",
    ratio: 3 / 2,
  },
  balesSunset: {
    src: unsplash("1782207296145-8fa9def37d10", { w: 2400, ar: "3:2" }),
    alt: "Wrapped silage bales across a field in late evening light",
    ratio: 3 / 2,
  },
  balesRow: {
    src: unsplash("1768140429905-eee11aec848d", { w: 1600, ar: "3:2" }),
    alt: "Wrapped silage bales in a neat row along a field edge",
    ratio: 3 / 2,
  },
  balesSmall: {
    src: unsplash("1784807903300-72d6ee94523a", { w: 1600, ar: "3:2" }),
    alt: "A line of wrapped silage bales on green pasture",
    ratio: 3 / 2,
  },
  baleTexture: {
    src: unsplash("1682202930196-520693bbbe8b", { w: 1600, ar: "3:2", fp: [0.5, 0.55], zoom: 1.5 }),
    alt: "Close texture of tightly stretched wrapping film on a silage bale",
    ratio: 3 / 2,
  },
  squareStack: {
    src: unsplash("1647031629436-7304f4915370", { w: 1600 }),
    alt: "Tightly stacked square bales showing dense, even compaction",
    ratio: 3 / 2,
  },
  squareSingle: {
    src: unsplash("1647031629436-7304f4915370", { w: 1600, ar: "3:2", fp: [0.5, 0.5], zoom: 1.35 }),
    alt: "Square silage bale showing dense, even compaction",
    ratio: 3 / 2,
  },
  balesBlack: {
    src: unsplash("1710859200884-68a76130c7ea", { w: 1600 }),
    alt: "Black wrapped silage bales resting in a grass field",
    ratio: 3 / 2,
  },
  balesGreenWrap: {
    src: unsplash("1768140429905-eee11aec848d", { w: 1600 }),
    alt: "Green wrapped silage bales in a grassy field with trees",
    ratio: 3 / 2,
  },
  balesHills: {
    src: unsplash("1784807903300-72d6ee94523a", { w: 1600 }),
    alt: "Wrapped bales in a rural field with distant hills",
    ratio: 3 / 2,
  },
  balesTurbines: {
    src: unsplash("1756157056818-60a81a6245de", { w: 1800, ar: "3:2" }),
    alt: "Tractor and trailer moving freshly chopped maize off the field",
    ratio: 3 / 2,
  },
  balesClouds: {
    src: unsplash("1641449156668-5b5214c4c966", { w: 1600, ar: "3:2" }),
    alt: "Wrapped silage bales on a green field under a dramatic sky",
    ratio: 3 / 2,
  },
  balesScattered: {
    src: unsplash("1782207296145-8fa9def37d10", { w: 1600 }),
    alt: "Wrapped bales scattered across a green field with trees",
    ratio: 3 / 2,
  },
  silageTube: {
    src: unsplash("1689796975697-e1735a01b55a", { w: 1600 }),
    alt: "Long silage tube stored along a tree line",
    ratio: 3 / 2,
  },

  /* ----------------------------------------------------------- Harvest */
  harvester: {
    src: unsplash("1759560655908-27ece13f8a5c", { w: 1800 }),
    alt: "Self-propelled forage harvester loading chopped maize into a trailer",
    ratio: 3 / 2,
  },
  harvesterLoading: {
    src: unsplash("1759044858199-d7a134354c11", { w: 1800 }),
    alt: "Harvester filling a trailer at the edge of a maize field",
    ratio: 3 / 2,
  },
  harvesterHead: {
    src: unsplash("1756156977359-a03f5786ef67", { w: 1800 }),
    alt: "Harvester header cutting through standing maize",
    ratio: 3 / 2,
  },
  tractorTrailer: {
    src: unsplash("1756157056818-60a81a6245de", { w: 1800 }),
    alt: "Tractor and trailer carrying freshly chopped maize",
    ratio: 3 / 2,
  },
  compaction: {
    src: unsplash("1718470822407-f347f8a17798", { w: 1800 }),
    alt: "Tractor compacting chopped forage on a silage clamp",
    ratio: 3 / 2,
  },
  combineSunset: {
    src: unsplash("1601995163168-0894a017d6d1", { w: 2000 }),
    alt: "Harvester crossing a golden field as the sun sets",
    ratio: 3 / 2,
  },
  aerialField: {
    src: unsplash("1731361183753-92449577ad30", { w: 1800 }),
    alt: "Aerial view of a farm field with a tractor at work",
    ratio: 3 / 2,
  },
  aerialNight: {
    src: unsplash("1633060849433-7ded4b476e8d", { w: 1800 }),
    alt: "Tractor and trailer crossing a dark field seen from above",
    ratio: 3 / 2,
  },
  harvestGolden: {
    src: unsplash("1700241752363-60fe6ebfd38b", { w: 2000 }),
    alt: "Tractor and grain cart in a golden corn field with sun flare",
    ratio: 3 / 2,
  },

  /* -------------------------------------------------------------- Crop */
  cornDark: {
    src: unsplash("1571965403782-e130292dafd0", { w: 1800 }),
    alt: "Ear of corn in deep shadow with kernels catching the light",
    ratio: 3 / 2,
  },
  cornSun: {
    src: unsplash("1762725770569-9a454aad8247", { w: 1600 }),
    alt: "Close-up of a ripe ear of corn in sunlight",
    ratio: 3 / 2,
  },
  cornKernels: {
    src: unsplash("1765337094670-b91926662b1f", { w: 1600 }),
    alt: "Close-up of ripe corn kernels",
    ratio: 3 / 2,
  },
  cornLeaves: {
    src: unsplash("1693672843048-82d7c1a20974", { w: 1800 }),
    alt: "Green corn leaves filling the frame",
    ratio: 3 / 2,
  },
  cornFieldInside: {
    src: unsplash("1634729609724-755326675bbb", { w: 1800 }),
    alt: "Inside a corn field with light breaking through the canopy",
    ratio: 3 / 2,
  },
  cornFieldSky: {
    src: unsplash("1567547921486-f280c2f53b5d", { w: 1800 }),
    alt: "Tall corn plants against a bright sky",
    ratio: 3 / 2,
  },
  cornHorizon: {
    src: unsplash("1565712317171-611989a52d19", { w: 1800 }),
    alt: "Corn field stretching to the horizon",
    ratio: 3 / 2,
  },
  cornPath: {
    src: unsplash("1693672843238-737e13d6b86f", { w: 1800 }),
    alt: "Dirt track running between two walls of corn",
    ratio: 3 / 2,
  },
  cornMature: {
    src: unsplash("1706164161497-ef2e3e58c7ad", { w: 1800 }),
    alt: "Mature corn field ready for harvest",
    ratio: 3 / 2,
  },
  farmerInCorn: {
    src: unsplash("1602867741746-6df80f40b3f6", { w: 1600 }),
    alt: "Farmer walking through tall corn",
    ratio: 3 / 2,
  },

  /* --------------------------------------------------------- Livestock */
  dairyBarn: {
    src: unsplash("1636998980792-63f27ddea4e3", { w: 1800 }),
    alt: "Dairy cows feeding at the barrier of a modern barn",
    ratio: 3 / 2,
  },
  cattleFeeding: {
    src: unsplash("1504868433093-25555d9c0796", { w: 1800 }),
    alt: "Beef cattle feeding together on forage",
    ratio: 3 / 2,
  },
  cattleHeads: {
    src: unsplash("1504867841338-3da010c6152c", { w: 1600 }),
    alt: "Cattle with heads down feeding",
    ratio: 3 / 2,
  },
  holsteinGolden: {
    src: unsplash("1593768697824-f31b967e6c55", { w: 1600 }),
    alt: "Holstein cow in golden evening light",
    ratio: 3 / 2,
  },
  holsteinHerd: {
    src: unsplash("1580570598977-4b2412d01bbc", { w: 1600 }),
    alt: "Herd of Holstein cows on pasture",
    ratio: 3 / 2,
  },
  herdRidge: {
    src: unsplash("1511199791920-1675ac669a78", { w: 1600 }),
    alt: "Cows on a green ridge against a blue sky",
    ratio: 3 / 2,
  },

  /* --------------------------------------------------------- Landscape */
  goldenSunset: {
    src: unsplash("1700241739138-4ec27c548035", { w: 2400, ar: "3:2" }),
    alt: "Golden maize field at harvest in low evening light",
    ratio: 3 / 2,
  },
  rollingFarm: {
    src: unsplash("1565712317171-611989a52d19", { w: 1800, ar: "3:2" }),
    alt: "Maize field stretching to the horizon in evening light",
    ratio: 3 / 2,
  },
} satisfies Record<string, MediaAsset>;

export type MediaKey = keyof typeof media;

export function getMedia(key: MediaKey): MediaAsset {
  return media[key];
}
