/**
 * LABORATORY ANALYSIS
 * --------------------------------------------------------------------
 * Structure for real per-batch laboratory results. Nothing here is a
 * measured value — every batch listed is a DEMO placeholder so the UI
 * can be designed and reviewed. Replace `batches` with real data (or
 * fetch it from your backend) and set `demo: false`.
 */

export interface LabParameter {
  key: string;
  label: string;
  unit: string;
  /** Short description shown next to the parameter. */
  description: string;
}

export const labParameters: LabParameter[] = [
  { key: "dryMatter", label: "Dry Matter", unit: "%", description: "Share of the bale that is not water." },
  { key: "crudeProtein", label: "Crude Protein", unit: "% DM", description: "Total nitrogen expressed as protein." },
  { key: "adf", label: "ADF", unit: "% DM", description: "Acid detergent fibre — relates to digestibility." },
  { key: "ndf", label: "NDF", unit: "% DM", description: "Neutral detergent fibre — relates to intake." },
  { key: "starch", label: "Starch", unit: "% DM", description: "Energy from the grain fraction." },
  { key: "ph", label: "pH", unit: "", description: "Acidity — an indicator of fermentation." },
  { key: "moisture", label: "Moisture", unit: "%", description: "Water content at sampling." },
];

export interface LabBatch {
  batchId: string;
  product: string;
  harvestWindow: string;
  sampledOn: string;
  laboratory: string;
  /** Parameter key → value. `null` = not yet available. */
  values: Partial<Record<string, number | null>>;
  demo: boolean;
}

/**
 * DEMO batches. The values are illustrative only and are rendered with
 * a visible "DEMO" marker. Delete them once real analyses are available.
 */
export const labBatches: LabBatch[] = [
  {
    batchId: "DEMO-BATCH-A",
    product: "Premium Round Bale",
    harvestWindow: "Harvest window — demo",
    sampledOn: "Sample date — demo",
    laboratory: "Laboratory name — demo",
    values: {
      dryMatter: null,
      crudeProtein: null,
      adf: null,
      ndf: null,
      starch: null,
      ph: null,
      moisture: null,
    },
    demo: true,
  },
];

export const labPlaceholderText = "Lab data available per batch";
