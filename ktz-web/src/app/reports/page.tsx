'use client';

import { BarChart3, TrendingUp, Clock, Fuel, Thermometer, Activity } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';

const speedData = [
  { time: '10:00', speed: 75, limit: 90 },
  { time: '10:30', speed: 82, limit: 90 },
  { time: '11:00', speed: 78, limit: 80 },
  { time: '11:30', speed: 88, limit: 90 },
  { time: '12:00', speed: 85, limit: 90 },
  { time: '12:30', speed: 72, limit: 70 },
  { time: '13:00', speed: 90, limit: 90 },
  { time: '13:30', speed: 86, limit: 90 },
  { time: '14:00', speed: 80, limit: 80 },
  { time: '14:30', speed: 83, limit: 90 },
];

const fuelData = [
  { hour: '10:00', consumption: 420 },
  { hour: '11:00', consumption: 445 },
  { hour: '12:00', consumption: 380 },
  { hour: '13:00', consumption: 465 },
  { hour: '14:00', consumption: 410 },
];

const temperatureData = [
  { time: '10:00', engine: 88, oil: 92, coolant: 85 },
  { time: '11:00', engine: 92, oil: 95, coolant: 88 },
  { time: '12:00', engine: 95, oil: 98, coolant: 90 },
  { time: '13:00', engine: 98, oil: 102, coolant: 93 },
  { time: '14:00', engine: 94, oil: 96, coolant: 89 },
];

const efficiencyData = [
  { name: 'Оптимальный режим', value: 65, color: '#10b981' },
  { name: 'Ускорение', value: 20, color: '#f59e0b' },
  { name: 'Торможение', value: 10, color: '#06b6d4' },
  { name: 'Простой', value: 5, color: '#64748b' },
];

const alertsHistory = [
  { date: '4 апр', critical: 2, warning: 5, info: 8 },
  { date: '3 апр', critical: 1, warning: 3, info: 12 },
  { date: '2 апр', critical: 0, warning: 4, info: 10 },
  { date: '1 апр', critical: 1, warning: 6, info: 9 },
  { date: '31 мар', critical: 0, warning: 2, info: 11 },
];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
  },
};

const summaryRows = [
  [
    { label: 'Пройдено километров', value: '342 км', color: 'text-white' },
    { label: 'Максимальная скорость', value: '92 км/ч', color: 'text-white' },
    { label: 'Минимальная скорость', value: '45 км/ч', color: 'text-white' },
  ],
  [
    { label: 'Общий расход топлива', value: '1 896 л', color: 'text-white' },
    { label: 'Средний расход', value: '5.5 л/км', color: 'text-white' },
    { label: 'Экономия топлива', value: '+8%', color: 'text-green-400' },
  ],
  [
    { label: 'Время движения', value: '4ч 12м', color: 'text-white' },
    { label: 'Время простоя', value: '18м', color: 'text-white' },
    { label: 'Эффективность', value: '93%', color: 'text-cyan-400' },
  ],
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        {[
          { icon: <Activity className="w-5 h-5 text-cyan-400" />, label: 'Средняя скорость', value: '82 км/ч', trend: '↑ 5% от вчера', trendColor: 'text-green-400' },
          { icon: <Fuel className="w-5 h-5 text-green-400" />, label: 'Расход топлива', value: '424 Л/ч', trend: '↑ 3% от среднего', trendColor: 'text-red-400' },
          { icon: <Clock className="w-5 h-5 text-orange-400" />, label: 'Время в пути', value: '4ч 30м', trend: 'Сегодня', trendColor: 'text-slate-400' },
          { icon: <TrendingUp className="w-5 h-5 text-cyan-400" />, label: 'Эффективность', value: '87%', trend: '↑ 2% от цели', trendColor: 'text-green-400' },
        ].map(({ icon, label, value, trend, trendColor }) => (
          <div key={label} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              {icon}
              <div className="text-sm text-slate-400">{label}</div>
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className={`text-sm mt-1 ${trendColor}`}>{trend}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-cyan-400">График скорости</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip {...tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="speed" stroke="#06b6d4" strokeWidth={3} name="Скорость" dot={{ fill: '#06b6d4', r: 4 }} />
              <Line type="monotone" dataKey="limit" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Ограничение" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Fuel className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-cyan-400">Расход топлива</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fuelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="consumption" fill="#10b981" name="Л/ч" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-cyan-400">Температурные показатели</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={temperatureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip {...tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="engine" stroke="#ef4444" strokeWidth={2} name="Двигатель" dot={{ fill: '#ef4444', r: 3 }} />
              <Line type="monotone" dataKey="oil" stroke="#f59e0b" strokeWidth={2} name="Масло" dot={{ fill: '#f59e0b', r: 3 }} />
              <Line type="monotone" dataKey="coolant" stroke="#06b6d4" strokeWidth={2} name="Охлаждающая жидкость" dot={{ fill: '#06b6d4', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-cyan-400">Распределение режимов работы</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={efficiencyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name ?? ''}: ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {efficiencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-cyan-400">История уведомлений</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={alertsHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip {...tooltipStyle} />
            <Legend />
            <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Критические" radius={[4, 4, 0, 0]} />
            <Bar dataKey="warning" stackId="a" fill="#f59e0b" name="Предупреждения" />
            <Bar dataKey="info" stackId="a" fill="#06b6d4" name="Информационные" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Сводка за сегодня</h3>
        <div className="grid grid-cols-3 gap-6">
          {summaryRows.map((col, ci) => (
            <div key={ci} className="space-y-3">
              {col.map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className={`text-lg font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
