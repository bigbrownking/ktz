'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  History,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Gauge,
  HeartPulse,
  Thermometer,
  Zap,
  Train,
  Activity,
} from 'lucide-react';
import { useTelemetryContext, type TelemetrySnapshot } from '@/shared/lib/telemetry-context';

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950 p-4"
      style={{ boxShadow: '0 0 0 1px rgba(6,182,212,0.06)' }}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-white">
        {value}
        {unit && <span className="ml-1 text-lg font-normal text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

function SpeedSparkline({ points }: { points: TelemetrySnapshot[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
        Накопите записи для графика
      </div>
    );
  }
  const speeds = points.map(p => p.speed);
  const max = Math.max(...speeds, 1);
  const min = Math.min(...speeds, 0);
  const span = Math.max(max - min, 1);
  return (
    <div className="flex h-32 items-end gap-px rounded-xl border border-slate-800 bg-slate-950/50 px-1 pb-1 pt-3">
      {points.map((p, i) => {
        const h = ((p.speed - min) / span) * 100;
        const pct = Math.max(8, Math.round(h));
        const isLast = i === points.length - 1;
        return (
          <div
            key={`${p.ts}-${i}`}
            className="min-w-0 flex-1 rounded-t transition-colors"
            style={{
              height: `${pct}%`,
              background: isLast ? 'linear-gradient(180deg, #22d3ee, #0891b2)' : 'rgba(6,182,212,0.35)',
            }}
            title={`${formatTime(p.ts)} — ${p.speed.toFixed(0)} км/ч`}
          />
        );
      })}
    </div>
  );
}

export default function ReplayPage() {
  const { buffer, locomotiveNumber, connected } = useTelemetryContext();
  const sorted = useMemo(() => [...buffer].sort((a, b) => a.ts - b.ts), [buffer]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (sorted.length === 0) {
      setIdx(0);
      return;
    }
    setIdx(i => Math.min(i, sorted.length - 1));
  }, [sorted.length]);

  useEffect(() => {
    if (!playing || sorted.length < 2) return;
    const interval = setInterval(() => {
      setIdx(i => (i >= sorted.length - 1 ? 0 : i + 1));
    }, 350);
    return () => clearInterval(interval);
  }, [playing, sorted.length]);

  const snap = sorted[idx] ?? null;
  const firstTs = sorted[0]?.ts ?? 0;
  const lastTs = sorted[sorted.length - 1]?.ts ?? 0;
  const ageLabel =
    sorted.length > 0
      ? `${sorted.length} снимков за последние 15 мин · ${formatTime(firstTs)} — ${formatTime(lastTs)}`
      : 'Буфер пуст — откройте кабину или дождитесь потока телеметрии';

  const onSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      setIdx(Math.min(Math.max(0, v), Math.max(0, sorted.length - 1)));
    },
    [sorted.length],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-500/90">
            <History className="h-4 w-4" />
            Пересмотреть / История
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Просмотр телеметрии за 15 минут</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Листайте снимки буфера, включите автопрокрутку или смотрите график скорости. Тот же буфер, что
            экспортируется в CSV/PDF из шапки.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-[#0f1629] px-4 py-3">
          <Train className="h-5 w-5 shrink-0 text-cyan-400" />
          <div>
            <div className="font-mono text-sm font-semibold text-cyan-400">{locomotiveNumber}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-500'}`}
              />
              {connected ? 'Поток WS' : 'Офлайн / мок'}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0b1220] to-[#0f1629] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">{ageLabel}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIdx(0)}
              disabled={sorted.length < 2}
              className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              title="В начало"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPlaying(p => !p)}
              disabled={sorted.length < 2}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-30"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? 'Пауза' : 'Replay'}
            </button>
            <button
              type="button"
              onClick={() => setIdx(sorted.length - 1)}
              disabled={sorted.length < 2}
              className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              title="В конец (сейчас)"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-2">
          <label className="mb-1 block text-xs text-slate-500">
            Время: {snap ? formatTime(snap.ts) : '—'} · кадр {sorted.length ? idx + 1 : 0} / {sorted.length}
          </label>
          <input
            type="range"
            min={0}
            max={Math.max(0, sorted.length - 1)}
            value={sorted.length ? idx : 0}
            onChange={onSlider}
            disabled={sorted.length < 2}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg accent-cyan-500 disabled:opacity-30"
          />
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>Скорость (мини-график)</span>
            {snap && <span>{snap.speed.toFixed(0)} км/ч в выбранной точке</span>}
          </div>
          <SpeedSparkline points={sorted} />
        </div>

        {snap ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              icon={Gauge}
              label="Скорость"
              value={snap.speed.toFixed(0)}
              unit="км/ч"
              color="text-cyan-400"
            />
            <StatCard
              icon={HeartPulse}
              label="Здоровье"
              value={snap.health.toFixed(0)}
              unit="%"
              color="text-emerald-400"
            />
            <StatCard
              icon={Thermometer}
              label="Температура"
              value={snap.temperature.toFixed(1)}
              unit="°C"
              color="text-orange-400"
            />
            <StatCard icon={Activity} label="Категория" value={snap.healthCategory} color="text-slate-300" />
            <StatCard
              icon={Zap}
              label="Напряжение"
              value={snap.voltage.toFixed(0)}
              unit="В"
              color="text-yellow-400"
            />
            <StatCard icon={Gauge} label="Ток" value={snap.current.toFixed(0)} unit="А" color="text-violet-400" />
            <StatCard
              icon={Gauge}
              label="Давл. масла"
              value={snap.oilPressure.toFixed(2)}
              unit="бар"
              color="text-sky-400"
            />
            <StatCard
              icon={Gauge}
              label="Обороты"
              value={Math.round(snap.rpm).toString()}
              unit="об/мин"
              color="text-slate-300"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-16 text-center">
              <History className="mb-3 h-10 w-10 text-slate-600" />
              <p className="text-slate-400">Нет данных в буфере</p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Зайдите в «Кабина» и подождите несколько секунд — снимки начнут накапливаться. Для диспетчера
                выберите локомотив на карте или в списке админки.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
