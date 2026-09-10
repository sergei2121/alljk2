import { Icon } from "./icons";
import { Kbd, chipTone } from "./ui";

const MOCK: { cells: [string, string, string, string]; status: string }[] = [
  { cells: ["ЗК-1041", "ООО «Вектор»", "186 000", "02.09"], status: "Оплачен" },
  { cells: ["ЗК-1043", "АО «Полюс»", "240 500", "05.09"], status: "В пути" },
  { cells: ["ЗК-1045", "ООО «Терра»", "21 750", "08.09"], status: "Ожидает" },
  { cells: ["ЗК-1050", "ООО «Квант»", "18 375", "16.09"], status: "Отменён" },
  { cells: ["ЗК-1053", "АО «Меридиан»", "512 500", "22.09"], status: "Ожидает" },
  { cells: ["ЗК-1057", "ООО «Вектор»", "174 400", "28.09"], status: "Оплачен" },
];

export function EmptyState({
  onImportPaste,
  onImportFile,
  onLoadDemo,
}: {
  onImportPaste: () => void;
  onImportFile: () => void;
  onLoadDemo: () => void;
}) {
  return (
    <div className="flex min-h-full items-center overflow-y-auto">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        {/* левая колонка */}
        <div>
          <div className="anim-rise flex items-center gap-2.5">
            <span className="h-px w-8 bg-accent" />
            <span className="clip-label !text-accent">локально · без облака · docker compose</span>
          </div>
          <h1 className="anim-rise mt-4 font-display text-[clamp(26px,4.2vw,44px)] font-extrabold leading-[1.08] tracking-tight text-ink" style={{ animationDelay: "70ms" }}>
            Таблица из Google&nbsp;Sheets —{" "}
            <span className="text-accent">читается как книга</span>
          </h1>
          <p className="anim-rise mt-4 max-w-lg text-[14.5px] leading-relaxed text-ink2" style={{ animationDelay: "140ms" }}>
            Перенесите данные один раз — и листайте их с поиском, сортировкой, фильтрами по значениям
            и живой статистикой по столбцам. Всё хранится у вас, в браузере или в файле.
          </p>

          <div className="anim-rise mt-6 flex flex-wrap items-center gap-3" style={{ animationDelay: "210ms" }}>
            <button
              onClick={onImportPaste}
              className="btn-press focus-ring flex items-center gap-2.5 rounded-xl bg-accent px-5 py-3 text-[14px] font-bold text-onaccent shadow-lift hover:opacity-90"
            >
              <Icon name="clipboard" className="h-4.5 w-4.5" strokeWidth={1.9} />
              Вставить из буфера
              <span className="hidden items-center gap-1 rounded-md bg-onaccent/15 px-1.5 py-0.5 font-mono text-[10px] font-medium sm:flex">
                Ctrl+V
              </span>
            </button>
            <button
              onClick={onImportFile}
              className="btn-press focus-ring flex items-center gap-2 rounded-xl border border-line px-4.5 py-3 text-[13.5px] font-semibold text-ink2 hover:border-line2 hover:text-ink"
            >
              <Icon name="doc" className="h-4 w-4" />
              Файл CSV / JSON
            </button>
            <button
              onClick={onLoadDemo}
              className="btn-press focus-ring flex items-center gap-2 rounded-xl px-3 py-3 text-[13px] font-semibold text-accent hover:bg-accent-soft"
            >
              <Icon name="spark" className="h-4 w-4" strokeWidth={1.9} />
              демо-данные
            </button>
          </div>

          <ol className="anim-rise mt-8 flex max-w-lg flex-col gap-3" style={{ animationDelay: "280ms" }}>
            {[
              <>В Google Sheets выделите диапазон: <Kbd>Ctrl</Kbd>+<Kbd>A</Kbd>, затем <Kbd>Ctrl</Kbd>+<Kbd>C</Kbd></>,
              <>Вставьте сюда <Kbd>Ctrl</Kbd>+<Kbd>V</Kbd> — заголовки и разделители определятся сами</>,
              <>Кликните строку для карточки, дважды кликните ячейку для правки</>,
            ].map((node, i) => (
              <li key={i} className="flex items-start gap-3 text-[13px] leading-snug text-ink2">
                <span className="mt-px grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-line bg-panel font-mono text-[11px] font-bold text-accent">
                  {i + 1}
                </span>
                <span>{node}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* правая колонка — живой макет */}
        <div className="anim-rise relative hidden lg:block" style={{ animationDelay: "200ms" }}>
          <div className="anim-bob relative">
            <div className="absolute -inset-6 -z-10 rounded-[28px] bg-accent-soft blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-line bg-panel shadow-lift" style={{ transform: "rotate(-1.2deg)" }}>
              <div className="flex items-center gap-1.5 border-b border-line bg-panel2/70 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-bad/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
                <span className="ml-3 font-mono text-[10.5px] text-ink3">заказы — сентябрь.csv</span>
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[9.5px] font-semibold text-accent">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
                  24 строки
                </span>
              </div>
              <div className="relative">
                <div className="scanline" />
                <table className="w-full text-[12px]">
                  <thead>
                    <tr>
                      {["№", "Клиент", "Сумма", "Дата", "Статус"].map((h) => (
                        <th key={h} className="border-b border-line bg-panel2/50 px-3.5 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-ink3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK.map((r, i) => (
                      <tr key={i} className={`anim-rise ${i % 2 ? "bg-panel2/40" : ""}`} style={{ animationDelay: `${350 + i * 90}ms` }}>
                        <td className="px-3.5 py-2 font-mono text-[11px] text-ink3">{r.cells[0]}</td>
                        <td className="px-3.5 py-2 font-medium text-ink">{r.cells[1]}</td>
                        <td className="tnum px-3.5 py-2 text-right font-mono text-[11.5px] text-accent">{r.cells[2]}</td>
                        <td className="px-3.5 py-2 font-mono text-[11px] text-ink3">{r.cells[3]}</td>
                        <td className="px-3.5 py-2">
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${chipTone(r.status)}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
                <span className="font-mono text-[10px] text-ink3">Σ 1 773 050 ₽</span>
                <span className="flex items-center gap-1 text-[10.5px] font-medium text-accent">
                  <Icon name="wave" className="h-3.5 w-3.5" strokeWidth={2} />
                  читается легко
                </span>
              </div>
            </div>

            {/* плавающие бейджи */}
            <div className="anim-rise absolute -left-8 top-10 flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 shadow-lift" style={{ animationDelay: "700ms", transform: "rotate(2deg)" }}>
              <span className="text-accent"><Icon name="filter" className="h-3.5 w-3.5" strokeWidth={2} /></span>
              <span className="text-[11px] font-semibold text-ink2">фильтр по статусу</span>
            </div>
            <div className="anim-rise absolute -right-5 bottom-14 flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 shadow-lift" style={{ animationDelay: "850ms", transform: "rotate(-2deg)" }}>
              <span className="text-ok"><Icon name="sigma" className="h-3.5 w-3.5" strokeWidth={2} /></span>
              <span className="text-[11px] font-semibold text-ink2">Σ по столбцу</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
