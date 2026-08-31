import { useEffect, useMemo, useRef, useState } from "react";
import type { Cell, ColumnProfile, Density, SheetData, SheetFilters, SortState } from "../lib/types";
import { fmtNum, formatCell } from "../lib/parse";
import { Icon } from "./icons";
import { Popover, chipTone } from "./ui";

export interface ViewRow {
  idx: number;
  cells: Cell[];
}

/* ================= подсветка поиска ================= */

function Hi({ text, q }: { text: string; q: string }) {
  const needle = q.trim().toLowerCase();
  if (!needle) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let from = 0;
  let pos = lower.indexOf(needle);
  let key = 0;
  while (pos !== -1) {
    if (pos > from) parts.push(text.slice(from, pos));
    parts.push(<mark key={key++}>{text.slice(pos, pos + needle.length)}</mark>);
    from = pos + needle.length;
    pos = lower.indexOf(needle, from);
  }
  if (from < text.length) parts.push(text.slice(from));
  return <>{parts}</>;
}

/* ================= вкладки листов ================= */

export function SheetTabs({
  sheets,
  activeId,
  onSwitch,
  onRename,
  onDelete,
  onAdd,
}: {
  sheets: SheetData[];
  activeId: string | null;
  onSwitch: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  return (
    <div className="flex items-end gap-1 overflow-x-auto border-b border-line px-3 pt-2">
      {sheets.map((s) => {
        const active = s.id === activeId;
        return (
          <div
            key={s.id}
            className={`group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-t-lg border border-b-0 px-3.5 py-2 text-[12.5px] font-medium transition-colors ${
              active
                ? "border-line bg-panel text-accent"
                : "border-transparent bg-transparent text-ink3 hover:bg-panel2/70 hover:text-ink2"
            }`}
            onClick={() => onSwitch(s.id)}
            onDoubleClick={() => {
              setEditing(s.id);
              setDraft(s.name);
            }}
            title="Двойной клик — переименовать"
          >
            {editing === s.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={() => {
                  onRename(s.id, draft.trim() || s.name);
                  setEditing(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setEditing(null);
                }}
                className="focus-ring w-32 rounded border border-accent bg-panel2 px-1.5 py-0.5 text-[12.5px] text-ink outline-none"
              />
            ) : (
              <span className="max-w-[180px] truncate">{s.name}</span>
            )}
            <span className="tnum font-mono text-[10px] text-ink3">{s.rows.length}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(s.id);
              }}
              className="btn-press -mr-1 rounded p-0.5 text-ink3 opacity-0 transition-opacity hover:text-bad group-hover:opacity-100"
              aria-label={`Удалить лист ${s.name}`}
              title="Удалить лист"
            >
              <Icon name="close" className="h-3 w-3" strokeWidth={2.2} />
            </button>
            {active && <span className="absolute inset-x-2 -bottom-px h-px bg-panel" />}
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="btn-press focus-ring mb-1 ml-1 shrink-0 rounded-lg border border-dashed border-line2 px-2.5 py-1.5 text-[12px] font-medium text-ink3 hover:border-accent hover:text-accent"
        title="Добавить пустой лист"
      >
        <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
    </div>
  );
}

/* ================= основная таблица ================= */

type Pop =
  | { kind: "filter"; col: number; x: number; y: number }
  | { kind: "cols"; x: number; y: number };

export function DataTable({
  sheet,
  profiles,
  visibleCols,
  rows,
  hiddenCols,
  query,
  onQuery,
  sort,
  onSort,
  filters,
  onFilter,
  onToggleCol,
  onShowAllCols,
  density,
  onDensity,
  page,
  pageSize,
  onPage,
  onPageSize,
  onOpenRow,
  onEditCell,
  onAddRow,
  hasActiveFilters,
  onResetView,
}: {
  sheet: SheetData;
  profiles: ColumnProfile[];
  visibleCols: number[];
  rows: ViewRow[];
  hiddenCols: number[];
  query: string;
  onQuery: (q: string) => void;
  sort: SortState | null;
  onSort: (col: number) => void;
  filters: SheetFilters;
  onFilter: (col: number, values: Set<string> | null) => void;
  onToggleCol: (col: number) => void;
  onShowAllCols: () => void;
  density: Density;
  onDensity: (d: Density) => void;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
  onOpenRow: (rowIdx: number) => void;
  onEditCell: (rowIdx: number, colIdx: number, value: string) => void;
  onAddRow: () => void;
  hasActiveFilters: boolean;
  onResetView: () => void;
}) {
  const [pop, setPop] = useState<Pop | null>(null);
  const [edit, setEdit] = useState<{ row: number; col: number; draft: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const maxPage = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
  useEffect(() => {
    if (page > maxPage) onPage(maxPage);
  }, [page, maxPage, onPage]);
  useEffect(() => setPop(null), [sheet.id]);

  const pageRows = useMemo(() => rows.slice(page * pageSize, (page + 1) * pageSize), [rows, page, pageSize]);

  const uniqueByCol = useMemo(() => {
    const m = new Map<number, string[]>();
    if (pop?.kind !== "filter") return m;
    const ci = pop.col;
    const set = new Map<string, number>();
    for (const r of sheet.rows) {
      const v = String(r[ci] ?? "").trim();
      if (v === "") continue;
      set.set(v, (set.get(v) ?? 0) + 1);
    }
    m.set(ci, [...set.keys()].sort((a, b) => a.localeCompare(b, "ru")).slice(0, 80));
    return m;
  }, [pop, sheet]);

  const openPop = (e: React.MouseEvent, kind: Pop["kind"], col?: number) => {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (kind === "cols") setPop({ kind: "cols", x: r.right - 248, y: r.bottom + 8 });
    else setPop({ kind: "filter", col: col!, x: r.left, y: r.bottom + 8 });
  };

  const cellPad = density === "cozy" ? "px-3.5 py-2.5" : "px-3 py-1.5";
  const textCls = density === "cozy" ? "text-[13px]" : "text-[12px]";

  const chipCols = useMemo(() => {
    const s = new Set<number>();
    for (const p of profiles) {
      if (!p.numeric && !p.dateLike && p.filled > 0 && p.unique <= 10) s.add(p.index);
    }
    return s;
  }, [profiles]);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-line bg-panel shadow-lift">
      {/* -------- тулбар -------- */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
        <label className="relative min-w-[180px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Поиск по всем столбцам…  ( / )"
            className="focus-ring w-full rounded-lg border border-line bg-panel2 py-2 pl-9 pr-8 text-[13px] text-ink placeholder:text-ink3 hover:border-line2"
          />
          {query && (
            <button
              onClick={() => onQuery("")}
              className="btn-press absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink3 hover:text-ink"
              aria-label="Очистить поиск"
            >
              <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          )}
        </label>

        {hasActiveFilters && (
          <button
            onClick={onResetView}
            className="btn-press focus-ring flex items-center gap-1.5 rounded-lg border border-warn/40 bg-warn-bg px-2.5 py-2 text-[12px] font-medium text-warn"
            title="Сбросить поиск, сортировку и фильтры"
          >
            <Icon name="refresh" className="h-3.5 w-3.5" strokeWidth={2} />
            Сброс
          </button>
        )}

        <button
          onClick={(e) => openPop(e, "cols")}
          className={`btn-press focus-ring flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[12px] font-medium ${
            hiddenCols.length ? "border-accent/50 bg-accent-soft text-accent" : "border-line text-ink2 hover:border-line2 hover:text-ink"
          }`}
          title="Видимые столбцы"
        >
          <Icon name="columns" className="h-4 w-4" />
          Столбцы
          {hiddenCols.length > 0 && <span className="tnum font-mono text-[10px]">−{hiddenCols.length}</span>}
        </button>

        <div className="flex overflow-hidden rounded-lg border border-line">
          {(
            [
              ["cozy", "Крупно"],
              ["compact", "Компактно"],
            ] as [Density, string][]
          ).map(([d, label]) => (
            <button
              key={d}
              onClick={() => onDensity(d)}
              className={`btn-press px-2.5 py-2 text-[12px] font-medium transition-colors ${
                density === d ? "bg-accent-soft text-accent" : "text-ink3 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={onAddRow}
          className="btn-press focus-ring ml-auto flex items-center gap-1.5 rounded-lg border border-dashed border-line2 px-2.5 py-2 text-[12px] font-medium text-ink2 hover:border-accent hover:text-accent"
          title="Добавить строку в конец"
        >
          <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2.2} />
          Строка
        </button>
      </div>

      {/* -------- таблица -------- */}
      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 overflow-auto"
        onScroll={() => pop && setPop(null)}
      >
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-panel2 text-ink3">
              <Icon name={sheet.rows.length === 0 ? "table" : "search"} className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <p className="text-[14px] font-medium text-ink2">
              {sheet.rows.length === 0 ? "Лист пуст" : "Ничего не нашлось"}
            </p>
            <p className="max-w-xs text-[12.5px] leading-relaxed text-ink3">
              {sheet.rows.length === 0
                ? "Добавьте строку кнопкой выше или перенесите данные из Google Sheets."
                : "Попробуйте изменить запрос или сбросить фильтры."}
            </p>
            {sheet.rows.length > 0 && (
              <button
                onClick={onResetView}
                className="btn-press focus-ring mt-1 rounded-lg bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-onaccent"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky top-0 z-20 w-10 border-b border-line bg-panel2 px-2 py-2 text-center font-mono text-[10px] font-medium text-ink3">
                  №
                </th>
                {visibleCols.map((ci) => {
                  const p = profiles[ci];
                  const active = sort?.col === ci;
                  const fActive = filters[ci] && filters[ci].size > 0;
                  return (
                    <th
                      key={ci}
                      className={`group sticky top-0 z-20 border-b border-line bg-panel2 ${cellPad} text-left`}
                    >
                      <div className={`flex items-center gap-1.5 ${p.numeric ? "flex-row-reverse" : ""}`}>
                        <button
                          onClick={() => onSort(ci)}
                          className="btn-press focus-ring flex min-w-0 items-center gap-1.5 rounded text-[11.5px] font-semibold uppercase tracking-[0.04em] text-ink2 hover:text-accent"
                          title="Сортировать"
                        >
                          <span className="truncate">{p.name}</span>
                          {p.numeric && (
                            <span className="shrink-0 font-mono text-[9px] text-ink3" title="Числовой столбец">
                              123
                            </span>
                          )}
                          <span className={`shrink-0 ${active ? "text-accent" : "text-ink3 opacity-0 transition-opacity group-hover:opacity-100"}`}>
                            <Icon name={active && sort.dir === "desc" ? "sortDesc" : "sortAsc"} className="h-3.5 w-3.5" strokeWidth={2.2} />
                          </span>
                        </button>
                        <button
                          onClick={(e) => openPop(e, "filter", ci)}
                          className={`btn-press focus-ring shrink-0 rounded p-1 transition-colors ${
                            fActive ? "bg-accent-soft text-accent" : "text-ink3 opacity-0 hover:text-accent group-hover:opacity-100"
                          }`}
                          title="Фильтр по значениям"
                        >
                          <Icon name="filter" className="h-3 w-3" strokeWidth={2} />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody key={`${sheet.id}-${page}`}>
              {pageRows.map((r, i) => (
                <tr
                  key={r.idx}
                  onClick={() => onOpenRow(r.idx)}
                  className={`anim-rise group cursor-pointer transition-colors ${
                    i % 2 === 1 ? "bg-panel2/50" : ""
                  } hover:bg-accent-soft/60`}
                  style={{ animationDelay: i < 22 ? `${i * 22}ms` : undefined, animationDuration: "0.32s" }}
                >
                  <td className={`border-b border-line/60 px-2 text-center font-mono text-[10.5px] text-ink3 ${cellPad.split(" ")[1]}`}>
                    {page * pageSize + i + 1}
                  </td>
                  {visibleCols.map((ci) => {
                    const p = profiles[ci];
                    const raw = r.cells[ci];
                    const empty = raw === undefined || raw === null || String(raw).trim() === "";
                    const isEditing = edit && edit.row === r.idx && edit.col === ci;
                    const text = empty ? "" : formatCell(raw, p.numeric);
                    return (
                      <td
                        key={ci}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEdit({ row: r.idx, col: ci, draft: String(raw ?? "") });
                        }}
                        className={`border-b border-line/60 ${cellPad} ${textCls} ${
                          p.numeric ? "text-right font-mono text-[12.5px]" : "text-left"
                        } ${empty ? "text-ink3" : "text-ink"} transition-colors`}
                        title="Двойной клик — редактировать"
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            value={edit.draft}
                            onChange={(e) => setEdit({ ...edit, draft: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => {
                              onEditCell(edit.row, edit.col, edit.draft);
                              setEdit(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") setEdit(null);
                            }}
                            className="focus-ring w-full min-w-[90px] rounded-md border border-accent bg-panel2 px-2 py-1 font-sans text-[13px] text-ink outline-none"
                          />
                        ) : empty ? (
                          <span className="select-none opacity-50">—</span>
                        ) : chipCols.has(ci) && text.length <= 26 ? (
                          <span className={`inline-flex max-w-full items-center truncate rounded-md px-2 py-0.5 text-[11.5px] font-semibold ${chipTone(text)}`}>
                            <Hi text={text} q={query} />
                          </span>
                        ) : (
                          <span className={p.numeric ? "tnum" : undefined}>
                            <Hi text={text} q={query} />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="sticky bottom-0 z-10 border-t border-line bg-panel2 px-2 py-2 text-center text-ink3">
                  <Icon name="sigma" className="mx-auto h-3.5 w-3.5" strokeWidth={2} />
                </td>
                {visibleCols.map((ci) => {
                  const p = profiles[ci];
                  return (
                    <td
                      key={ci}
                      className={`sticky bottom-0 z-10 border-t border-line bg-panel2 ${cellPad} text-[12px] ${
                        p.numeric ? "text-right font-mono" : "text-left font-sans"
                      } text-ink2`}
                    >
                      {p.numeric ? (
                        <span className="tnum font-semibold text-accent">{fmtNum.format(Math.round(p.sum * 100) / 100)}</span>
                      ) : p.dateLike ? (
                        <span className="text-[10.5px] uppercase tracking-wide text-ink3">даты</span>
                      ) : (
                        <span className="text-[10.5px] uppercase tracking-wide text-ink3">{p.unique} знач.</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* -------- пагинация -------- */}
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2 text-[12px] text-ink2">
        <span className="tnum font-mono text-[11px]">
          {rows.length === 0
            ? "0 строк"
            : `${fmtNum.format(page * pageSize + 1)}–${fmtNum.format(Math.min(rows.length, (page + 1) * pageSize))} из ${fmtNum.format(rows.length)}`}
        </span>
        <span className="hidden text-ink3 sm:inline">·</span>
        <span className="hidden text-[11px] text-ink3 sm:inline">двойной клик по ячейке — правка, клик по строке — карточка</span>
        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="focus-ring rounded-lg border border-line bg-panel2 px-2 py-1.5 font-mono text-[11px] text-ink2"
            aria-label="Строк на странице"
          >
            {[25, 50, 100, 250].map((n) => (
              <option key={n} value={n}>
                {n} / стр.
              </option>
            ))}
          </select>
          <button
            onClick={() => onPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="btn-press focus-ring rounded-lg border border-line p-1.5 text-ink2 hover:border-line2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Предыдущая страница"
          >
            <Icon name="chevL" className="h-4 w-4" strokeWidth={2} />
          </button>
          <span className="tnum min-w-[52px] text-center font-mono text-[11px] text-ink2">
            {maxPage + 1 > 0 ? `${page + 1} / ${maxPage + 1}` : "—"}
          </span>
          <button
            onClick={() => onPage(Math.min(maxPage, page + 1))}
            disabled={page >= maxPage}
            className="btn-press focus-ring rounded-lg border border-line p-1.5 text-ink2 hover:border-line2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Следующая страница"
          >
            <Icon name="chevR" className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* -------- поповеры -------- */}
      {pop?.kind === "cols" && (
        <Popover x={pop.x} y={pop.y} onClose={() => setPop(null)}>
          <div className="clip-label px-2 pb-1.5 pt-1">Видимые столбцы</div>
          <div className="max-h-64 overflow-y-auto">
            {sheet.columns.map((c, ci) => {
              const on = !hiddenCols.includes(ci);
              return (
                <button
                  key={ci}
                  onClick={() => onToggleCol(ci)}
                  className="btn-press focus-ring flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12.5px] text-ink2 hover:bg-panel2 hover:text-ink"
                >
                  <span className={on ? "text-accent" : "text-ink3"}>
                    <Icon name={on ? "eye" : "eyeOff"} className="h-3.5 w-3.5" />
                  </span>
                  <span className={`flex-1 truncate ${on ? "" : "line-through opacity-60"}`}>{c}</span>
                  {profiles[ci]?.numeric && <span className="font-mono text-[9px] text-ink3">123</span>}
                </button>
              );
            })}
          </div>
          {hiddenCols.length > 0 && (
            <button
              onClick={() => {
                onShowAllCols();
                setPop(null);
              }}
              className="btn-press focus-ring mt-1 w-full rounded-lg bg-accent-soft px-2 py-1.5 text-[12px] font-semibold text-accent"
            >
              Показать все
            </button>
          )}
        </Popover>
      )}

      {pop?.kind === "filter" && (
        <Popover x={pop.x} y={pop.y} onClose={() => setPop(null)} width={264}>
          {(() => {
            const ci = pop.col;
            const values = uniqueByCol.get(ci) ?? [];
            const sel = filters[ci];
            const toggle = (v: string) => {
              const cur = new Set(sel ?? []);
              if (cur.has(v)) cur.delete(v);
              else cur.add(v);
              onFilter(ci, cur.size === 0 ? null : cur);
            };
            return (
              <>
                <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                  <span className="clip-label truncate">Фильтр: {profiles[ci]?.name}</span>
                  {sel && (
                    <button onClick={() => onFilter(ci, null)} className="btn-press text-[11px] font-medium text-accent hover:underline">
                      сбросить
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {values.map((v) => {
                    const on = !sel || sel.has(v);
                    return (
                      <button
                        key={v}
                        onClick={() => toggle(v)}
                        className="btn-press focus-ring flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-panel2"
                      >
                        <span
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors ${
                            on ? "border-accent bg-accent text-onaccent" : "border-line2 bg-transparent text-transparent"
                          }`}
                        >
                          <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                        <span className={`flex-1 truncate ${on ? "text-ink" : "text-ink3"}`}>{v}</span>
                      </button>
                    );
                  })}
                  {values.length === 0 && <p className="px-2 py-3 text-center text-[12px] text-ink3">Нет заполненных значений</p>}
                </div>
              </>
            );
          })()}
        </Popover>
      )}
    </div>
  );
}
