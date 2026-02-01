export const REQUIRED_COLUMNS = [
  "WBS-1",
  "WBS-2",
  "WBS-3",
  "WBS-4",
  "Description",
  "Unit",
  "Qty",
  "Material",
  "Labor",
  "Amount",
] as const;

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];
