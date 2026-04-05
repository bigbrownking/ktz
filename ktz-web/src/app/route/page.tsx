'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, AlertTriangle, TrendingDown, Clock, Loader2, Train } from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useTelemetryContext } from '@/shared/lib/telemetry-context';
import { useAuth } from '@/shared/lib/auth-context';
import { routesApi, ApiRoute } from '@/shared/lib/api-client';

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
  },
};

const restrictions = [
  { km: 15, type: 'Ограничение скорости', value: '80 км/ч', reason: 'Ремонт пути' },
  { km: 35, type: 'Временное ограничение', value: '70 км/ч', reason: 'Погодные условия' },
  { km: 48, type: 'Постоянное ограничение', value: '60 км/ч', reason: 'Крутой поворот' },
];

function buildRouteProfile(stations: string[], totalKm: number) {
  const n = stations.length;
  if (n < 2) return [];
  const step = totalKm / (n - 1);
  return stations.map((station, i) => ({
    km: Math.round(step * i),
    elevation: 100 + Math.sin(i * 0.8) * 30 + i * 5,
    speedLimit: i === 0 || i === n - 1 ? 60 : 80,
    station,
  }));
}

export default function RoutePage() {
  const { telemetry } = useTelemetryContext();
  const { session } = useAuth();
  const [route, setRoute] = useState<ApiRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    routesApi.getAll()
      .then(routes => {
        if (session?.locomotiveNumber) {
          const found = routes.find(r => r.locomotiveNumber === session.locomotiveNumber);
          setRoute(found ?? routes[0] ?? null);
        } else {
          setRoute(routes[0] ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.locomotiveNumber]);

  const stations = route?.stations
    ? route.stations.split(',').map(s => s.trim()).filter(Boolean)
    : ['Отправление', 'Прибытие'];

  const distanceKm = route?.distanceKm ?? 100;
  const routeProfile = buildRouteProfile(stations, distanceKm);
  const etaH = route?.estimatedMinutes ? Math.floor(route.estimatedMinutes / 60) : 0;
  const etaM = route?.estimatedMinutes ? route.estimatedMinutes % 60 : 0;
  const avgSpeed = route?.distanceKm && route?.estimatedMinutes
    ? Math.round(route.distanceKm / (route.estimatedMinutes / 60))
    : 68;

  const currentSt = route?.origin ?? telemetry.route.currentStation;
  const nextSt = stations[1] ?? route?.destination ?? telemetry.route.nextStation;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {route && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl px-5 py-3 flex items-center gap-3">
          <Train className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div>
            <span className="font-bold text-white">{route.origin}</span>
            <span className="text-slate-400 mx-2">→</span>
            <span className="font-bold text-white">{route.destination}</span>
          </div>
          {route.locomotiveNumber && (
            <div className="ml-auto flex items-center gap-1.5 bg-slate-800 rounded-lg px-2.5 py-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-cyan-400 font-mono font-semibold">{route.locomotiveNumber}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <MapPin className="w-5 h-5 text-cyan-400" />, label: 'Текущая станция', value: currentSt, sub: null },
          { icon: <Navigation className="w-5 h-5 text-green-400" />, label: 'Следующая станция', value: nextSt, sub: `${telemetry.route.distance} км` },
          { icon: <TrendingDown className="w-5 h-5 text-orange-400" />, label: 'Текущий уклон', value: `${telemetry.route.gradient}%`, sub: 'Спуск' },
          { icon: <AlertTriangle className="w-5 h-5 text-red-400" />, label: 'Ограничения', value: restrictions.length.toString(), sub: 'На маршруте' },
        ].map(({ icon, label, value, sub }) => (
          <div key={label} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              {icon}
              <div className="text-sm text-slate-400">{label}</div>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            {sub && <div className="text-sm text-slate-500 mt-1">{sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">Профиль маршрута</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={routeProfile}>
              <defs>
                <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="km" stroke="#94a3b8"
                label={{ value: 'Километры', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8"
                label={{ value: 'Высота (м)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="elevation" stroke="#06b6d4" strokeWidth={2} fill="url(#colorElevation)" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4">
            <h4 className="text-sm font-semibold text-slate-400 mb-3">Ограничения скорости</h4>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={routeProfile}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="km" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip {...tooltipStyle} />
                <Line type="stepAfter" dataKey="speedLimit" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          {stations.length > 2 && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Остановки</h3>
              <div className="space-y-0">
                {stations.map((st, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full border-2 mt-0.5 flex-shrink-0 ${
                        i === 0 ? 'border-cyan-400 bg-cyan-400' :
                        i === stations.length - 1 ? 'border-green-400 bg-green-400' :
                        'border-slate-600 bg-slate-800'
                      }`} />
                      {i < stations.length - 1 && <div className="w-px flex-1 bg-slate-700 my-0.5" style={{ minHeight: '16px' }} />}
                    </div>
                    <span className={`text-sm pb-3 ${
                      i === 0 ? 'text-cyan-400 font-semibold' :
                      i === stations.length - 1 ? 'text-green-400 font-semibold' :
                      'text-slate-400'
                    }`}>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Ограничения</h3>
            </div>
            <div className="space-y-2">
              {restrictions.map((r, idx) => (
                <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div className="text-xs font-semibold text-red-400">{r.type}</div>
                    <div className="text-xs text-slate-500">КМ {r.km}</div>
                  </div>
                  <div className="text-base font-bold text-white">{r.value}</div>
                  <div className="text-xs text-slate-400">{r.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Детальная информация о маршруте
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Общая длина маршрута', value: `${distanceKm} км` },
            { label: 'Время в пути', value: `${etaH}ч ${etaM}мин` },
            { label: 'Средняя скорость', value: `${avgSpeed} км/ч` },
            { label: 'Максимальный уклон', value: `${telemetry.route.gradient}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-sm text-slate-400 mb-2">{label}</div>
              <div className="text-2xl font-bold text-white">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
