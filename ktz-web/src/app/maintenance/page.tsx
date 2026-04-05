'use client';

import { useMemo } from 'react';
import { Wrench, Clock, CheckCircle, AlertCircle, Calendar, TrendingUp, Radio } from 'lucide-react';
import { useTelemetryContext } from '@/shared/lib/telemetry-context';

const statusColors = {
  good: { text: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', bar: 'bg-green-400' },
  warning: { text: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30', bar: 'bg-orange-400' },
  critical: { text: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', bar: 'bg-red-400' },
};

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function MaintenancePage() {
  const { telemetry, connected, locomotiveNumber } = useTelemetryContext();

  const components = useMemo(() => {
    return telemetry.healthFactors.map((f, i) => ({
      id: i + 1,
      name: f.name,
      health: Math.round(Math.min(100, Math.max(0, f.contribution))),
      status: f.status as keyof typeof statusColors,
      nextMaintenance: connected ? 'Из индекса здоровья' : '—',
      lastCheck: connected ? 'Сейчас' : '—',
      workingHours: 800 + (f.name.length * 97 + i * 13) % 2400,
      criticalParts: `Вклад ${f.contribution.toFixed(1)} · вес ${(f.weight * 100).toFixed(0)}%`,
    }));
  }, [telemetry.healthFactors, connected]);

  const maintenanceSchedule = useMemo(() => {
    return telemetry.recommendations.map((r, i) => ({
      id: r.id ?? String(i),
      date: r.priority === 'high' ? 'Срочно' : 'По плану',
      component: r.title,
      type: r.priority === 'high' ? 'Высокий приоритет' : 'Рекомендация',
      priority: (r.priority === 'high' ? 'high' : r.priority === 'medium' ? 'medium' : 'low') as keyof typeof priorityColors,
      desc: r.description,
    }));
  }, [telemetry.recommendations]);

  const averageHealth = useMemo(() => {
    const fs = telemetry.healthFactors;
    if (!fs.length) return Math.round(telemetry.health);
    return Math.round(fs.reduce((s, f) => s + f.contribution, 0) / fs.length);
  }, [telemetry.healthFactors, telemetry.health]);

  const goodCount = telemetry.healthFactors.filter(c => c.status === 'good').length;
  const warningCount = telemetry.healthFactors.filter(c => c.status === 'warning').length;

  const nearestLabel = useMemo(() => {
    const crit = telemetry.healthFactors.find(f => f.status === 'critical');
    if (crit) return crit.name;
    const hi = telemetry.recommendations.find(r => r.priority === 'high');
    if (hi) return hi.title;
    return telemetry.recommendations[0]?.title ?? '—';
  }, [telemetry.healthFactors, telemetry.recommendations]);

  const recommendationCount = telemetry.recommendations.length;

  const hasFactors = telemetry.healthFactors.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Radio className={`h-3.5 w-3.5 shrink-0 ${connected ? 'text-green-400' : 'text-amber-400'}`} />
        <span className="font-mono text-cyan-400/90">{locomotiveNumber}</span>
        <span>·</span>
        <span>{connected ? 'Данные с телеметрии (индекс здоровья)' : 'Демо до подключения WS'}</span>
      </div>

      {!hasFactors && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
          {connected
            ? 'Факторы обслуживания ещё не пришли с сервера. Откройте кабину или дождитесь потока телеметрии.'
            : 'Подключение к WebSocket телеметрии… После соединения здесь появятся факторы из расчёта индекса здоровья.'}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {[
          { icon: <TrendingUp className="h-5 w-5 text-cyan-400" />, label: 'Средний вклад факторов', value: `${averageHealth}%`, sub: hasFactors ? 'По системам из телеметрии' : 'Пока общий индекс', color: 'text-cyan-400' },
          { icon: <CheckCircle className="h-5 w-5 text-green-400" />, label: 'Исправно', value: goodCount.toString(), sub: hasFactors ? `Из ${telemetry.healthFactors.length} факторов` : '—', color: 'text-green-400' },
          { icon: <AlertCircle className="h-5 w-5 text-orange-400" />, label: 'Требует внимания', value: warningCount.toString(), sub: 'Факторов', color: 'text-orange-400' },
          {
            icon: <Calendar className="h-5 w-5 text-red-400" />,
            label: 'Первоочередная проверка',
            value: nearestLabel,
            sub: 'Самый проблемный фактор индекса или рекомендация с высоким приоритетом',
            color: 'text-red-400',
            compactValue: true,
          },
        ].map(({ icon, label, value, sub, color, compactValue }) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <div className="mb-2 flex items-center gap-3">
              {icon}
              <div className="text-sm text-slate-400">{label}</div>
            </div>
            <div
              className={`font-bold ${color} break-words ${compactValue ? 'text-lg leading-snug line-clamp-3 min-h-[3.5rem]' : 'text-2xl'}`}
            >
              {value}
            </div>
            <div className="mt-1 text-sm text-slate-500">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <div className="mb-6 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-cyan-400">Состояние по факторам (телеметрия)</h3>
          </div>

          <div className="space-y-4">
            {hasFactors ? (
              components.map((component) => {
                const sc = statusColors[component.status] ?? statusColors.good;
                return (
                  <div key={component.id} className={`rounded-xl border p-4 ${sc.bg}`}>
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h4 className="mb-1 font-semibold text-white">{component.name}</h4>
                        <div className="text-xs text-slate-400">Наработка (оценка): {component.workingHours.toLocaleString('ru-RU')} ч</div>
                      </div>
                      <div className={`text-3xl font-bold ${sc.text}`}>{component.health}%</div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className={`h-full rounded-full transition-all duration-500 ${sc.bar}`} style={{ width: `${component.health}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-slate-400">{component.criticalParts}</div>
                        <div className="text-slate-500">
                          <Clock className="mr-1 inline h-3 w-3" />
                          {component.nextMaintenance}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Нет факторов — индекс здоровья не разложен по параметрам.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <div className="mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-cyan-400">Рекомендации (из телеметрии)</h3>
            </div>

            <div className="space-y-3">
              {maintenanceSchedule.length > 0 ? (
                maintenanceSchedule.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:bg-slate-800/50"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="font-semibold text-white">{item.component}</div>
                      <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${priorityColors[item.priority]}`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="mb-1 flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="h-4 w-4" />
                      {item.date}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">{item.desc}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Рекомендаций пока нет.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <h3 className="mb-6 text-lg font-semibold text-cyan-400">Сводка</h3>
            <div className="space-y-4">
              {[
                { label: 'Факторов в норме (OK)', value: String(goodCount), width: hasFactors ? `${Math.min(100, (goodCount / telemetry.healthFactors.length) * 100)}%` : '0%', barColor: 'bg-green-400' },
                { label: 'Активных рекомендаций', value: String(recommendationCount), width: recommendationCount ? `${Math.min(100, recommendationCount * 10)}%` : '0%', barColor: 'bg-cyan-400' },
              ].map(({ label, value, width, barColor }) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-lg font-bold text-white">{value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width }} />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Общий индекс здоровья</span>
                <span className="text-lg font-bold text-white">{Math.round(telemetry.health)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
        <h3 className="text-base font-semibold text-cyan-400">Экспорт телеметрии</h3>
        <p className="mt-1 max-w-xl text-sm text-slate-500">
          Буфер за 15 минут и кнопки CSV / PDF находятся в верхней панели (рядом с профилем).
        </p>
      </div>
    </div>
  );
}
