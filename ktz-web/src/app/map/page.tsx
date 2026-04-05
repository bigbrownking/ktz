'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Cpu, AlertTriangle, Zap, MapPin, Star } from 'lucide-react';
import { MapTrain } from '@/shared/lib/fleet-data';
import { useAuth } from '@/shared/lib/auth-context';
import { isAdmin } from '@/shared/lib/auth-store';
import { useTelemetryContext } from '@/shared/lib/telemetry-context';
import { mergeMapTrainWithTelemetry } from '@/shared/lib/live-train-merge';

const FleetMap = dynamic(
  () => import('@/widgets/fleet-map').then(m => m.FleetMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center text-slate-500" style={{ height: '640px' }}>
        <div className="flex flex-col items-center gap-3">
          <MapPin className="w-8 h-8 text-cyan-500 animate-pulse" />
          <span>Загрузка карты...</span>
        </div>
      </div>
    ),
  },
);

function healthColor(cat: MapTrain['healthCategory']) {
  if (cat === 'Норма') return 'text-green-400';
  if (cat === 'Внимание') return 'text-amber-400';
  return 'text-red-400';
}
function healthBg(cat: MapTrain['healthCategory']) {
  if (cat === 'Норма') return 'bg-green-500/20 border-green-500/30';
  if (cat === 'Внимание') return 'bg-amber-500/20 border-amber-500/30';
  return 'bg-red-500/20 border-red-500/30';
}

export default function MapPage() {
  const { session } = useAuth();
  const myLocoNumber = session?.locomotiveNumber ?? null;
  const { telemetry, locomotiveNumber: telemetryLoco } = useTelemetryContext();

  /** На карте «мой» поезд = тот же номер, что в JWT; ФИО берём из сессии, если маршрут в API без машиниста */
  const sessionDriver = useMemo(() => {
    if (!session || isAdmin(session) || !session.locomotiveNumber) return null;
    return {
      locomotiveNumber: session.locomotiveNumber,
      firstName: session.name,
      lastName: session.surname,
      photoUrl: session.photoUrl,
      age: session.age,
    };
  }, [session]);

  const [trains, setTrains] = useState<MapTrain[]>([]);
  const [focusLoco, setFocusLoco] = useState<string | null>(null);

  useEffect(() => {
    if (myLocoNumber) setFocusLoco(myLocoNumber);
  }, [myLocoNumber]);

  const handleTrainsChange = useCallback((updated: MapTrain[]) => {
    setTrains(updated);
  }, []);

  const sorted = trains.slice().sort((a, b) => {
    if (myLocoNumber) {
      if (a.locomotiveNumber === myLocoNumber) return -1;
      if (b.locomotiveNumber === myLocoNumber) return 1;
    }
    return b.health - a.health;
  });

  const totalTrains = trains.length;
  const normalCount = trains.filter(t => t.healthCategory === 'Норма').length;
  const warningCount = trains.filter(t => t.healthCategory === 'Внимание').length;
  const criticalCount = trains.filter(t => t.healthCategory === 'Критично').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: <Activity className="w-5 h-5 text-cyan-400" />, label: 'Активных локомотивов', value: totalTrains, color: 'text-cyan-400' },
          { icon: <Cpu className="w-5 h-5 text-green-400" />, label: 'В норме', value: normalCount, color: 'text-green-400' },
          { icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, label: 'Требуют внимания', value: warningCount, color: 'text-amber-400' },
          { icon: <Zap className="w-5 h-5 text-red-400" />, label: 'Критическое состояние', value: criticalCount, color: 'text-red-400' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="bg-[#0f1629] border border-[#1e2a45] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              {icon}
              <span className="text-slate-400 text-sm">{label}</span>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 items-start lg:items-stretch">
        <div className="col-span-8 min-h-0 min-w-0">
          <div className="bg-[#0f1629] border border-[#1e2a45] rounded-xl overflow-visible h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2a45] rounded-t-xl overflow-hidden shrink-0">
              <h2 className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">
                Карта поездов — Казахстан
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="text-slate-400 hidden sm:inline">
                  Выберите поезд — на карте подсветится весь маршрут
                </span>
                {myLocoNumber && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    Мой: {myLocoNumber}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Норма
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Внимание
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Критично
                </span>
              </div>
            </div>
            <FleetMap
              focusLoco={focusLoco}
              myLocoNumber={myLocoNumber}
              sessionDriver={sessionDriver}
              onTrainsChange={handleTrainsChange}
              onFocusLocoChange={setFocusLoco}
            />
          </div>
        </div>

        <div className="col-span-4 flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:max-h-[calc(640px+3.25rem)] lg:h-[calc(640px+3.25rem)]">
          <div className="shrink-0 px-1">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              {myLocoNumber ? 'Поезда' : 'Активные локомотивы'}
            </h3>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin] flex flex-col gap-3">
          {trains.length === 0 && (
            <div className="bg-[#0f1629] border border-[#1e2a45] rounded-xl p-6 text-center">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Подключение к серверу...</p>
            </div>
          )}

          {sorted.map(t => {
            const train = mergeMapTrainWithTelemetry(t, telemetryLoco, telemetry);
            const isMyTrain = myLocoNumber && train.locomotiveNumber === myLocoNumber;
            return (
              <button
                key={train.locomotiveNumber}
                onClick={() => setFocusLoco(prev => prev === train.locomotiveNumber ? null : train.locomotiveNumber)}
                className={`w-full text-left border rounded-xl p-4 transition-all ${
                  isMyTrain
                    ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20'
                    : focusLoco === train.locomotiveNumber
                      ? 'bg-cyan-500/10 border-cyan-500/50'
                      : 'bg-[#0f1629] border-[#1e2a45] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isMyTrain && (
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                    )}
                    <span className={`font-bold text-sm ${isMyTrain ? 'text-amber-300' : 'text-white'}`}>
                      {train.locomotiveNumber}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                      {train.type}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${healthBg(train.healthCategory)} ${healthColor(train.healthCategory)}`}>
                    {train.healthCategory}
                  </span>
                </div>

                {isMyTrain && (
                  <div className="text-xs text-amber-400/80 font-semibold mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    Мой локомотив
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  {train.driver.photoUrl && train.driver.photoUrl !== '/drivers/placeholder.jpg' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={train.driver.photoUrl} alt={train.driver.firstName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-400 text-xs font-bold">
                        {(train.driver.firstName?.[0] ?? '') + (train.driver.lastName?.[0] ?? '')}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="text-white text-xs font-semibold">
                      {train.driver.firstName} {train.driver.lastName}
                    </div>
                    {train.driver.age > 0 && (
                      <div className="text-slate-500 text-xs">{train.driver.age} лет</div>
                    )}
                  </div>
                </div>

                {train.routeFrom && (
                  <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                    {train.routeFrom} → {train.routeTo}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900 rounded-lg p-2">
                    <div className="text-slate-500 text-xs mb-1">Скорость</div>
                    <div className={`font-bold text-sm ${healthColor(train.healthCategory)}`}>
                      {Math.round(train.speed)} км/ч
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-2">
                    <div className="text-slate-500 text-xs mb-1">Здоровье</div>
                    <div className={`font-bold text-sm ${healthColor(train.healthCategory)}`}>
                      {Math.round(train.health)}%
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
