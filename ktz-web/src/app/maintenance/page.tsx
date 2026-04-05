'use client';

import { Wrench, Clock, CheckCircle, AlertCircle, Calendar, TrendingUp } from 'lucide-react';

const components = [
  { id: 1, name: 'Генератор 8', health: 92, status: 'good', nextMaintenance: '2 апр 2026', lastCheck: '15 мар 2026', workingHours: 1240, criticalParts: 'Щётки: 85%' },
  { id: 2, name: 'Тормозная система', health: 78, status: 'warning', nextMaintenance: '8 апр 2026', lastCheck: '20 мар 2026', workingHours: 2150, criticalParts: 'Колодки: 62%' },
  { id: 3, name: 'Тяговый блок', health: 95, status: 'good', nextMaintenance: '15 апр 2026', lastCheck: '1 апр 2026', workingHours: 980, criticalParts: 'Тяговые двигатели: 95%' },
  { id: 4, name: 'Охлаждающая система', health: 88, status: 'good', nextMaintenance: '10 апр 2026', lastCheck: '25 мар 2026', workingHours: 1580, criticalParts: 'Радиатор: 88%' },
  { id: 5, name: 'Система управления', health: 65, status: 'critical', nextMaintenance: '5 апр 2026', lastCheck: '18 мар 2026', workingHours: 3200, criticalParts: 'Датчики: 45%' },
  { id: 6, name: 'Кабинные системы', health: 90, status: 'good', nextMaintenance: '12 апр 2026', lastCheck: '30 мар 2026', workingHours: 1100, criticalParts: 'Дисплеи: 92%' },
];

const maintenanceSchedule = [
  { date: '5 апр 2026', component: 'Система управления', type: 'Критическое', priority: 'high' },
  { date: '8 апр 2026', component: 'Тормозная система', type: 'Плановое', priority: 'medium' },
  { date: '10 апр 2026', component: 'Охлаждающая система', type: 'Плановое', priority: 'medium' },
  { date: '12 апр 2026', component: 'Кабинные системы', type: 'Проверка', priority: 'low' },
  { date: '15 апр 2026', component: 'Тяговый блок', type: 'Плановое', priority: 'medium' },
];

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
  const averageHealth = Math.round(components.reduce((sum, c) => sum + c.health, 0) / components.length);
  const goodCount = components.filter(c => c.status === 'good').length;
  const warningCount = components.filter(c => c.status === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        {[
          { icon: <TrendingUp className="w-5 h-5 text-cyan-400" />, label: 'Общее здоровье', value: `${averageHealth}%`, sub: 'Среднее по всем системам', color: 'text-cyan-400' },
          { icon: <CheckCircle className="w-5 h-5 text-green-400" />, label: 'Исправно', value: goodCount.toString(), sub: `Из ${components.length} систем`, color: 'text-green-400' },
          { icon: <AlertCircle className="w-5 h-5 text-orange-400" />, label: 'Требует внимания', value: warningCount.toString(), sub: 'Систем', color: 'text-orange-400' },
          { icon: <Calendar className="w-5 h-5 text-red-400" />, label: 'Ближайшее ТО', value: '5 апр', sub: 'Через 1 день', color: 'text-red-400' },
        ].map(({ icon, label, value, sub, color }) => (
          <div key={label} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              {icon}
              <div className="text-sm text-slate-400">{label}</div>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-slate-500 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-cyan-400">Состояние компонентов</h3>
          </div>

          <div className="space-y-4">
            {components.map((component) => {
              const sc = statusColors[component.status as keyof typeof statusColors];
              return (
                <div key={component.id} className={`border rounded-xl p-4 ${sc.bg}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white mb-1">{component.name}</h4>
                      <div className="text-xs text-slate-400">Наработка: {component.workingHours.toLocaleString()} ч</div>
                    </div>
                    <div className={`text-3xl font-bold ${sc.text}`}>{component.health}%</div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 rounded-full ${sc.bar}`} style={{ width: `${component.health}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-slate-400">{component.criticalParts}</div>
                      <div className="text-slate-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        След. ТО: {component.nextMaintenance}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-cyan-400">График обслуживания</h3>
            </div>

            <div className="space-y-3">
              {maintenanceSchedule.map((item, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-white">{item.component}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${priorityColors[item.priority as keyof typeof priorityColors]}`}>
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    {item.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-6">Статистика обслуживания</h3>
            <div className="space-y-4">
              {[
                { label: 'ТО выполнено в этом месяце', value: '12', width: '80%', barColor: 'bg-green-400' },
                { label: 'Запланировано на апрель', value: '15', width: '60%', barColor: 'bg-cyan-400' },
              ].map(({ label, value, width, barColor }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-lg font-bold text-white">{value}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width }} />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Среднее время ТО</span>
                <span className="text-lg font-bold text-white">2.5ч</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Внеплановые ремонты</span>
                <span className="text-lg font-bold text-orange-400">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
