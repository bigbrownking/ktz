'use client';

import { Disc, AlertTriangle } from 'lucide-react';
import { TelemetryData } from '@/shared/lib/mock-data';

interface Props {
  telemetry: TelemetryData;
}

export function BrakesPanel({ telemetry }: Props) {
  const getPressureStatus = (pressure: number) => {
    if (pressure < 4.0) return { color: 'text-red-400', bg: 'bg-red-400', status: 'Критично' };
    if (pressure < 4.2) return { color: 'text-orange-400', bg: 'bg-orange-400', status: 'Внимание' };
    return { color: 'text-green-400', bg: 'bg-green-400', status: 'Норма' };
  };

  const mainStatus = getPressureStatus(telemetry.brakePressureMain);
  const cyl1Status = getPressureStatus(telemetry.brakePressureCylinder1);
  const cyl2Status = getPressureStatus(telemetry.brakePressureCylinder2);
  const cyl3Status = getPressureStatus(telemetry.brakePressureCylinder3);
  const cyl4Status = getPressureStatus(telemetry.brakePressureCylinder4);

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Тормозная магистраль (ТМ)
            </h4>
          </div>
          {mainStatus.status !== 'Норма' && (
            <AlertTriangle className={`w-5 h-5 ${mainStatus.color}`} />
          )}
        </div>

        <div className={`text-5xl font-bold ${mainStatus.color}`}>
          {telemetry.brakePressureMain.toFixed(2)}
        </div>
        <div className="text-sm text-slate-500 mt-2">бар</div>

        <div className="mt-4">
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${mainStatus.bg}`}
              style={{ width: `${(telemetry.brakePressureMain / 5.5) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>0</span>
            <span className={mainStatus.color}>{mainStatus.status}</span>
            <span>5.5 бар</span>
          </div>
        </div>

        <div className="mt-6 p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Рабочие параметры</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-500">Рабочее давление</div>
              <div className="text-white font-semibold">4.8-5.2 бар</div>
            </div>
            <div>
              <div className="text-slate-500">Критический минимум</div>
              <div className="text-red-400 font-semibold">&lt;4.0 бар</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Disc className="w-5 h-5 text-purple-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Тормозные цилиндры
          </h4>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Цилиндр 1', value: telemetry.brakePressureCylinder1, status: cyl1Status },
            { label: 'Цилиндр 2', value: telemetry.brakePressureCylinder2, status: cyl2Status },
            { label: 'Цилиндр 3', value: telemetry.brakePressureCylinder3, status: cyl3Status },
            { label: 'Цилиндр 4', value: telemetry.brakePressureCylinder4, status: cyl4Status },
          ].map(({ label, value, status }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">{label}</span>
                <span className={`text-lg font-bold ${status.color}`}>{value.toFixed(2)} бар</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${status.bg}`}
                  style={{ width: `${(value / 5.0) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Disc className="w-5 h-5 text-green-400" />
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Питательная магистраль
          </h4>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-slate-500 mb-2">Давление</div>
            <div className={`text-3xl font-bold ${
              telemetry.brakePressureFeed >= 5.0 ? 'text-green-400' :
              telemetry.brakePressureFeed >= 4.8 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {telemetry.brakePressureFeed.toFixed(2)} бар
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Статус системы</div>
            <div className={`text-lg font-bold ${
              telemetry.brakePressureFeed >= 5.0 ? 'text-green-400' : 'text-orange-400'
            }`}>
              {telemetry.brakePressureFeed >= 5.0 ? 'АКТИВНА' : 'ВНИМАНИЕ'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-2">Рабочий диапазон</div>
            <div className="text-lg font-bold text-white">5.0-5.5 бар</div>
          </div>
        </div>

        <div className="mt-4 h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              telemetry.brakePressureFeed >= 5.0 ? 'bg-green-400' :
              telemetry.brakePressureFeed >= 4.8 ? 'bg-orange-400' : 'bg-red-400'
            }`}
            style={{ width: `${(telemetry.brakePressureFeed / 5.5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
