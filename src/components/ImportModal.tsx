import { useEffect, useMemo, useRef, useState } from "react";
import type { Delim } from "../lib/parse";
import { detectDelimiter, parseTableText, sheetsFromJson } from "../lib/parse";
import type { ImportedSheet } from "../lib/parse";
import { fetchBootstrapData } from "../lib/store";
import { Icon } from "./icons";
import { Kbd } from "./ui";

type Tab = "paste" | "file" | "help";

export function ImportModal({
  initialTab,
  defaultName,
  hasSheet,
  onCancel,
  onImport,
  onToast,
}: {
  initialTab: Tab;
  defaultName: string;
  hasSheet: boolean;
  onCancel: () => void;
  onImport: (sheets: ImportedSheet[], mode: "new" | "replace", name: string) => void;
  onToast: (kind: "ok" | "warn" | "bad" | "info", text: string) => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [text, setText] = useState("");
  const [delimMode, setDelimMode] = useState<"auto" | Delim>("auto");
  const [firstRowHeader, setFirstRowHeader] = useState(true);
  const [name, setName] = useState(defaultName);
  const [mode, setMode] = useState<"new" | "replace">("new");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isJson, setIsJson] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [checking, setChecking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);

  useEffect(() => {
    if (tab === "paste") setTimeout(() => areaRef.current?.focus(), 60);
  }, [tab]);

  const delim: Delim = delimMode === "auto" ? detectDelimiter(text) : delimMode;

  const preview = useMemo<ImportedSheet[] | null>(() => {
    const t = text.trim();
    if (!t) return null;
    if (isJson || t.startsWith("{") || t.startsWith("[")) {
      try {
        return sheetsFromJson(JSON.parse(t));
      } catch {
        if (isJson) return null;
      }
    }
    const p = parseTableText(t, delim, firstRowHeader);
    if (p.columns.length === 0 || p.rows.length === 0) return null;
    return [{ name: name || "Лист", ...p }];
  }, [text, delim, firstRowHeader, isJson, name]);

  const badJson = isJson && text.trim() !== "" && preview === null;

  const readFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setFileName(f.name);
    const json = /\.json$/i.test(f.name);
    setIsJson(json);
    if (json) setTab("paste");
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ""));
      const base = f.name.replace(/\.[^.]+$/, "");
      if (base) setName(base);
      setTab(json ? "paste" : "paste");
    };
    reader.readAsText(f, "utf-8");
  };

  const checkBootstrap = async () => {
    setChecking(true);
    const d = await fetchBootstrapData();
    setChecking(false);
    if (d) {
      onImport(
        d.sheets.map((s) => ({ name: s.name, columns: s.columns, rows: s.rows })),
        "new",
        d.title
      );
    } else {
      onToast("warn", "Файл data/data.json не найден или не читается. В docker-версии положите его в папку ./data");
    }
  };

  const totalRows = preview ? preview.reduce((a, s) => a + s.rows.length, 0) : 0;
  const canImport = !!preview && totalRows > 0 && name.trim() !== "";

  return (
    <div className="anim-fade fixed inset-0 z-[75] flex items-center justify-center bg-navy-950/65 p-3 backdrop-blur-[4px]" onMouseDown={onCancel}>
      <div
        className="anim-pop flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-lift"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* заголовок */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon name="import" className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[15px] font-bold tracking-tight text-ink">Перенос данных</h2>
            <p className="truncate text-[12px] text-ink3">вставка из Google Sheets · CSV/TSV/JSON файл</p>
          </div>
          <button onClick={onCancel} className="btn-press focus-ring rounded-lg border border-line p-2 text-ink3 hover:text-ink" aria-label="Закрыть">
            <Icon name="close" className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* вкладки */}
        <div className="flex gap-1 border-b border-line px-3 pt-2.5">
          {(
            [
              ["paste", "clipboard", "Вставить"],
              ["file", "doc", "Файл"],
              ["help", "info", "Как перенести"],
            ] as [Tab, "clipboard" | "doc" | "info", string][]
          ).map(([t, ic, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`btn-press focus-ring flex items-center gap-2 rounded-t-lg border border-b-0 px-3.5 py-2 text-[12.5px] font-medium transition-colors ${
                tab === t ? "border-line bg-panel2 text-accent" : "border-transparent text-ink3 hover:text-ink"
              }`}
            >
              <Icon name={ic} className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* содержимое */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "file" && (
            <div className="anim-rise">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  readFiles(e.dataTransfer.files);
                }}
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  dragOver ? "border-accent bg-accent-soft" : "border-line2 hover:border-accent/60 hover:bg-panel2/60"
                }`}
              >
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${dragOver ? "bg-accent text-onaccent" : "bg-panel2 text-accent"}`}>
                  <Icon name="doc" className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-ink">Перетащите файл сюда</p>
                  <p className="mt-1 text-[12.5px] text-ink3">
                    или <span className="font-medium text-accent">выберите на диске</span> · .csv · .tsv · .txt · .json
                  </p>
                </div>
                {fileName && (
                  <span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 font-mono text-[11px] text-accent">
                    <Icon name="check" className="h-3 w-3" strokeWidth={2.5} />
                    {fileName}
                  </span>
                )}
                <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.json" className="hidden" onChange={(e) => readFiles(e.target.files)} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="btn-press focus-ring rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-ink2 hover:border-line2 hover:text-ink"
                >
                  Выбрать файл
                </button>
              </label>
              <p className="mt-3 text-center text-[11.5px] text-ink3">
                В Google Sheets: <span className="text-ink2">Файл → Скачать → CSV</span>, затем загрузите его сюда
              </p>
            </div>
          )}

          {tab === "paste" && (
            <div className="anim-rise flex flex-col gap-3">
              <textarea
                ref={areaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={() => setTimeout(() => setText((t) => t), 0)}
                placeholder={"Вставьте сюда содержимое таблицы (Ctrl+V)…\nНапример, выделите диапазон в Google Sheets и скопируйте его."}
                className="focus-ring h-40 w-full resize-none rounded-xl border border-line bg-panel2 p-3 font-mono text-[12px] leading-relaxed text-ink placeholder:font-sans placeholder:text-ink3 hover:border-line2"
                spellCheck={false}
              />
              {badJson && (
                <p className="flex items-center gap-2 rounded-lg bg-bad-bg px-3 py-2 text-[12px] font-medium text-bad">
                  <Icon name="warn" className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  JSON не разбирается — проверьте синтаксис файла.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-ink2">
                <label className="flex items-center gap-2">
                  <span className="clip-label">Разделитель</span>
                  <select
                    value={delimMode}
                    onChange={(e) => setDelimMode(e.target.value as "auto" | Delim)}
                    disabled={isJson}
                    className="focus-ring rounded-lg border border-line bg-panel2 px-2 py-1.5 font-mono text-[11.5px] text-ink disabled:opacity-40"
                  >
                    <option value="auto">авто{!isJson && text ? ` (${delim === "\t" ? "таб" : delim})` : ""}</option>
                    <option value="\t">табуляция</option>
                    <option value=";">точка с запятой</option>
                    <option value=",">запятая</option>
                  </select>
                </label>
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <button
                    onClick={() => setFirstRowHeader((v) => !v)}
                    className={`grid h-4 w-4 place-items-center rounded border transition-colors ${
                      firstRowHeader ? "border-accent bg-accent text-onaccent" : "border-line2 text-transparent"
                    }`}
                    role="switch"
                    aria-checked={firstRowHeader}
                  >
                    <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3} />
                  </button>
                  первая строка — заголовки
                </label>
              </div>

              {preview && preview[0] && (
                <div className="overflow-hidden rounded-xl border border-line">
                  <div className="flex items-center justify-between border-b border-line bg-panel2 px-3 py-2">
                    <span className="clip-label">Предпросмотр</span>
                    <span className="tnum font-mono text-[11px] text-accent">
                      {preview.length > 1 ? `${preview.length} листов · ` : ""}
                      {preview[0].columns.length} столбц. × {totalRows} строк
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11.5px]">
                      <thead>
                        <tr>
                          {preview[0].columns.slice(0, 7).map((c, i) => (
                            <th key={i} className="whitespace-nowrap border-b border-line bg-panel2/60 px-2.5 py-1.5 text-left font-semibold text-ink2">
                              {c}
                            </th>
                          ))}
                          {preview[0].columns.length > 7 && <th className="px-2 py-1.5 text-ink3">…</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {preview[0].rows.slice(0, 5).map((r, ri) => (
                          <tr key={ri} className={ri % 2 ? "bg-panel2/40" : ""}>
                            {r.slice(0, 7).map((c, ci) => (
                              <td key={ci} className="max-w-[160px] truncate whitespace-nowrap px-2.5 py-1.5 font-mono text-ink2">
                                {String(c)}
                              </td>
                            ))}
                            {preview[0].columns.length > 7 && <td className="px-2 text-ink3">…</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "help" && (
            <div className="anim-rise flex flex-col gap-4">
              {[
                {
                  ic: "table" as const,
                  title: "1 · Скопируйте в Google Sheets",
                  body: <>Откройте таблицу, кликните на угол диапазона и выделите всё (<Kbd>Ctrl</Kbd>+<Kbd>A</Kbd>), затем скопируйте (<Kbd>Ctrl</Kbd>+<Kbd>C</Kbd>). Структура ячеек сохранится.</>,
                },
                {
                  ic: "clipboard" as const,
                  title: "2 · Вставьте сюда",
                  body: <>Нажмите «Перенести данные» → вкладка «Вставить» → <Kbd>Ctrl</Kbd>+<Kbd>V</Kbd>. Разделители (табуляция, «;», «,») определятся автоматически.</>,
                },
                {
                  ic: "doc" as const,
                  title: "3 · Или файлом",
                  body: <>В Google Sheets: <span className="font-medium text-ink">Файл → Скачать → CSV</span>. Поддерживаются CSV, TSV, TXT и JSON (в том числе с несколькими листами).</>,
                },
                {
                  ic: "fileJson" as const,
                  title: "4 · Серверный файл data/data.json",
                  body: <>В docker-версии положите JSON в папку <code className="rounded bg-panel2 px-1 py-0.5 font-mono text-[11px] text-accent">./data</code> — сайт подхватит его при первом запуске. Формат: <code className="rounded bg-panel2 px-1 py-0.5 font-mono text-[11px] text-accent">{"{\"sheets\":[{\"name\",\"columns\",\"rows\"}]}"}</code>.</>,
                },
              ].map((s) => (
                <div key={s.title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                    <Icon name={s.ic} className="h-4.5 w-4.5" strokeWidth={1.7} />
                  </span>
                  <div>
                    <h3 className="text-[13px] font-semibold text-ink">{s.title}</h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">{s.body}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={checkBootstrap}
                disabled={checking}
                className="btn-press focus-ring mt-1 flex items-center justify-center gap-2 self-start rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-ink2 hover:border-accent/60 hover:text-accent disabled:opacity-50"
              >
                <Icon name="refresh" className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} strokeWidth={2} />
                {checking ? "Проверяю…" : "Проверить data/data.json"}
              </button>
            </div>
          )}
        </div>

        {/* настройки и действия */}
        <div className="border-t border-line bg-panel2/50 px-5 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-[12.5px] text-ink2">
              <span className="clip-label">Название</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="focus-ring w-44 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-[12.5px] font-medium text-ink"
                placeholder="Название листа"
              />
            </label>
            <div className="flex items-center gap-1 rounded-lg border border-line p-0.5">
              {(
                [
                  ["new", "Новый лист"],
                  ["replace", "Заменить текущий"],
                ] as ["new" | "replace", string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  disabled={m === "replace" && !hasSheet}
                  className={`btn-press rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                    mode === m ? "bg-accent text-onaccent" : "text-ink3 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="tnum text-[11.5px] text-ink3">
              {preview ? `Распознано: ${totalRows} строк` : "Данные ещё не распознаны"}
            </p>
            <div className="flex gap-2">
              <button onClick={onCancel} className="btn-press focus-ring rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink2 hover:text-ink">
                Отмена
              </button>
              <button
                onClick={() => preview && onImport(preview, mode, name.trim())}
                disabled={!canImport}
                className="btn-press focus-ring flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-onaccent shadow-lift hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="import" className="h-4 w-4" strokeWidth={2} />
                Импортировать
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
