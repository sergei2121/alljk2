import type { Cell, Dataset } from "./types";

const KEY = "laguna:dataset:v1";
const THEME_KEY = "laguna:theme";

export function loadDataset(): Dataset | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Dataset;
    if (!d || !Array.isArray(d.sheets)) return null;
    return d;
  } catch {
    return null;
  }
}

export function saveDataset(d: Dataset | null): void {
  try {
    if (d === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* переполнение хранилища — молча */
  }
}

export function loadTheme(): "dark" | "light" {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function saveTheme(t: "dark" | "light"): void {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    /* ignore */
  }
}

export function datasetSizeKb(d: Dataset): string {
  try {
    const bytes = new Blob([JSON.stringify(d)]).size;
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
  } catch {
    return "—";
  }
}

/* ---------------- экспорт ---------------- */

function csvCell(v: Cell, delim: string): string {
  const s = typeof v === "number" ? String(v).replace(".", ",") : String(v);
  if (s.includes(delim) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(columns: string[], rows: Cell[][], cols: number[], delim = ";"): string {
  const head = cols.map((ci) => csvCell(columns[ci] ?? "", delim)).join(delim);
  const body = rows.map((r) => cols.map((ci) => csvCell(r[ci] ?? "", delim)).join(delim));
  return "\ufeff" + [head, ...body].join("\r\n");
}

export function downloadFile(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function toMarkdown(columns: string[], rows: Cell[][], cols: number[]): string {
  const head = "| " + cols.map((ci) => (columns[ci] ?? "").replace(/\|/g, "\\|")).join(" | ") + " |";
  const sep = "| " + cols.map(() => "---").join(" | ") + " |";
  const body = rows.map(
    (r) => "| " + cols.map((ci) => String(r[ci] ?? "").replace(/\|/g, "\\|")).join(" | ") + " |"
  );
  return [head, sep, ...body].join("\n");
}

/** Пытается загрузить стартовый датасет из data/data.json (монтируется в docker). */
export async function fetchBootstrapData(): Promise<Dataset | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/data.json`, { cache: "no-cache" });
    if (!res.ok) return null;
    const raw = await res.json();
    const { sheetsFromJson } = await import("./parse");
    const sheets = sheetsFromJson(raw);
    if (!sheets || sheets.length === 0) return null;
    const { uid } = await import("./parse");
    const now = Date.now();
    return {
      title:
        raw && typeof raw === "object" && typeof (raw as { title?: unknown }).title === "string"
          ? ((raw as { title: string }).title as string)
          : "Данные из data/data.json",
      sheets: sheets.map((s, i) => ({
        id: uid(),
        name: sheets.length > 1 ? s.name : s.name === "Лист" ? "Данные" : s.name,
        columns: s.columns,
        rows: s.rows,
        createdAt: now + i,
        source: "data.json" as const,
      })),
      updatedAt: now,
    };
  } catch {
    return null;
  }
}
