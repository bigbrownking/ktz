'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Alert } from '@/shared/lib/mock-data';

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

export function AlertsPanel({ alerts }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismiss = (id: string) => setDismissed(prev => new Set([...prev, id]));

  const visible = alerts.filter(a => !dismissed.has(a.id));
  const criticalAlerts = visible.filter(a => a.level === 'critical');
  const warningAlerts = visible.filter(a => a.level === 'warning');
  const infoAlerts = visible.filter(a => a.level === 'info');

  const historyItems = [
    { time: '2 часа назад', title: 'Превышение температуры масла', level: 'warning' as const, source: 'Дизель' },
    { time: '4 часа назад', title: 'Профилактическая проверка завершена', level: 'info' as const, source: 'Система' },
    { time: '6 часов назад', title: 'Низкое напряжение аккумулятора', level: 'warning' as const, source: 'Электрика' },
    { time: '10 часов назад', title: 'Плановое техобслуживание', level: 'info' as const, source: 'Обслуживание' },
    { time: '15 часов назад', title: 'Обнаружена утечка в цилиндре 2', level: 'critical' as const, source: 'Тормоза' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {[
          { count: criticalAlerts.length, label: 'Критические', sublabel: 'Требуют немедленного действия', color: 'red' },
          { count: warningAlerts.length, label: 'Предупреждения', sublabel: 'Требуют внимания', color: 'orange' },
          { count: infoAlerts.length, label: 'Информация', sublabel: 'Для справки', color: 'blue' },
        ].map(({ count, label, sublabel, color }) => (
          <div key={label} className={`bg-gradient-to-br from-${color}-900/20 to-${color}-950/20 border border-${color}-500/30 rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm text-${color}-400 uppercase tracking-wider`}>{label}</div>
              <AlertTriangle className={`w-5 h-5 text-${color}-400`} />
            </div>
            <div className={`text-4xl font-bold text-${color}-400`}>{count}</div>
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
          {historyItems.map((item, idx) => {
            const colors = getAlertColor(item.level);
            return (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${colors.text}`}>{item.title}</div>
                  <div className="text-xs text-slate-500">{item.source}</div>
                </div>
                <div className="text-xs text-slate-500">{item.time}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
