import type { Cell, ColumnProfile, Dataset, ParsedTable, SheetData } from "./types";

/* ---------------- числа / даты ---------------- */

export function toNumber(v: Cell): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = v.trim().replace(/[\u00a0\s]/g, "").replace(",", ".");
  if (s === "" || s === "-" || s === "—") return null;
  const pct = s.endsWith("%");
  const core = pct ? s.slice(0, -1) : s;
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(core)) return null;
  const n = parseFloat(core);
  return Number.isFinite(n) ? (pct ? n / 100 : n) : null;
}

const DATE_RE = /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}([ T]\d{1,2}:\d{2}(:\d{2})?)?$/;
export function isDateLike(s: string): boolean {
  return DATE_RE.test(s.trim());
}

export const fmtNum = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });
export const fmtInt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export function formatCell(v: Cell, numeric: boolean): string {
  if (typeof v === "number") return fmtNum.format(v);
  if (numeric) {
    const n = toNumber(v);
    if (n !== null && v.trim() !== "") return fmtNum.format(n);
  }
  return v;
}

/* ---------------- разделители и таблицы ---------------- */

export type Delim = "\t" | ";" | ",";

export function detectDelimiter(text: string): Delim {
  const sample = text.split(/\r?\n/).slice(0, 8).join("\n");
  const counts: Record<Delim, number> = { "\t": 0, ";": 0, ",": 0 };
  let inQ = false;
  for (const ch of sample) {
    if (ch === '"') inQ = !inQ;
    else if (!inQ && (ch === "\t" || ch === ";" || ch === ",")) counts[ch as Delim]++;
  }
  let best: Delim = "\t";
  let max = 0;
  (Object.keys(counts) as Delim[]).forEach((d) => {
    if (counts[d] > max) {
      max = counts[d];
      best = d;
    }
  });
  return max > 0 ? best : "\t";
}

export function parseDelimited(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQ = false;
      } else cell += ch;
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // убираем пустые хвостовые строки
  while (rows.length && rows[rows.length - 1].every((c) => c.trim() === "")) rows.pop();
  return rows;
}

/** Делает ячейки числами там, где это безопасно, и выравнивает ширину строк. */
export function normalizeTable(raw: string[][], firstRowHeader: boolean): ParsedTable {
  if (raw.length === 0) return { columns: [], rows: [] };
  const width = Math.max(...raw.map((r) => r.length));
  const pad = (r: string[]) => {
    const out = r.slice(0, width).map((c) => c.trim());
    while (out.length < width) out.push("");
    return out;
  };
  const all = raw.map(pad);
  let columns: string[];
  let body: string[][];
  if (firstRowHeader) {
    columns = all[0].map((c, i) => (c === "" ? `Столбец ${i + 1}` : c));
    body = all.slice(1);
  } else {
    columns = all[0].map((_, i) => `Столбец ${String.fromCharCode(65 + (i % 26))}`);
    body = all;
  }
  const numericCol = columns.map((_, ci) => {
    let nums = 0;
    let filled = 0;
    for (const r of body) {
      const v = r[ci];
      if (v.trim() === "") continue;
      filled++;
      if (toNumber(v) !== null) nums++;
    }
    return filled > 0 && nums / filled >= 0.7;
  });
  const rows: Cell[][] = body.map((r) =>
    r.map((c, ci) => {
      if (numericCol[ci] && c.trim() !== "") {
        const n = toNumber(c);
        if (n !== null) return n;
      }
      return c;
    })
  );
  return { columns, rows };
}

export function parseTableText(text: string, delim: Delim, firstRowHeader: boolean): ParsedTable {
  return normalizeTable(parseDelimited(text, delim), firstRowHeader);
}

/* ---------------- JSON ---------------- */

function rowsFromObjects(arr: Record<string, unknown>[]): ParsedTable {
  const columns: string[] = [];
  for (const obj of arr) {
    for (const k of Object.keys(obj)) if (!columns.includes(k)) columns.push(k);
  }
  const rows: Cell[][] = arr.map((obj) =>
    columns.map((c) => {
      const v = obj[c];
      if (v === null || v === undefined) return "";
      if (typeof v === "number") return v;
      if (typeof v === "boolean") return v ? "да" : "нет";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    })
  );
  return { columns, rows };
}

