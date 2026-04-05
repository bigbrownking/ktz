'use client';

import { Gauge, Thermometer, Droplets, Wind } from 'lucide-react';
import { TelemetryData } from '@/shared/lib/mock-data';

interface Props {
  telemetry: TelemetryData;
}

export function DieselPanel({ telemetry }: Props) {
  const getStatusColor = (value: number, min: number, max: number, optimal: number) => {
    if (value < min || value > max) return 'text-red-400';
    if (Math.abs(value - optimal) > (max - min) * 0.3) return 'text-orange-400';
    return 'text-green-400';
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-5 h-5 text-cyan-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Обороты</h4>
        </div>
        <div className={`text-4xl font-bold ${getStatusColor(telemetry.rpm, 1500, 2200, 1900)}`}>
          {Math.round(telemetry.rpm)}
        </div>
        <div className="text-sm text-slate-500 mt-2">об/мин</div>
        <div className="mt-4 text-xs text-slate-500">Норма: 1500-2200 об/мин</div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-5 h-5 text-blue-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Температура воды</h4>
        </div>
        <div className={`text-4xl font-bold ${getStatusColor(telemetry.waterTemperature, 75, 95, 85)}`}>
          {Math.round(telemetry.waterTemperature)}°C
        </div>
        <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              telemetry.waterTemperature > 93 ? 'bg-red-400' :
              telemetry.waterTemperature > 90 ? 'bg-orange-400' : 'bg-blue-400'
            }`}
            style={{ width: `${(telemetry.waterTemperature / 100) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">Норма: 75-95°C</div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-5 h-5 text-orange-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Температура двигателя</h4>
        </div>
        <div className={`text-4xl font-bold ${getStatusColor(telemetry.temperature, 80, 105, 92)}`}>
          {Math.round(telemetry.temperature)}°C
        </div>
        <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              telemetry.temperature > 100 ? 'bg-red-400' :
              telemetry.temperature > 95 ? 'bg-orange-400' : 'bg-green-400'
            }`}
            style={{ width: `${(telemetry.temperature / 110) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">Норма: 80-105°C</div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Температура масла</h4>
        </div>
        <div className={`text-4xl font-bold ${getStatusColor(telemetry.oilTemperature, 90, 110, 100)}`}>
          {Math.round(telemetry.oilTemperature)}°C
        </div>
        <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              telemetry.oilTemperature > 108 ? 'bg-red-400' :
              telemetry.oilTemperature > 105 ? 'bg-orange-400' : 'bg-amber-400'
            }`}
            style={{ width: `${(telemetry.oilTemperature / 115) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">Норма: 90-110°C</div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-cyan-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Давление масла</h4>
        </div>
        <div className={`text-4xl font-bold ${getStatusColor(telemetry.oilPressure, 3.5, 4.5, 4.0)}`}>
          {telemetry.oilPressure.toFixed(1)}
        </div>
        <div className="text-sm text-slate-500 mt-2">бар</div>
        <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              telemetry.oilPressure < 3.5 ? 'bg-red-400' :
              telemetry.oilPressure < 3.8 ? 'bg-orange-400' : 'bg-cyan-400'
            }`}
            style={{ width: `${(telemetry.oilPressure / 5.0) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">Норма: 3.5-4.5 бар</div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wind className="w-5 h-5 text-purple-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Турбина</h4>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-slate-500 mb-1">Обороты</div>
            <div className={`text-2xl font-bold ${getStatusColor(telemetry.turbineSpeed, 10000, 15000, 13000)}`}>
              {Math.round(telemetry.turbineSpeed).toLocaleString('ru-RU')} об/мин
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500 mb-1">Давление наддува</div>
            <div className={`text-2xl font-bold ${getStatusColor(telemetry.turbinePressure, 1.5, 2.3, 1.9)}`}>
              {telemetry.turbinePressure.toFixed(1)} бар
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">Норма: 10k-15k об/мин, 1.5-2.3 бар</div>
      </div>
    </div>
  );
}
