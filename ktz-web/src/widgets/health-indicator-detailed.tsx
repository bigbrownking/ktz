'use client';

import { Info } from 'lucide-react';
import { TelemetryData } from '@/shared/lib/mock-data';

interface Props {
  telemetry: TelemetryData;
}

export function HealthIndicatorDetailed({ telemetry }: Props) {
  const { health, healthCategory, healthFactors } = telemetry;

  const radius = 120;
  const strokeWidth = 16;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (health / 100) * circumference;

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

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8">
      <h3 className="text-lg font-semibold text-cyan-400 mb-6 flex items-center gap-2">
        <Info className="w-5 h-5" />
        Индекс здоровья локомотива
      </h3>

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              <circle
                stroke="#1e293b"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke={color}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                suppressHydrationWarning
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" suppressHydrationWarning>
              <div className="text-6xl font-bold" style={{ color }} suppressHydrationWarning>
                {getGrade()}
              </div>
              <div className="text-3xl font-bold text-slate-400 mt-1" suppressHydrationWarning>
                {Math.round(health)}%
              </div>
            </div>
          </div>
          <div
            className="mt-6 px-6 py-2 rounded-full font-bold text-sm border-2"
            style={{ color, borderColor: color, backgroundColor: `${color}20` }}
          >
            {healthCategory.toUpperCase()}
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
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
