import { useState } from "react";
import type { Dataset } from "../lib/types";
import { Icon } from "./icons";
import { Kbd } from "./ui";

export function Sidebar({
  open,
  dataset,
  activeSheetId,
  sizeLabel,
  onSwitchSheet,
  onTitleChange,
  onLoadDemo,
  onClearAll,
}: {
  open: boolean;
  dataset: Dataset | null;
  activeSheetId: string | null;
  sizeLabel: string;
  onSwitchSheet: (id: string) => void;
  onTitleChange: (title: string) => void;
  onLoadDemo: () => void;
  onClearAll: () => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draft, setDraft] = useState("");

  const totalRows = dataset ? dataset.sheets.reduce((a, s) => a + s.rows.length, 0) : 0;
  const updated = dataset
    ? new Date(dataset.updatedAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <aside
      className={`${open ? "md:w-[264px]" : "md:w-0"} hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-out md:block`}
    >
      <div className="flex h-full w-[264px] flex-col gap-3 overflow-y-auto border-r border-line p-3">
        {/* датасет */}
        <section className="anim-rise rounded-xl border border-line bg-panel p-3.5">
          <div className="clip-label">Датасет</div>
          {dataset ? (
            <>
              {editingTitle ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => {
                    onTitleChange(draft.trim() || dataset.title);
                    setEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  className="focus-ring mt-1.5 w-full rounded-md border border-accent bg-panel2 px-2 py-1 text-[14px] font-semibold text-ink outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    setDraft(dataset.title);
                    setEditingTitle(true);
                  }}
                  title="Нажмите, чтобы переименовать"
                  className="focus-ring mt-1.5 flex w-full items-center gap-1.5 rounded-md text-left text-[14px] font-semibold text-ink hover:text-accent"
                >
                  <span className="truncate">{dataset.title}</span>
                  <Icon name="pencil" className="h-3 w-3 shrink-0 text-ink3" />
                </button>
              )}
              <dl className="mt-3 grid grid-cols-3 gap-1.5 text-center">
                {[
                  [String(dataset.sheets.length), "листов"],
                  [String(totalRows), "строк"],
                  [sizeLabel, "объём"],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-lg bg-panel2 px-1 py-2">
                    <dt className="clip-label !text-[9px]">{l}</dt>
                    <dd className="tnum mt-0.5 font-display text-[13px] font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2.5 text-[11px] text-ink3">обновлён {updated} · хранится локально в браузере</p>
            </>
          ) : (
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink2">
              Пока пусто. Перенесите таблицу из Google Sheets — вставкой или файлом.
            </p>
          )}
        </section>

        {/* листы */}
        {dataset && dataset.sheets.length > 0 && (
          <section className="anim-rise rounded-xl border border-line bg-panel p-3.5" style={{ animationDelay: "60ms" }}>
            <div className="clip-label">Листы</div>
            <ul className="mt-2 flex flex-col gap-1">
              {dataset.sheets.map((s) => {
                const active = s.id === activeSheetId;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => onSwitchSheet(s.id)}
                      className={`btn-press focus-ring group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                        active ? "bg-accent-soft text-accent" : "text-ink2 hover:bg-panel2 hover:text-ink"
                      }`}
                    >
                      <Icon name="table" className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                      <span className="flex-1 truncate text-[13px] font-medium">{s.name}</span>
                      <span className="tnum shrink-0 rounded bg-panel2 px-1.5 py-0.5 font-mono text-[10px] text-ink3 group-hover:text-ink2">
                        {s.rows.length}×{s.columns.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* как перенести */}
        <section className="anim-rise rounded-xl border border-line bg-panel p-3.5" style={{ animationDelay: "120ms" }}>
          <div className="clip-label">Как перенести</div>
          <ol className="mt-2.5 flex flex-col gap-2.5">
            {[
              <>В Google Sheets выделите диапазон и нажмите <Kbd>Ctrl</Kbd>+<Kbd>C</Kbd></>,
              <>Здесь — «Перенести данные» → вставьте <Kbd>Ctrl</Kbd>+<Kbd>V</Kbd></>,
              <>Готово: сортируйте, ищите, фильтруйте</>,
            ].map((node, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12.5px] leading-snug text-ink2">
                <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md bg-accent-soft font-mono text-[10.5px] font-bold text-accent">
                  {i + 1}
                </span>
                <span>{node}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink3">
            В docker-версии данные также подхватываются из файла{" "}
            <code className="rounded bg-panel2 px-1 py-0.5 font-mono text-[10.5px] text-accent">./data/data.json</code>
          </p>
        </section>

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <button
            onClick={onLoadDemo}
            className="btn-press focus-ring flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-ink2 hover:border-accent/50 hover:text-accent"
          >
            <Icon name="spark" className="h-3.5 w-3.5" />
            Загрузить демо-данные
          </button>
          {dataset && (
            <button
              onClick={onClearAll}
              className="btn-press focus-ring flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-ink3 hover:border-bad/50 hover:text-bad"
            >
              <Icon name="trash" className="h-3.5 w-3.5" />
              Очистить всё
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
