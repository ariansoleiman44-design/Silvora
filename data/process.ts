import type { MediaKey } from "@/data/media";

export interface ProcessStep {
  index: number;
  title: string;
  /** Short verb-led line. */
  summary: string;
  detail: string;
  image: MediaKey;
}

/** The "From Field to Feed" story. Used on the homepage and /process. */
export const processSteps: ProcessStep[] = [
  {
    index: 1,
    title: "Grow",
    summary: "The right maize in the right soil.",
    detail:
      "Silage quality is decided in the field. Crop selection, planting density and soil care set the ceiling for everything that follows.",
    image: "seedling",
  },
  {
    index: 2,
    title: "Harvest",
    summary: "Cut at the moment the plant is ready.",
    detail:
      "Timing balances yield, starch and moisture. Harvesting inside the target window is what makes a bale ferment cleanly.",
    image: "harvester",
  },
  {
    index: 3,
    title: "Chop",
    summary: "Short, uniform, consistent.",
    detail:
      "A short, even chop packs tighter, ferments faster and mixes evenly into the ration.",
    image: "harvesterHead",
  },
  {
    index: 4,
    title: "Compact",
    summary: "Remove the air.",
    detail:
      "Density is protection. Every bale is compacted to push out oxygen so fermentation starts quickly and spoilage has nowhere to begin.",
    image: "compaction",
  },
  {
    index: 5,
    title: "Wrap",
    summary: "Seal it, layer on layer.",
    detail:
      "Multiple layers of stretch film seal the bale against air and water and keep it sealed through handling.",
    image: "baleClose",
  },
  {
    index: 6,
    title: "Ferment",
    summary: "Let the crop preserve itself.",
    detail:
      "Sealed and undisturbed, natural fermentation lowers the pH and locks in the feed value of the crop.",
    image: "balesBlack",
  },
  {
    index: 7,
    title: "Deliver",
    summary: "Planned loads, careful handling.",
    detail:
      "Bales are loaded for stability and delivered on a schedule that matches how you feed.",
    image: "tractorTrailer",
  },
  {
    index: 8,
    title: "Feed",
    summary: "Open a bale that looks like the last one.",
    detail:
      "Consistent chop, density and fermentation mean the ration behaves the same way every day.",
    image: "dairyBarn",
  },
];