export interface ImportedSheet {
  name: string;
  columns: string[];
  rows: Cell[][];
}

export function sheetsFromJson(raw: unknown): ImportedSheet[] | null {
  type SheetLike = { name?: unknown; columns?: unknown; rows?: unknown };
  try {
    const norm = (s: unknown): ImportedSheet | null => {
      if (Array.isArray(s)) {
        if (s.length === 0) return null;
        if (!Array.isArray(s[0]) && s.every((r) => r && typeof r === "object" && !Array.isArray(r))) {
          const t = rowsFromObjects(s as Record<string, unknown>[]);
          return { name: "Лист", ...t };
        }
        if (s.every((r) => Array.isArray(r))) {
          const head = s[0] as unknown[];
          const columns = head.map((c, i) => String(c ?? `Столбец ${i + 1}`));
          const rows = (s.slice(1) as unknown[][]).map((r) =>
            r.map((c) => (typeof c === "number" ? c : String(c ?? "")))
          );
          return { name: "Лист", columns, rows };
        }
        return null;
      }
      if (s && typeof s === "object") {
        const o = s as SheetLike;
        if (Array.isArray(o.columns) && Array.isArray(o.rows)) {
          const name = typeof o.name === "string" && o.name ? o.name : "Лист";
          const columns = (o.columns as unknown[]).map((c, i) => String(c ?? `Столбец ${i + 1}`));
          const rows = (o.rows as unknown[]).map((r) =>
            (Array.isArray(r) ? r : [r]).map((c) => (typeof c === "number" ? c : String(c ?? "")))
          );
          return { name, columns, rows };
        }
        if (Array.isArray(o.rows) && o.columns === undefined) {
          return norm(o.rows);
        }
      }
      return null;
    };

    if (Array.isArray(raw)) {
      const single = norm(raw);
      return single ? [single] : null;
    }
    if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      if (Array.isArray(o.sheets)) {
        const list = (o.sheets as unknown[])
          .map((s) => norm(s))
          .filter((x): x is ImportedSheet => x !== null);
        return list.length ? list : null;
      }
      const single = norm(raw);
      return single ? [single] : null;
    }
    return null;
  } catch {
    return null;
  }
}

/* ---------------- профили колонок ---------------- */

export function profileColumns(sheet: SheetData): ColumnProfile[] {
  return sheet.columns.map((name, index) => {
    let nums: number[] = [];
    let filled = 0;
    let dates = 0;
    const uniq = new Set<string>();
    for (const r of sheet.rows) {
      const v = r[index];
      if (v === undefined || v === null || String(v).trim() === "") continue;
      filled++;
      uniq.add(String(v));
      const n = toNumber(v);
      if (n !== null) nums.push(n);
      else if (typeof v === "string" && isDateLike(v)) dates++;
    }
    const numeric = filled > 0 && nums.length / filled >= 0.7;
    if (!numeric) nums = [];
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
      index,
      name,
      numeric,
      dateLike: !numeric && filled > 0 && dates / filled >= 0.7,
      filled,
      unique: uniq.size,
      sum,
      avg: nums.length ? sum / nums.length : 0,
      min: nums.length ? Math.min(...nums) : 0,
      max: nums.length ? Math.max(...nums) : 0,
    };
  });
}

/* ---------------- поиск ---------------- */

export function rowMatches(row: Cell[], cols: number[], q: string): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  for (const ci of cols) {
    const v = row[ci];
    if (v !== undefined && v !== null && String(v).toLowerCase().includes(needle)) return true;
  }
  return false;
}

export function compareCells(a: Cell | undefined, b: Cell | undefined, numeric: boolean): number {
  const av = a ?? "";
  const bv = b ?? "";
  const ea = String(av).trim() === "";
  const eb = String(bv).trim() === "";
  if (ea && eb) return 0;
  if (ea) return 1;
  if (eb) return -1;
  if (numeric) {
    const an = toNumber(av);
    const bn = toNumber(bv);
    if (an !== null && bn !== null) return an - bn;
  }
  return String(av).localeCompare(String(bv), "ru", { numeric: true, sensitivity: "base" });
}

/* ---------------- идентификаторы ---------------- */

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function makeDataset(title: string, sheets: SheetData[]): Dataset {
  return { title, sheets, updatedAt: Date.now() };
}
