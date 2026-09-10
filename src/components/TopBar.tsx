import { useRef, useState } from "react";
import { Icon } from "./icons";
import { Popover } from "./ui";

export type ExportKind = "csv" | "json" | "md";

export function TopBar({
  sidebarOpen,
  onToggleSidebar,
  theme,
  onToggleTheme,
  onImport,
  onExport,
  isDemo,
  hasData,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onImport: () => void;
  onExport: (kind: ExportKind) => void;
  isDemo: boolean;
  hasData: boolean;
}) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const expRef = useRef<HTMLButtonElement>(null);

  const openExport = () => {
    const r = expRef.current?.getBoundingClientRect();
    if (r) setMenu({ x: r.right - 240, y: r.bottom + 8 });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-panel/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <button
          onClick={onToggleSidebar}
          className="btn-press focus-ring hidden rounded-lg border border-line p-2 text-ink2 hover:border-line2 hover:text-ink md:block"
          aria-label="Переключить боковую панель"
          title="Боковая панель"
        >
          <Icon name={sidebarOpen ? "chevL" : "chevR"} className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2.5 pr-1">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon name="logo" className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <div className="leading-none">
            <div className="font-display text-[15px] font-bold tracking-tight text-ink">
              ЛАГУНА
            </div>
            <div className="clip-label mt-1 hidden sm:block">читалка таблиц</div>
          </div>
        </div>

        {isDemo && (
          <span className="ml-2 hidden items-center gap-1.5 rounded-full border border-warn/30 bg-warn-bg px-2.5 py-1 text-[11px] font-semibold text-warn sm:flex">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-warn" />
            демо-данные
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onImport}
            className="btn-press focus-ring flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-onaccent shadow-lift hover:opacity-90"
          >
            <Icon name="import" className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">Перенести данные</span>
            <span className="sm:hidden">Импорт</span>
          </button>

          <div className="relative">
            <button
              ref={expRef}
              onClick={hasData ? openExport : undefined}
              disabled={!hasData}
              className="btn-press focus-ring flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] font-medium text-ink2 hover:border-line2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              title="Экспорт"
            >
              <Icon name="export" className="h-4 w-4" strokeWidth={2} />
              <span className="hidden lg:inline">Экспорт</span>
              <Icon name="chevD" className="h-3 w-3" />
            </button>
          </div>

          <button
            onClick={onToggleTheme}
            className="btn-press focus-ring rounded-lg border border-line p-2 text-ink2 hover:border-line2 hover:text-warn"
            aria-label="Переключить тему"
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {menu && (
        <Popover x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          {(
            [
              ["csv", "doc", "CSV (текущий лист, с фильтрами)"],
              ["json", "fileJson", "JSON (весь датасет)"],
              ["md", "copy", "Markdown-таблица (в буфер)"],
            ] as [ExportKind, "doc" | "fileJson" | "copy", string][]
          ).map(([kind, ic, label]) => (
            <button
              key={kind}
              onClick={() => {
                setMenu(null);
                onExport(kind);
              }}
              className="btn-press focus-ring flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink2 hover:bg-accent-soft hover:text-accent"
            >
              <Icon name={ic} className="h-4 w-4" />
              {label}
            </button>
          ))}
        </Popover>
      )}
    </header>
  );
}
