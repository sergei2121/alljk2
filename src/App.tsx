import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Cell, Dataset, Density, SheetData, SheetFilters, SortState, Toast } from "./lib/types";
import {
  compareCells,
  profileColumns,
  rowMatches,
  toNumber,
  uid,
} from "./lib/parse";
import type { ImportedSheet } from "./lib/parse";
import {
  datasetSizeKb,
  downloadFile,
  fetchBootstrapData,
  loadDataset,
  loadTheme,
  saveDataset,
  saveTheme,
  toCsv,
  toMarkdown,
} from "./lib/store";
import { buildDemoDataset } from "./lib/demo";
import { TopBar, type ExportKind } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { StatsStrip } from "./components/StatsStrip";
import { DataTable, SheetTabs, type ViewRow } from "./components/DataTable";
import { DetailDrawer } from "./components/DetailDrawer";
import { ImportModal } from "./components/ImportModal";
import { EmptyState } from "./components/EmptyState";
import { ConfirmModal, Toasts } from "./components/ui";

interface ConfirmState {
  title: string;
  text: string;
  okLabel: string;
  danger?: boolean;
  action: () => void;
}

function BackgroundStage() {
  const bumps = Array.from({ length: 24 }, (_, i) => `q 40 ${i % 2 ? 20 : -20} 80 0`).join(" ");
  return (
    <div className="bg-stage">
      <div className="glow glow-a" />
      <div className="glow glow-b" />
      <svg className="wave-line h-24 w-[calc(100%+320px)]" viewBox="0 0 1440 90" fill="none" preserveAspectRatio="none">
        <path className="w1" d={`M-160 50 ${bumps}`} strokeWidth="1.4" />
        <path className="w2" d={`M-160 66 ${bumps}`} strokeWidth="1.1" />
      </svg>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => loadTheme());
  const [dataset, setDataset] = useState<Dataset | null>(() => loadDataset());
  const [activeSheetId, setActiveSheetId] = useState<string | null>(() => loadDataset()?.sheets[0]?.id ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [query, setQuery] = useState("");
  const [sorts, setSorts] = useState<Record<string, SortState | null>>({});
  const [filters, setFilters] = useState<Record<string, SheetFilters>>({});
  const [hidden, setHidden] = useState<Record<string, number[]>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [density, setDensity] = useState<Density>("cozy");

  const [drawerRow, setDrawerRow] = useState<number | null>(null);
  const [importModal, setImportModal] = useState<null | { tab: "paste" | "file" | "help" }>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const bootstrapped = useRef(false);

  /* ---------- тема ---------- */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveTheme(theme);
  }, [theme]);

  /* ---------- персист ---------- */
  useEffect(() => saveDataset(dataset), [dataset]);

  /* ---------- активный лист ---------- */
  const sheet: SheetData | null = useMemo(() => {
    if (!dataset) return null;
    return dataset.sheets.find((s) => s.id === activeSheetId) ?? dataset.sheets[0] ?? null;
  }, [dataset, activeSheetId]);

  useEffect(() => {
    if (dataset && dataset.sheets.length > 0 && !dataset.sheets.some((s) => s.id === activeSheetId)) {
      setActiveSheetId(dataset.sheets[0].id);
    }
  }, [dataset, activeSheetId]);

  /* ---------- bootstrap из data/data.json ---------- */
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    if (dataset) return;
    let cancelled = false;
    fetchBootstrapData().then((d) => {
      if (!cancelled && d) {
        setDataset(d);
        setActiveSheetId(d.sheets[0]?.id ?? null);
        addToast("ok", `Данные подхвачены из data/data.json — «${d.title}»`);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- тосты ---------- */
  const addToast = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  /* ---------- вычисления по листу ---------- */
  const sheetId = sheet?.id ?? "";
  const sort = sorts[sheetId] ?? null;
  const sheetFilters = filters[sheetId] ?? {};
  const hiddenCols = hidden[sheetId] ?? [];

  const baseProfiles = useMemo(() => (sheet ? profileColumns(sheet) : []), [sheet]);

  const visibleCols = useMemo(
    () => (sheet ? sheet.columns.map((_, i) => i).filter((i) => !hiddenCols.includes(i)) : []),
    [sheet, hiddenCols]
  );

  const viewRows: ViewRow[] = useMemo(() => {
    if (!sheet) return [];
    let list: ViewRow[] = sheet.rows.map((cells, idx) => ({ idx, cells }));
    for (const [colStr, values] of Object.entries(sheetFilters)) {
      const ci = Number(colStr);
      if (!values || values.size === 0) continue;
      list = list.filter((r) => values.has(String(r.cells[ci] ?? "").trim()));
    }
    if (query.trim()) list = list.filter((r) => rowMatches(r.cells, visibleCols, query));
    if (sort) {
      const numeric = baseProfiles[sort.col]?.numeric ?? false;
      const dir = sort.dir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => dir * compareCells(a.cells[sort.col], b.cells[sort.col], numeric));
    }
    return list;
  }, [sheet, sheetFilters, query, visibleCols, sort, baseProfiles]);

  const filteredProfiles = useMemo(() => {
    if (!sheet) return [];
    return baseProfiles.map((p) => {
      const src = viewRows.map((r) => r.cells[p.index]);
      let nums: number[] = [];
      let filled = 0;
      const uniq = new Set<string>();
      for (const v of src) {
        if (v === undefined || v === null || String(v).trim() === "") continue;
        filled++;
        uniq.add(String(v));
        if (p.numeric) {
          const n = toNumber(v);
          if (n !== null) nums.push(n);
        }
      }
      if (!p.numeric) nums = [];
      const sum = nums.reduce((a, b) => a + b, 0);
      return {
        ...p,
        filled,
        unique: uniq.size,
        sum,
        avg: nums.length ? sum / nums.length : 0,
        min: nums.length ? Math.min(...nums) : 0,
        max: nums.length ? Math.max(...nums) : 0,
      };
    });
  }, [baseProfiles, viewRows, sheet]);

  const hasActiveFilters =
    query.trim() !== "" || sort !== null || Object.keys(sheetFilters).length > 0 || hiddenCols.length > 0;

  /* ---------- мутации ---------- */
  const touch = (d: Dataset): Dataset => ({ ...d, updatedAt: Date.now() });

  const mutateSheet = (fn: (s: SheetData) => SheetData) => {
    setDataset((d) =>
      d ? touch({ ...d, sheets: d.sheets.map((s) => (s.id === sheetId ? fn(s) : s)) }) : d
    );
  };

  const handleImport = (sheetsIn: ImportedSheet[], mode: "new" | "replace", name: string) => {
    const now = Date.now();
    const toSheet = (s: ImportedSheet, i: number): SheetData => ({
      id: uid(),
      name: sheetsIn.length > 1 ? s.name : name || s.name,
      columns: s.columns,
      rows: s.rows,
      createdAt: now + i,
      source: "paste",
    });
    if (mode === "replace" && sheet) {
      const ns = toSheet(sheetsIn[0], 0);
      ns.id = sheet.id;
      ns.name = name || sheet.name;
      setDataset((d) => (d ? touch({ ...d, sheets: d.sheets.map((s) => (s.id === sheet.id ? ns : s)) }) : d));
      setFilters((f) => ({ ...f, [sheet.id]: {} }));
      setSorts((s) => ({ ...s, [sheet.id]: null }));
      setPage(0);
      addToast("ok", `Лист «${ns.name}» заменён: ${ns.rows.length} строк`);
    } else {
      const created = sheetsIn.map(toSheet);
      setDataset((d) =>
        d
          ? touch({ ...d, sheets: [...d.sheets, ...created] })
          : { title: name && sheetsIn.length === 1 ? name : "Мои таблицы", sheets: created, updatedAt: now }
      );
      setActiveSheetId(created[0].id);
      setPage(0);
      setQuery("");
      addToast("ok", `Импортировано: ${created.length} лист(ов), ${sheetsIn.reduce((a, s) => a + s.rows.length, 0)} строк`);
    }
    setImportModal(null);
  };

  const handleSort = (col: number) => {
    setSorts((m) => {
      const cur = m[sheetId] ?? null;
      const next: SortState | null = !cur || cur.col !== col ? { col, dir: "asc" } : cur.dir === "asc" ? { col, dir: "desc" } : null;
      return { ...m, [sheetId]: next };
    });
  };

  const handleFilter = (col: number, values: Set<string> | null) => {
    setFilters((m) => {
      const cur = { ...(m[sheetId] ?? {}) };
      if (values === null) delete cur[col];
      else cur[col] = values;
      return { ...m, [sheetId]: cur };
    });
    setPage(0);
  };

  const handleToggleCol = (col: number) => {
    setHidden((m) => {
      const cur = m[sheetId] ?? [];
      const next = cur.includes(col) ? cur.filter((c) => c !== col) : [...cur, col];
      return { ...m, [sheetId]: next };
    });
  };

  const handleEditCell = (rowIdx: number, colIdx: number, value: string) => {
    const trimmed = value.trim();
    const n = toNumber(trimmed);
    const cell: Cell = trimmed !== "" && n !== null && /^[\d\s.,+\-%]+$/.test(trimmed) ? n : value;
    mutateSheet((s) => ({
      ...s,
      rows: s.rows.map((r, i) => (i === rowIdx ? r.map((c, ci) => (ci === colIdx ? cell : c)) : r)),
    }));
  };

  const handleAddRow = () => {
    if (!sheet) return;
    const newRow: Cell[] = sheet.columns.map(() => "");
    mutateSheet((s) => ({ ...s, rows: [...s.rows, newRow] }));
    setPage(Math.ceil((sheet.rows.length + 1) / pageSize) - 1);
    setDrawerRow(sheet.rows.length);
    addToast("ok", "Строка добавлена в конец листа");
  };

  const handleDeleteRow = (rowIdx: number) => {
    if (!sheet) return;
    setConfirm({
      title: "Удалить строку?",
      text: `Строка ${rowIdx + 1} листа «${sheet.name}» будет удалена безвозвратно.`,
      okLabel: "Удалить",
      danger: true,
      action: () => {
        mutateSheet((s) => ({ ...s, rows: s.rows.filter((_, i) => i !== rowIdx) }));
        setDrawerRow(null);
        addToast("info", "Строка удалена");
      },
    });
  };

  const handleAddSheet = () => {
    if (!dataset) return;
    const ns: SheetData = {
      id: uid(),
      name: `Лист ${dataset.sheets.length + 1}`,
      columns: ["Поле 1", "Поле 2", "Поле 3"],
      rows: [["", "", ""]],
      createdAt: Date.now(),
      source: "manual",
    };
    setDataset(touch({ ...dataset, sheets: [...dataset.sheets, ns] }));
    setActiveSheetId(ns.id);
    addToast("ok", `Создан лист «${ns.name}» — ячейки редактируются двойным кликом`);
  };

  const handleRenameSheet = (id: string, name: string) => {
    setDataset((d) => (d ? touch({ ...d, sheets: d.sheets.map((s) => (s.id === id ? { ...s, name } : s)) }) : d));
  };

  const handleDeleteSheet = (id: string) => {
    if (!dataset) return;
    const target = dataset.sheets.find((s) => s.id === id);
    if (!target) return;
    setConfirm({
      title: "Удалить лист?",
      text: `«${target.name}» (${target.rows.length} строк) будет удалён из датасета.`,
      okLabel: "Удалить лист",
      danger: true,
      action: () => {
        const rest = dataset.sheets.filter((s) => s.id !== id);
        setDataset(rest.length ? touch({ ...dataset, sheets: rest }) : null);
        if (activeSheetId === id) setActiveSheetId(rest[0]?.id ?? null);
        setDrawerRow(null);
        addToast("info", `Лист «${target.name}» удалён`);
      },
    });
  };

  const handleLoadDemo = () => {
    const apply = () => {
      const d = buildDemoDataset();
      setDataset(d);
      setActiveSheetId(d.sheets[0].id);
      resetView();
      addToast("ok", "Демо-данные загружены — 2 листа");
    };
    if (dataset) {
      setConfirm({
        title: "Заменить текущие данные?",
        text: "Демо-датасет заменит всё, что сейчас хранится в браузере.",
        okLabel: "Заменить",
        danger: true,
        action: apply,
      });
    } else apply();
  };

  const handleClearAll = () => {
    setConfirm({
      title: "Очистить всё?",
      text: "Все листы и данные будут удалены из локального хранилища браузера.",
      okLabel: "Очистить",
      danger: true,
      action: () => {
        setDataset(null);
        setActiveSheetId(null);
        setSorts({});
        setFilters({});
        setHidden({});
        setDrawerRow(null);
        resetView();
        addToast("info", "Хранилище очищено");
      },
    });
  };

  const resetView = () => {
    setQuery("");
    setPage(0);
    if (sheetId) {
      setSorts((m) => ({ ...m, [sheetId]: null }));
      setFilters((m) => ({ ...m, [sheetId]: {} }));
      setHidden((m) => ({ ...m, [sheetId]: [] }));
    }
  };

  const handleExport = (kind: ExportKind) => {
    if (!sheet) return;
    const rows = viewRows.map((r) => r.cells);
    if (kind === "csv") {
      downloadFile(`${sheet.name}.csv`, toCsv(sheet.columns, rows, visibleCols), "text/csv");
      addToast("ok", `CSV сохранён: ${rows.length} строк с учётом фильтров`);
    } else if (kind === "json") {
      downloadFile(`${(dataset?.title ?? "dataset").replace(/\s+/g, "_")}.json`, JSON.stringify(dataset, null, 2), "application/json");
      addToast("ok", "JSON со всем датасетом сохранён");
    } else {
      const md = toMarkdown(sheet.columns, rows, visibleCols);
      navigator.clipboard
        .writeText(md)
        .then(() => addToast("ok", "Markdown-таблица скопирована в буфер обмена"))
        .catch(() => addToast("bad", "Не удалось скопировать — браузер запретил доступ к буферу"));
    }
  };

  const switchSheet = (id: string) => {
    setActiveSheetId(id);
    setQuery("");
    setPage(0);
    setDrawerRow(null);
  };

  /* ---------- рендер ---------- */
  const isDemo = dataset?.sheets.every((s) => s.source === "demo") ?? false;
  const order = viewRows.map((r) => r.idx);

  return (
    <div className="flex h-full flex-col">
      <BackgroundStage />
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onImport={() => setImportModal({ tab: "paste" })}
        onExport={handleExport}
        isDemo={isDemo}
        hasData={!!sheet && sheet.rows.length > 0}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          open={sidebarOpen}
          dataset={dataset}
          activeSheetId={sheet?.id ?? null}
          sizeLabel={dataset ? datasetSizeKb(dataset) : "—"}
          onSwitchSheet={switchSheet}
          onTitleChange={(title) => setDataset((d) => (d ? touch({ ...d, title }) : d))}
          onLoadDemo={handleLoadDemo}
          onClearAll={handleClearAll}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
          {dataset && sheet ? (
            <>
              <div className="anim-rise rounded-xl border border-line bg-panel shadow-lift">
                <SheetTabs
                  sheets={dataset.sheets}
                  activeId={sheet.id}
                  onSwitch={switchSheet}
                  onRename={handleRenameSheet}
                  onDelete={handleDeleteSheet}
                  onAdd={handleAddSheet}
                />
                <div className="p-3">
                  <StatsStrip
                    profiles={filteredProfiles}
                    visibleCols={visibleCols}
                    totalRows={sheet.rows.length}
                    shownRows={viewRows.length}
                    filtered={hasActiveFilters}
                  />
                </div>
              </div>

              <DataTable
                sheet={sheet}
                profiles={filteredProfiles}
                visibleCols={visibleCols}
                rows={viewRows}
                hiddenCols={hiddenCols}
                query={query}
                onQuery={(q) => {
                  setQuery(q);
                  setPage(0);
                }}
                sort={sort}
                onSort={handleSort}
                filters={sheetFilters}
                onFilter={handleFilter}
                onToggleCol={handleToggleCol}
                onShowAllCols={() => setHidden((m) => ({ ...m, [sheetId]: [] }))}
                density={density}
                onDensity={setDensity}
                page={page}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={(s) => {
                  setPageSize(s);
                  setPage(0);
                }}
                onOpenRow={setDrawerRow}
                onEditCell={handleEditCell}
                onAddRow={handleAddRow}
                hasActiveFilters={hasActiveFilters}
                onResetView={resetView}
              />
            </>
          ) : (
            <EmptyState
              onImportPaste={() => setImportModal({ tab: "paste" })}
              onImportFile={() => setImportModal({ tab: "file" })}
              onLoadDemo={handleLoadDemo}
            />
          )}
        </main>
      </div>

      {sheet && drawerRow !== null && (
        <DetailDrawer
          sheet={sheet}
          profiles={baseProfiles}
          rowIdx={drawerRow}
          order={order}
          onClose={() => setDrawerRow(null)}
          onNav={setDrawerRow}
          onEditCell={handleEditCell}
          onDeleteRow={handleDeleteRow}
        />
      )}

      {importModal && dataset !== undefined && (
        <ImportModal
          initialTab={importModal.tab}
          defaultName={
            dataset && dataset.sheets.length > 0 ? `Лист ${dataset.sheets.length + 1}` : "Моя таблица"
          }
          hasSheet={!!sheet}
          onCancel={() => setImportModal(null)}
          onImport={handleImport}
          onToast={addToast}
        />
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          text={confirm.text}
          okLabel={confirm.okLabel}
          danger={confirm.danger}
          onOk={() => {
            confirm.action();
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}

      <Toasts list={toasts} onClose={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
