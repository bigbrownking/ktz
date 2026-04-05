'use client';

import { Fuel, Droplets, Gauge } from 'lucide-react';
import { TelemetryData } from '@/shared/lib/mock-data';

interface Props {
  telemetry: TelemetryData;
}

export function FuelPanel({ telemetry }: Props) {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-5 h-5 text-green-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Расход топлива</h4>
        </div>
        <div className="text-4xl font-bold text-green-400">{Math.round(telemetry.fuelConsumption)}</div>
        <div className="text-sm text-slate-500 mt-2">л/ч</div>
        <div className="mt-4">
          <div className="text-xs text-slate-500 mb-2">Средний: 420 л/ч</div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                telemetry.fuelConsumption > 440 ? 'bg-red-400' :
                telemetry.fuelConsumption > 430 ? 'bg-orange-400' : 'bg-green-400'
              }`}
              style={{ width: `${(telemetry.fuelConsumption / 500) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Fuel className="w-5 h-5 text-cyan-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Уровень топлива</h4>
        </div>
        <div className={`text-4xl font-bold ${
          telemetry.fuelLevel < 20 ? 'text-red-400' :
          telemetry.fuelLevel < 40 ? 'text-orange-400' : 'text-cyan-400'
        }`}>
          {Math.round(telemetry.fuelLevel)}%
        </div>
        <div className="text-sm text-slate-500 mt-2">~{Math.round(telemetry.fuelLevel * 35)} литров</div>
        <div className="mt-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                telemetry.fuelLevel < 20 ? 'bg-red-400' :
                telemetry.fuelLevel < 40 ? 'bg-orange-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${telemetry.fuelLevel}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {telemetry.fuelLevel < 20 ? 'Критически низкий уровень!' :
             telemetry.fuelLevel < 40 ? 'Рекомендуется дозаправка' : 'Уровень в норме'}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-blue-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Уровень воды</h4>
        </div>
        <div className={`text-4xl font-bold ${
          telemetry.waterLevel < 70 ? 'text-red-400' :
          telemetry.waterLevel < 85 ? 'text-orange-400' : 'text-blue-400'
        }`}>
          {Math.round(telemetry.waterLevel)}%
        </div>
        <div className="text-sm text-slate-500 mt-2">Охлаждающая система</div>
        <div className="mt-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                telemetry.waterLevel < 70 ? 'bg-red-400' :
                telemetry.waterLevel < 85 ? 'bg-orange-400' : 'bg-blue-400'
              }`}
              style={{ width: `${telemetry.waterLevel}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {telemetry.waterLevel < 70 ? 'Требуется долив!' :
             telemetry.waterLevel < 85 ? 'Уровень ниже нормы' : 'Уровень в норме'}
          </div>
        </div>
      </div>

      <div className="col-span-3 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Эффективность использования топлива
        </h4>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-slate-500 mb-2">Расчётная дальность</div>
            <div className="text-2xl font-bold text-cyan-400">{Math.round(telemetry.estimatedRange)} км</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Расход на 100 км</div>
            <div className="text-2xl font-bold text-white">
              {((telemetry.fuelConsumption / telemetry.speed) * 100).toFixed(1)} л
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Экономия за сегодня</div>
            <div className="text-2xl font-bold text-green-400">+8%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Режим работы</div>
            <div className="text-sm font-bold text-white">{telemetry.efficiencyMode}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
