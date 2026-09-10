import { useEffect, useState } from "react";
import type { Cell, ColumnProfile, SheetData } from "../lib/types";
import { formatCell, isDateLike } from "../lib/parse";
import { Icon } from "./icons";
import { chipTone } from "./ui";

export function DetailDrawer({
  sheet,
  profiles,
  rowIdx,
  order,
  onClose,
  onNav,
  onEditCell,
  onDeleteRow,
}: {
  sheet: SheetData;
  profiles: ColumnProfile[];
  rowIdx: number;
  order: number[];
  onClose: () => void;
  onNav: (rowIdx: number) => void;
  onEditCell: (rowIdx: number, colIdx: number, value: string) => void;
  onDeleteRow: (rowIdx: number) => void;
}) {
  const [editCol, setEditCol] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const row = sheet.rows[rowIdx];
  const pos = order.indexOf(rowIdx);

  useEffect(() => {
    setEditCol(null);
  }, [rowIdx]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && pos > 0) onNav(order[pos - 1]);
      if (e.key === "ArrowRight" && pos < order.length - 1) onNav(order[pos + 1]);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, onNav, order, pos]);

  if (!row) return null;

  return (
    <div className="fixed inset-0 z-[65]">
      <div className="anim-fade absolute inset-0 bg-navy-950/55 backdrop-blur-[2px]" onMouseDown={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[400px] flex-col border-l border-line bg-panel shadow-lift">
        <div className="anim-pop h-full origin-right" style={{ animation: "pop .28s cubic-bezier(.22,.9,.3,1) both" }}>
          <div className="flex items-center gap-2 border-b border-line px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="clip-label">{sheet.name}</div>
              <h2 className="tnum mt-0.5 font-display text-[16px] font-bold tracking-tight text-ink">
                Строка {rowIdx + 1}
                <span className="ml-2 text-[11px] font-medium text-ink3">
                  {pos >= 0 ? `${pos + 1} из ${order.length} в выборке` : "вне текущей выборки"}
                </span>
              </h2>
            </div>
            <button
              onClick={() => pos > 0 && onNav(order[pos - 1])}
              disabled={pos <= 0}
              className="btn-press focus-ring rounded-lg border border-line p-2 text-ink2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Предыдущая строка"
            >
              <Icon name="chevL" className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => pos < order.length - 1 && onNav(order[pos + 1])}
              disabled={pos < 0 || pos >= order.length - 1}
              className="btn-press focus-ring rounded-lg border border-line p-2 text-ink2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Следующая строка"
            >
              <Icon name="chevR" className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              onClick={onClose}
              className="btn-press focus-ring rounded-lg border border-line p-2 text-ink3 hover:text-ink"
              aria-label="Закрыть карточку"
            >
              <Icon name="close" className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <ul className="flex flex-col gap-2.5">
              {sheet.columns.map((c, ci) => {
                const raw: Cell = row[ci] ?? "";
                const empty = String(raw).trim() === "";
                const p = profiles[ci];
                const text = empty ? "" : formatCell(raw, !!p?.numeric);
                const chip = p && !p.numeric && !p.dateLike && p.unique <= 10 && text.length <= 26;
                const dateLike = typeof raw === "string" && isDateLike(raw);
                return (
                  <li key={ci} className="anim-rise rounded-xl border border-line bg-panel2/60 px-3.5 py-2.5" style={{ animationDelay: `${Math.min(ci * 30, 300)}ms` }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="clip-label truncate">{c}</span>
                      {editCol === ci ? null : (
                        <button
                          onClick={() => {
                            setEditCol(ci);
                            setDraft(String(raw));
                          }}
                          className="btn-press rounded p-1 text-ink3 hover:text-accent"
                          title="Редактировать поле"
                        >
                          <Icon name="pencil" className="h-3 w-3" strokeWidth={1.9} />
                        </button>
                      )}
                    </div>
                    {editCol === ci ? (
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => {
                          onEditCell(rowIdx, ci, draft);
                          setEditCol(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") setEditCol(null);
                        }}
                        className="focus-ring mt-1.5 w-full rounded-lg border border-accent bg-panel px-2.5 py-1.5 text-[13px] text-ink outline-none"
                      />
                    ) : empty ? (
                      <p className="mt-1 text-[13px] italic text-ink3">пусто</p>
                    ) : chip ? (
                      <span className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-semibold ${chipTone(text)}`}>{text}</span>
                    ) : p?.numeric ? (
                      <p className="tnum mt-1 font-mono text-[15px] font-semibold text-accent">{text}</p>
                    ) : (
                      <p className={`mt-1 break-words text-[13.5px] leading-snug text-ink ${dateLike ? "font-mono text-[12.5px] text-ink2" : ""}`}>{text}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-2 border-t border-line px-4 py-3">
            <p className="flex-1 text-[11px] text-ink3">
              <span className="font-mono">←</span> / <span className="font-mono">→</span> — листать строки
            </p>
            <button
              onClick={() => onDeleteRow(rowIdx)}
              className="btn-press focus-ring flex items-center gap-1.5 rounded-lg border border-bad/40 bg-bad-bg px-3 py-2 text-[12px] font-semibold text-bad hover:opacity-85"
            >
              <Icon name="trash" className="h-3.5 w-3.5" strokeWidth={2} />
              Удалить строку
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
