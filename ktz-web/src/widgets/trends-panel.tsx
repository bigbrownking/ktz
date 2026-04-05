'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
  },
};

const generateTrendData = (hours: number) => {
  const data = [];
  for (let i = hours * 6; i >= 0; i--) {
    const time = new Date();
    time.setMinutes(time.getMinutes() - i * 10);
    data.push({
      time: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
      speed: 70 + Math.random() * 20 + Math.sin(i / 2) * 10,
      rpm: 1800 + Math.random() * 200 + Math.cos(i / 2) * 100,
      temperature: 90 + Math.random() * 8 + Math.sin(i / 3) * 5,
      oilPressure: 3.5 + Math.random() * 0.8,
      voltage: 3100 + Math.random() * 150,
      fuelConsumption: 400 + Math.random() * 40,
    });
  }
  return data;
};

type TimeRange = '1h' | '4h' | '8h' | '24h';

export function TrendsPanel() {
  const [timeRange, setTimeRange] = useState<TimeRange>('4h');

  const hoursMap: Record<TimeRange, number> = { '1h': 1, '4h': 4, '8h': 8, '24h': 24 };
  const labelMap: Record<TimeRange, string> = { '1h': '1 час', '4h': '4 часа', '8h': '8 часов', '24h': '24 часа' };
  const data = generateTrendData(hoursMap[timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Тренды параметров
        </h3>
        <div className="flex gap-2">
          {(['1h', '4h', '8h', '24h'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                timeRange === range ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {labelMap[range]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Скорость и обороты</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" stroke="#94a3b8" label={{ value: 'км/ч', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" label={{ value: 'об/мин', angle: 90, position: 'insideRight', fill: '#94a3b8' }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="speed" stroke="#06b6d4" strokeWidth={2} name="Скорость (км/ч)" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="rpm" stroke="#f59e0b" strokeWidth={2} name="Обороты (об/мин)" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Температура двигателя</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis stroke="#94a3b8" label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Двигатель (°C)" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Давление масла</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis stroke="#94a3b8" domain={[3, 5]} label={{ value: 'бар', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="oilPressure" stroke="#06b6d4" strokeWidth={2} name="Давление (бар)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Напряжение</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis stroke="#94a3b8" domain={[3000, 3300]} label={{ value: 'В', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="voltage" stroke="#a855f7" strokeWidth={2} name="Напряжение (В)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Расход топлива</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis stroke="#94a3b8" label={{ value: 'л/ч', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            <Line type="monotone" dataKey="fuelConsumption" stroke="#10b981" strokeWidth={2} name="Расход (л/ч)" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
