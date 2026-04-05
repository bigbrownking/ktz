'use client';

import { Info } from 'lucide-react';
import { TelemetryData } from '@/shared/lib/mock-data';

interface Props {
  telemetry: TelemetryData;
}

export function HealthIndicatorDetailed({ telemetry }: Props) {
  const { health, healthCategory, healthFactors } = telemetry;

  const radius = 136;
  const strokeWidth = 18;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, health)) / 100) * circumference;

  const getColor = () => {
    if (healthCategory === 'Норма') return '#10b981';
    if (healthCategory === 'Внимание') return '#f59e0b';
    return '#ef4444';
  };

  const getGrade = () => {
    if (health >= 95) return 'A+';
    if (health >= 90) return 'A';
    if (health >= 85) return 'B+';
    if (health >= 80) return 'B';
    if (health >= 75) return 'C+';
    if (health >= 70) return 'C';
    if (health >= 60) return 'D';
    return 'E';
  };

  const color = getColor();

  const healthPct = Math.min(100, Math.max(0, health));

  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#111111] p-8 shadow-lg">
      <h3 className="text-lg font-semibold text-cyan-400 mb-6 flex items-center gap-2">
        <Info className="w-5 h-5 shrink-0" />
        Индекс здоровья локомотива
      </h3>

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[#1a1a1a] p-6">
          <div
            className="relative isolate flex items-center justify-center"
            style={{ width: radius * 2, height: radius * 2 }}
          >
            <svg
              className="pointer-events-none absolute left-0 top-0 -rotate-90"
              height={radius * 2}
              width={radius * 2}
              style={{ zIndex: 0 }}
              aria-hidden
            >
              <circle
                stroke={color}
                fill="none"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <div
              className="pointer-events-none relative z-10 flex h-full w-full items-center justify-center"
              style={{ marginTop: 0 }}
            >
              <span
                className="font-bold tabular-nums leading-none tracking-tight"
                style={{
                  color,
                  fontSize: 'clamp(2.75rem, 6.5vmin, 4rem)',
                  lineHeight: 1,
                }}
              >
                {Math.round(healthPct)}%
              </span>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-slate-400">
            Класс <span className="font-semibold text-slate-300">{getGrade()}</span>
          </p>
          <div className="mt-5 flex w-full max-w-[280px] justify-center px-2">
            <span
              className="inline-flex items-center justify-center px-5 py-2 rounded-full font-bold text-sm"
              style={{ color, backgroundColor: `${color}22` }}
            >
              {healthCategory.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <div className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Top-5 факторов влияния
          </div>

          {healthFactors.slice(0, 5).map((factor, idx) => {
            const factorColor =
              factor.status === 'good' ? '#10b981' : factor.status === 'warning' ? '#f59e0b' : '#ef4444';

            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: factorColor }} />
                    <span className="text-sm text-slate-300">{factor.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Вес: {(factor.weight * 100).toFixed(0)}%</span>
                    <span className="text-sm font-bold text-white">{factor.contribution.toFixed(1)}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ width: `${factor.contribution}%`, backgroundColor: factorColor }}
                  />
                </div>
              </div>
            );
          })}

          <div className="mt-6 p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Формула расчёта</div>
            <div className="text-xs text-slate-500 leading-relaxed">
              Индекс = Σ (Параметр × Вес) - Штрафы за алерты
              <br />
              Порог «Норма»: ≥85% • «Внимание»: 60-84% • «Критично»: &lt;60%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
