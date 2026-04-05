'use client';

import { Zap, Battery, Activity } from 'lucide-react';
import { TelemetryData } from '@/shared/lib/mock-data';

interface Props {
  telemetry: TelemetryData;
}

export function ElectricPanel({ telemetry }: Props) {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-yellow-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Ток</h4>
        </div>
        <div className={`text-4xl font-bold ${
          telemetry.current > 1000 ? 'text-red-400' :
          telemetry.current > 900 ? 'text-orange-400' : 'text-yellow-400'
        }`}>
          {Math.round(telemetry.current)}
        </div>
        <div className="text-sm text-slate-500 mt-2">Ампер</div>
        <div className="mt-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                telemetry.current > 1000 ? 'bg-red-400' :
                telemetry.current > 900 ? 'bg-orange-400' : 'bg-yellow-400'
              }`}
              style={{ width: `${(telemetry.current / 1200) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">Рабочий диапазон: 700-1000 А</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-cyan-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Напряжение</h4>
        </div>
        <div className={`text-4xl font-bold ${
          telemetry.voltage < 3000 ? 'text-red-400' :
          telemetry.voltage < 3100 ? 'text-orange-400' : 'text-cyan-400'
        }`}>
          {Math.round(telemetry.voltage)}
        </div>
        <div className="text-sm text-slate-500 mt-2">Вольт</div>
        <div className="mt-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                telemetry.voltage < 3000 ? 'bg-red-400' :
                telemetry.voltage < 3100 ? 'bg-orange-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${(telemetry.voltage / 3400) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">Норма: 3000-3300 В</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Battery className="w-5 h-5 text-green-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Аккумулятор</h4>
        </div>
        <div className={`text-4xl font-bold ${
          telemetry.batteryVoltage < 105 ? 'text-red-400' :
          telemetry.batteryVoltage < 110 ? 'text-orange-400' : 'text-green-400'
        }`}>
          {Math.round(telemetry.batteryVoltage)}
        </div>
        <div className="text-sm text-slate-500 mt-2">Вольт</div>
        <div className="mt-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                telemetry.batteryVoltage < 105 ? 'bg-red-400' :
                telemetry.batteryVoltage < 110 ? 'bg-orange-400' : 'bg-green-400'
              }`}
              style={{ width: `${(telemetry.batteryVoltage / 130) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">Норма: 110-125 В</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-purple-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Генератор — Мощность</h4>
        </div>
        <div className="text-4xl font-bold text-purple-400">{Math.round(telemetry.generatorOutput)}</div>
        <div className="text-sm text-slate-500 mt-2">кВт</div>
        <div className="mt-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 bg-purple-400"
              style={{ width: `${(telemetry.generatorOutput / 3500) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">Номинальная: 3000 кВт</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Генератор — Напряжение</h4>
        </div>
        <div className="text-4xl font-bold text-blue-400">{Math.round(telemetry.generatorVoltage)}</div>
        <div className="text-sm text-slate-500 mt-2">Вольт</div>
        <div className="mt-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 bg-blue-400"
              style={{ width: `${(telemetry.generatorVoltage / 3400) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">Рабочее: 3150±150 В</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Статус генератора</h4>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">КПД</span>
            <span className="text-lg font-bold text-green-400">94%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Нагрузка</span>
            <span className="text-lg font-bold text-cyan-400">
              {Math.round((telemetry.generatorOutput / 3000) * 100)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Состояние</span>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
              АКТИВЕН
            </span>
          </div>
        </div>
      </div>

      <div className="col-span-3 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Энергопотребление системы
        </h4>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-slate-500 mb-2">Общая мощность</div>
            <div className="text-2xl font-bold text-cyan-400">
              {Math.round((telemetry.voltage * telemetry.current) / 1000)} кВт
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Тяговые двигатели</div>
            <div className="text-2xl font-bold text-white">
              {Math.round(telemetry.generatorOutput * 0.75)} кВт
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Вспомогательные системы</div>
            <div className="text-2xl font-bold text-white">
              {Math.round(telemetry.generatorOutput * 0.15)} кВт
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Резерв</div>
            <div className="text-2xl font-bold text-green-400">
              {Math.round(telemetry.generatorOutput * 0.10)} кВт
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
