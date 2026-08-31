export type Cell = string | number;

export interface SheetData {
  id: string;
  name: string;
  columns: string[];
  rows: Cell[][];
  createdAt: number;
  source?: "demo" | "paste" | "file" | "data.json" | "manual";
}

export interface Dataset {
  title: string;
  sheets: SheetData[];
  updatedAt: number;
}

export type SortDir = "asc" | "desc";

export interface SortState {
  col: number;
  dir: SortDir;
}

/** colIndex -> набор разрешённых значений (null = фильтр выключен) */
export type SheetFilters = Record<number, Set<string>>;

export interface ColumnProfile {
  index: number;
  name: string;
  numeric: boolean;
  dateLike: boolean;
  filled: number;
  unique: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}

export interface Toast {
  id: number;
  kind: "ok" | "warn" | "bad" | "info";
  text: string;
}

export interface ParsedTable {
  columns: string[];
  rows: Cell[][];
}

export type Density = "cozy" | "compact";
