import { useEffect, type ReactNode } from "react";
import type { Toast } from "../lib/types";
import { Icon, type IconName } from "./icons";

/* ---------------- Toasts ---------------- */

const TOAST_ICON: Record<Toast["kind"], IconName> = { ok: "check", warn: "warn", bad: "warn", info: "info" };
const TOAST_TONE: Record<Toast["kind"], string> = {
  ok: "text-ok",
  warn: "text-warn",
  bad: "text-bad",
  info: "text-accent",
};

export function Toasts({ list, onClose }: { list: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[90] flex w-[min(92vw,360px)] flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className="anim-pop flex items-start gap-3 rounded-lg border border-line bg-panel px-3.5 py-3 shadow-lift"
        >
          <span className={`mt-0.5 shrink-0 ${TOAST_TONE[t.kind]}`}>
            <Icon name={TOAST_ICON[t.kind]} className="h-4 w-4" strokeWidth={2} />
          </span>
          <p className="flex-1 text-[13px] leading-snug text-ink">{t.text}</p>
          <button
            onClick={() => onClose(t.id)}
            className="btn-press shrink-0 rounded p-0.5 text-ink3 hover:text-ink focus-ring"
            aria-label="Закрыть уведомление"
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Подтверждение ---------------- */

export function ConfirmModal({
  title,
  text,
  danger,
  okLabel,
  onOk,
  onCancel,
}: {
  title: string;
  text: ReactNode;
  danger?: boolean;
  okLabel: string;
  onOk: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div className="anim-fade fixed inset-0 z-[80] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-[3px]" onMouseDown={onCancel}>
      <div
        className="anim-pop w-full max-w-sm rounded-xl border border-line bg-panel p-5 shadow-lift"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 rounded-lg p-2 ${danger ? "bg-bad-bg text-bad" : "bg-accent-soft text-accent"}`}>
            <Icon name={danger ? "warn" : "info"} className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h3 className="font-display text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
            <div className="mt-1.5 text-[13px] leading-relaxed text-ink2">{text}</div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="btn-press focus-ring rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium text-ink2 hover:border-line2 hover:text-ink"
          >
            Отмена
          </button>
          <button
            onClick={onOk}
            className={`btn-press focus-ring rounded-lg px-3.5 py-2 text-[13px] font-semibold text-onaccent ${
              danger ? "bg-bad hover:opacity-90" : "bg-accent hover:opacity-90"
            }`}
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Поповер (фиксированный) ---------------- */

export function Popover({
  x,
  y,
  onClose,
  children,
  width = 248,
}: {
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const left = Math.max(8, Math.min(x, window.innerWidth - width - 12));
  const top = Math.max(8, Math.min(y, window.innerHeight - 120));
  return (
    <>
      <div className="fixed inset-0 z-[60]" onMouseDown={onClose} onWheel={onClose} />
      <div
        className="anim-pop fixed z-[70] rounded-xl border border-line bg-panel p-2 shadow-lift"
        style={{ left, top, width }}
      >
        {children}
      </div>
    </>
  );
}

/* ---------------- Мелочи ---------------- */

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line2 bg-panel2 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-ink2">
      {children}
    </kbd>
  );
}

export function chipTone(value: string): string {
  const v = value.toLowerCase();
  if (/(оплачен|готово|выполнен|да\b|актив|доставлен|принят)/.test(v)) return "bg-ok-bg text-ok";
  if (/(отмен|ошиб|нет\b|брак|возврат)/.test(v)) return "bg-bad-bg text-bad";
  if (/(пути|ожид|процесс|частич|резерв|скоро)/.test(v)) return "bg-warn-bg text-warn";
  let h = 0;
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) >>> 0;
  return h % 3 === 0 ? "bg-accent-soft text-accent" : h % 3 === 1 ? "bg-panel2 text-ink2" : "bg-accent-soft text-accent";
}
