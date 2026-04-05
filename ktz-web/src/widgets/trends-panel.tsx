'use client';

import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useTelemetryContext } from '@/shared/lib/telemetry-context';

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
  },
};

function formatTick(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

type TimeRange = '1h' | '4h' | '8h' | '24h';

const RANGE_MS: Record<TimeRange, number> = {
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '8h': 8 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

export function TrendsPanel() {
  const { buffer } = useTelemetryContext();
  const [timeRange, setTimeRange] = useState<TimeRange>('4h');

  const labelMap: Record<TimeRange, string> = {
    '1h': '1 ч',
    '4h': '4 ч',
    '8h': '8 ч',
    '24h': '24 ч',
  };

  const data = useMemo(() => {
    const cutoff = Date.now() - RANGE_MS[timeRange];
    const sorted = [...buffer].filter(s => s.ts >= cutoff).sort((a, b) => a.ts - b.ts);
    return sorted.map(s => ({
      time: formatTick(s.ts),
      ts: s.ts,
      speed: s.speed,
      rpm: s.rpm,
      temperature: s.temperature,
      oilPressure: s.oilPressure,
      voltage: s.voltage,
      fuelLevel: s.fuelLevel,
      current: s.current,
    }));
  }, [buffer, timeRange]);

  const hasData = data.length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Тренды параметров
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Графики строятся по реальному буферу телеметрии (до 15 минут). Диапазон ниже обрезает окно от «сейчас» назад;
            если точек мало, отображается всё, что есть в буфере.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['1h', '4h', '8h', '24h'] as TimeRange[]).map((range) => (
            <button
              key={range}
              type="button"
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

      {!hasData && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-400">
          Недостаточно точек в буфере (нужно минимум 2 снимка). Подождите накопления телеметрии или откройте страницу «Кабина» несколько секунд.
        </div>
      )}

      {hasData && (
        <>
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
                <Line yAxisId="left" type="monotone" dataKey="speed" stroke="#06b6d4" strokeWidth={2} name="Скорость (км/ч)" dot={false} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="rpm" stroke="#f59e0b" strokeWidth={2} name="Обороты (об/мин)" dot={false} isAnimationActive={false} />
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
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} name="Двигатель (°C)" dot={false} isAnimationActive={false} />
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
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} label={{ value: 'бар', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="oilPressure" stroke="#06b6d4" strokeWidth={2} name="Давление (бар)" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Напряжение</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis stroke="#94a3b8" domain={['auto', 'auto']} label={{ value: 'В', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="voltage" stroke="#a855f7" strokeWidth={2} name="Напряжение (В)" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Уровень топлива</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="fuelLevel" stroke="#10b981" strokeWidth={2} name="Уровень топлива (%)" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
