'use client';

import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Alert, allAlerts } from '@/shared/lib/mock-data';

interface Props {
  alerts: Alert[];
}

const getAlertColor = (level: Alert['level']) => {
  switch (level) {
    case 'critical':
      return { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400', iconBg: 'bg-red-500/20' };
    case 'warning':
      return { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400', iconBg: 'bg-orange-500/20' };
    case 'info':
      return { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-400', iconBg: 'bg-blue-500/20' };
  }
};

const formatTimestamp = (timestamp: Date) => {
  const diff = Math.floor((Date.now() - timestamp.getTime()) / 1000);
  if (diff < 60) return `${diff} сек назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return timestamp.toLocaleString('ru-RU');
};

const SUMMARY_CARDS: {
  countKey: 'critical' | 'warning' | 'info';
  label: string;
  sublabel: string;
  card: string;
  labelText: string;
  accent: string;
  icon: string;
}[] = [
  {
    countKey: 'critical',
    label: 'Критические',
    sublabel: 'Требуют немедленного действия',
    card: 'bg-gradient-to-br from-red-900/20 to-red-950/20 border border-red-500/30',
    labelText: 'text-red-400',
    accent: 'text-red-400',
    icon: 'text-red-400',
  },
  {
    countKey: 'warning',
    label: 'Предупреждения',
    sublabel: 'Требуют внимания',
    card: 'bg-gradient-to-br from-orange-900/20 to-orange-950/20 border border-orange-500/30',
    labelText: 'text-orange-400',
    accent: 'text-orange-400',
    icon: 'text-orange-400',
  },
  {
    countKey: 'info',
    label: 'Информация',
    sublabel: 'Для справки',
    card: 'bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-blue-500/30',
    labelText: 'text-blue-400',
    accent: 'text-blue-400',
    icon: 'text-blue-400',
  },
];

export function AlertsPanel({ alerts }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [timeTick, setTimeTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTimeTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const dismiss = (id: string) => setDismissed(prev => new Set([...prev, id]));

  const visible = alerts.filter(a => !dismissed.has(a.id));
  const criticalAlerts = visible.filter(a => a.level === 'critical');
  const warningAlerts = visible.filter(a => a.level === 'warning');
  const infoAlerts = visible.filter(a => a.level === 'info');

  const counts = useMemo(
    () => ({
      critical: criticalAlerts.length,
      warning: warningAlerts.length,
      info: infoAlerts.length,
    }),
    [criticalAlerts.length, warningAlerts.length, infoAlerts.length],
  );

  /** История: сначала активные, затем записи из каталога; время в рендере (тик 1 с) */
  const seen = new Set<string>();
  const historyRows: { key: string; title: string; level: Alert['level']; source: string; ts: Date }[] = [];
  for (const a of visible) {
    if (seen.has(a.title)) continue;
    seen.add(a.title);
    historyRows.push({
      key: `a-${a.id}`,
      title: a.title,
      level: a.level,
      source: a.source ?? 'Система',
      ts: a.timestamp,
    });
  }
  let k = 0;
  for (const a of allAlerts) {
    if (historyRows.length >= 6) break;
    if (seen.has(a.title)) continue;
    seen.add(a.title);
    k += 1;
    historyRows.push({
      key: `c-${a.id}-${k}`,
      title: a.title,
      level: a.level,
      source: a.source ?? 'Система',
      ts: new Date(Date.now() - k * 2 * 3600000),
    });
  }

  void timeTick;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {SUMMARY_CARDS.map(({ countKey, label, sublabel, card, labelText, accent, icon }) => (
          <div key={label} className={`rounded-2xl p-6 ${card}`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm uppercase tracking-wider ${labelText}`}>{label}</div>
              <AlertTriangle className={`w-5 h-5 ${icon}`} />
            </div>
            <div className={`text-4xl font-bold ${accent}`}>{counts[countKey]}</div>
            <div className="text-sm text-slate-400 mt-2">{sublabel}</div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Активные уведомления</h3>
        <div className="space-y-3">
          {visible.length === 0 ? (
            <div className="text-center py-8 text-slate-500">Нет активных уведомлений</div>
          ) : (
            visible.map((alert) => {
              const colors = getAlertColor(alert.level);
              return (
                <div
                  key={alert.id}
                  className={`${colors.bg} border-2 ${colors.border} rounded-xl p-4 transition-all ${
                    alert.level === 'critical' ? 'animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 ${colors.iconBg} rounded-full flex items-center justify-center`}>
                      <AlertTriangle className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className={`font-bold ${colors.text} text-lg`}>{alert.title}</h4>
                        <button
                          onClick={() => dismiss(alert.id)}
                          className="flex-shrink-0 text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg"
                          title="Закрыть"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(alert.timestamp)}
                        </div>
                        {alert.source && (
                          <>
                            <span>•</span>
                            <span>{alert.source}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">История за последние 24 часа</h3>
        <div className="space-y-2">
          {historyRows.map((item) => {
            const colors = getAlertColor(item.level);
            return (
              <div
                key={item.key}
                className="flex items-center gap-4 p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${colors.text}`}>{item.title}</div>
                  <div className="text-xs text-slate-500">{item.source}</div>
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap">{formatTimestamp(item.ts)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
