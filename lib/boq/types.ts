export type BoqBuilding = "NKC1" | "NKC2";

export type SheetCandidate = {
  name: string;
  isValid: boolean;
  missingColumns: string[];
};

export type LoadedWorkbook = {
  building: BoqBuilding;
  filename: string;
  sheets: SheetCandidate[];
};

export type BoqRow = {
  wbs1: string;
  wbs2: string;
  wbs3: string;
  wbs4: string;
  description: string;
  unit: string;
  qty: number;
  material: number;
  labor: number;
  amount: number;
};
