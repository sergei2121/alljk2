import { useEffect, useRef, useState } from "react";
import type { ColumnProfile } from "../lib/types";
import { fmtInt, fmtNum } from "../lib/parse";
import { Icon } from "./icons";

function useCountUp(target: number, dur = 480): number {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      fromRef.current = 0;
    }
    const from = fromRef.current;
    if (from === target) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setVal(from + (target - from) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = target;
    };
  }, [target, dur]);
  return val;
}

function StatCard({
  label,
  value,
  suffix,
  sub,
  delay,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  sub?: string;
  delay: number;
  accent?: boolean;
}) {
  const v = useCountUp(value);
  const display = Math.abs(value) >= 100 ? fmtInt.format(Math.round(v)) : fmtNum.format(Math.round(v * 100) / 100);
  return (
    <div
      className="anim-rise min-w-0 flex-1 rounded-xl border border-line bg-panel px-4 py-3.5 transition-colors hover:border-line2"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="clip-label truncate">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`tnum font-display text-[22px] font-bold leading-none tracking-tight ${accent ? "text-accent" : "text-ink"}`}>
          {display}
        </span>
        {suffix && <span className="text-[12px] font-medium text-ink3">{suffix}</span>}
      </div>
      {sub && <div className="tnum mt-1 truncate font-mono text-[10.5px] text-ink3">{sub}</div>}
    </div>
  );
}

export function StatsStrip({
  profiles,
  visibleCols,
  totalRows,
  shownRows,
  filtered,
}: {
  profiles: ColumnProfile[];
  visibleCols: number[];
  totalRows: number;
  shownRows: number;
  filtered: boolean;
}) {
  const numeric = profiles
    .filter((p) => p.numeric && visibleCols.includes(p.index) && p.filled > 0)
    .sort((a, b) => Math.abs(b.sum) - Math.abs(a.sum))
    .slice(0, 3);

  const textish = profiles
    .filter((p) => !p.numeric && visibleCols.includes(p.index) && p.filled > 0)
    .sort((a, b) => b.unique - a.unique)[0];

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1">
      <StatCard
        label="строк в выборке"
        value={shownRows}
        suffix={filtered ? `из ${fmtInt.format(totalRows)}` : undefined}
        sub={filtered ? "действуют поиск или фильтры" : "показаны все строки листа"}
        delay={0}
        accent={filtered}
      />
      {numeric.map((p, i) => (
        <StatCard
          key={`${p.index}-${p.name}`}
          label={`Σ ${p.name}`}
          value={p.sum}
          sub={`среднее ${fmtNum.format(Math.round(p.avg * 100) / 100)} · мин ${fmtNum.format(p.min)} · макс ${fmtNum.format(p.max)}`}
          delay={60 * (i + 1)}
        />
      ))}
      {textish && (
        <StatCard
          label={`${textish.name} — значений`}
          value={textish.unique}
          sub={`заполнено ${textish.filled} из ${totalRows}`}
          delay={60 * (numeric.length + 1)}
        />
      )}
      {numeric.length === 0 && !textish && (
        <div className="anim-rise flex flex-1 items-center gap-2.5 rounded-xl border border-dashed border-line2 px-4 py-3.5 text-[12.5px] text-ink3" style={{ animationDelay: "60ms" }}>
          <Icon name="info" className="h-4 w-4 shrink-0" />
          Статистика появится, когда в листе будут данные.
        </div>
      )}
    </div>
  );
}
